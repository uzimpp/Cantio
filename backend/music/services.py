from typing import Tuple, Optional
import requests as http_requests
from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .models import Song, Library, MusicCreator, GenerationJob
from .strategies.factory import get_generator


class AuthService:
    """
    GRASP Indirection & High Cohesion for Authentication.
    Handles domain logic for verifying tokens and managing identity.
    """

    @staticmethod
    def process_google_callback(code: str) -> Tuple[Optional[MusicCreator], Optional[str]]:
        GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

        token_resp = http_requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        if not token_resp.ok:
            return None, "token_error"

        raw_id_token = token_resp.json().get("id_token")
        if not raw_id_token:
            return None, "invalid_token"

        try:
            payload = id_token.verify_oauth2_token(
                raw_id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except Exception:
            return None, "invalid_token"

        creator, _ = MusicCreator.objects.get_or_create(
            email=payload["email"],
            defaults={
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
                "profile_picture": payload.get("picture"),
            },
        )
        return creator, None


class SongService:
    """
    GRASP Indirection & High Cohesion.
    """

    @staticmethod
    def initiate_generation(
        creator: MusicCreator,
        title: str,
        prompt: str,
        genre: str = "",
        mood: str = "",
        voice_type: str = GenerationJob.VoiceType.INSTRUMENTAL,
        occasion: str = ""
    ) -> Tuple[Optional[Song], Optional[GenerationJob], Optional[str]]:
        """
        Orchestrates the creation of a Song and its initial GenerationJob.
        """
        library = Library.objects.get(creator=creator)
        
        # 1. Create the Song (the final asset container)
        song = Song.objects.create(
            library=library,
            title=title,
        )

        # 2. Get the strategy and generate
        generator = get_generator()
        try:
            result = generator.generate(
                title=title,
                prompt=prompt,
                genre=genre,
                mood=mood,
                voice_type=voice_type,
                occasion=occasion,
            )
        except Exception as exc:
            song.delete()
            return None, None, f"generation failed: {exc}"

        if result["status"] == "failed":
            song.delete()
            return None, None, result.get("error") or "generation failed"

        # 3. Create the GenerationJob (the audit trail/recipe)
        job = GenerationJob.objects.create(
            song=song,
            prompt=prompt,
            genre=genre,
            mood=mood,
            voice_type=voice_type,
            occasion=occasion,
            provider_job_id=result["provider_job_id"],
            status=result["status"],
            error_message=result.get("error") or "",
        )

        # Handle immediate completion (e.g., Mock strategy)
        if job.status == GenerationJob.Status.COMPLETE and result.get("audio_url"):
            song.audio_url = result.get("audio_url")
            song.duration = result.get("duration")
            song.save(update_fields=["audio_url", "duration"])

        return song, job, None

    @staticmethod
    def sync_status(job: GenerationJob) -> GenerationJob:
        """
        Polls the strategy and updates the job/song state.
        Once complete, moves final audio data to the Song.
        """
        if job.status in (GenerationJob.Status.PENDING, GenerationJob.Status.PROCESSING):
            generator = get_generator()
            result = generator.poll(job.provider_job_id)

            job.status        = result["status"]
            job.error_message = result.get("error") or ""
            job.save()

            if job.status == GenerationJob.Status.COMPLETE and result.get("audio_url"):
                job.song.audio_url = result.get("audio_url")
                job.song.duration = result.get("duration")
                job.song.save(update_fields=["audio_url", "duration"])
        
        return job
