import os

import requests
from django.conf import settings

from .base import GenerationResult, SongGeneratorStrategy

SUNO_GENERATE_URL = "https://api.sunoapi.org/api/v1/generate"
SUNO_POLL_URL = "https://api.sunoapi.org/api/v1/generate/record-info"

# Map Suno's status strings to our internal vocabulary.
SUNO_STATUS_MAP: dict[str, str] = {
    "PENDING": "pending",
    "TEXT_SUCCESS": "processing",
    "FIRST_SUCCESS": "processing",
    "SUCCESS": "complete",
    "CREATE_TASK_FAILED": "failed",
    "GENERATE_AUDIO_FAILED": "failed",
    "CALLBACK_EXCEPTION": "failed",
    "SENSITIVE_WORD_ERROR": "failed",
}


class SunoSongGeneratorStrategy(SongGeneratorStrategy):
    """
    Live strategy that integrates with the SunoApi.org service.

    - generate(): POSTs to /api/v1/generate and returns the taskId.
    - poll():     GETs /api/v1/generate/record-info to check status/results.

    All requests use Bearer Token authentication via the SUNO_API_KEY
    environment variable. Polling is driven by the client (frontend)
    calling the /generation-status/ endpoint; no background workers needed.
    """

    def __init__(self) -> None:
        self._api_key: str = os.environ["SUNO_API_KEY"]

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def _map_status(self, suno_status: str | None) -> str:
        """Helper to map Suno status strings to internal Status enum."""
        if not suno_status:
            return "pending"
        return SUNO_STATUS_MAP.get(suno_status.upper(), "processing")

    def generate(
        self,
        title: str,
        prompt: str,
        genre: str,
        mood: str,
        voice_type: str,
        occasion: str,
    ) -> GenerationResult:
        from ..models.enums import VoiceType
        model = settings.SUNO_MODEL
        vt = (voice_type or VoiceType.INSTRUMENTAL).lower()
        instrumental = vt == VoiceType.INSTRUMENTAL

        # vocalGender: m / f — only meaningful when not instrumental
        vocal_gender = vt[0] if vt in (VoiceType.MALE, VoiceType.FEMALE) else None

        # style = genre + mood + occasion
        style = " ".join(filter(None, [genre, mood, occasion]))

        # We always use custom mode as requested
        payload: dict = {
            "customMode": True,
            "instrumental": instrumental,
            "model": model,
            "callBackUrl": settings.SUNO_CALLBACK_URL,
            "title": title[:100],  # V5+ max 100 chars
            "style": style[:1000],
        }

        # In Custom Mode: if instrumental is false, prompt is required.
        if not instrumental:
            payload["prompt"] = prompt

        if vocal_gender:
            payload["vocalGender"] = vocal_gender

        resp = requests.post(
            SUNO_GENERATE_URL,
            json=payload,
            headers=self._headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data: dict = resp.json()

        # Check for API-level error even if HTTP was 200
        code = data.get("code")
        if code and code != 200:
            return GenerationResult(
                provider_job_id="unknown",
                status="failed",
                audio_url=None,
                duration=None,
                error=data.get("msg") or f"API Error {code}",
            )

        # Suno returns the taskId in data.taskId
        job_id = None
        if "data" in data and isinstance(data["data"], dict):
            job_id = data["data"].get("taskId")

        # Fallback to other possible locations
        job_id = job_id or data.get("task_id") or data.get("taskId") or data.get("id")

        return GenerationResult(
            provider_job_id=str(job_id),
            status="pending",
            audio_url=None,
            duration=None,
            error=None,
        )

    def poll(self, provider_job_id: str) -> GenerationResult:
        resp = requests.get(
            SUNO_POLL_URL,
            params={"taskId": provider_job_id},
            headers=self._headers(),
            timeout=30,
        )
        resp.raise_for_status()
        root_data: dict = resp.json()

        # Check for API-level error (e.g. 401, 429)
        code = root_data.get("code")
        if code and code != 200:
            return GenerationResult(
                provider_job_id=provider_job_id,
                status="failed",
                audio_url=None,
                duration=None,
                error=root_data.get("msg") or f"API Error {code}",
            )

        # The actual payload is inside the "data" key
        data = root_data.get("data", {})
        suno_status = data.get("status")
        status = self._map_status(suno_status)

        # Capture error details if the task itself failed
        error = data.get("errorMessage") if status == "failed" else None

        # Get clips from data -> response -> sunoData
        clips = data.get("response", {}).get("sunoData", [])

        if not clips and status != "failed":
            return GenerationResult(
                provider_job_id=provider_job_id,
                status=status,
                audio_url=None,
                duration=None,
                error=None,
            )

        # Use the first clip for the result data if available
        audio_url = None
        duration = None
        if clips:
            first_clip = clips[0]
            audio_url = first_clip.get("audioUrl") or first_clip.get("audio_url")
            duration = first_clip.get("duration")
            if duration is not None:
                duration = float(duration)

            # If clip has its own error message and we don't have one yet
            if status == "failed" and not error:
                error = first_clip.get("metadata", {}).get("error_message")

        return GenerationResult(
            provider_job_id=provider_job_id,
            status=status,
            audio_url=audio_url,
            duration=duration,
            error=error or ("Generation failed" if status == "failed" else None),
        )
