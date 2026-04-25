from datetime import timedelta
from typing import Optional, Tuple

import requests as http_requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .models import GenerationJob, Library, MusicCreator, Song
from .strategies.factory import get_generator


class AuthService:
    """
    GRASP Indirection & High Cohesion for Authentication.
    Handles domain logic for verifying tokens and managing identity.
    """

    @staticmethod
    def process_google_callback(
        code: str,
    ) -> Tuple[Optional[MusicCreator], Optional[str]]:
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
        occasion: str = "",
    ) -> Tuple[Optional[Song], Optional[GenerationJob], Optional[str]]:
        """
        Orchestrates the creation of a Song and its initial GenerationJob.
        Uses a 'Create Job Early' strategy within a transaction to prevent duplicates.
        """
        library = Library.objects.get(creator=creator)

        # 1. Idempotency Check & Atomic Creation
        # We wrap this in a transaction to ensure Request B sees the job created by Request A.
        with transaction.atomic():
            recent_cutoff = timezone.now() - timedelta(seconds=10)
            existing_job = (
                GenerationJob.objects.filter(
                    song__library=library,
                    song__title=title,
                    prompt=prompt,
                    genre=genre,
                    mood=mood,
                    voice_type=voice_type,
                    occasion=occasion,
                    created_at__gte=recent_cutoff,
                )
                .select_related("song")
                .first()
            )

            if existing_job:
                return existing_job.song, existing_job, None

            # Create the Song (the final asset container)
            song = Song.objects.create(
                library=library,
                title=title,
            )

            # Create the GenerationJob EARLY (the audit trail/recipe)
            # This 'claims' the request so concurrent calls find it.
            job = GenerationJob.objects.create(
                song=song,
                prompt=prompt,
                genre=genre,
                mood=mood,
                voice_type=voice_type,
                occasion=occasion,
                status=GenerationJob.Status.PENDING,
            )

        # 2. Get the strategy and generate (Outside transaction to avoid long-held locks)
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
            job.status = GenerationJob.Status.FAILED
            job.error_message = f"Generation failed: {exc}"
            job.save(update_fields=["status", "error_message"])
            return song, job, f"generation failed: {exc}"

        if result["status"] == "failed":
            job.status = GenerationJob.Status.FAILED
            job.error_message = result.get("error") or "generation failed"
            job.save(update_fields=["status", "error_message"])
            return song, job, job.error_message

        # 3. Update the Job with provider info
        job.provider_job_id = result["provider_job_id"]
        job.status = result["status"]
        job.error_message = result.get("error") or ""
        job.save(update_fields=["provider_job_id", "status", "error_message"])

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
        if job.status in (
            GenerationJob.Status.PENDING,
            GenerationJob.Status.PROCESSING,
        ):
            generator = get_generator()
            result = generator.poll(job.provider_job_id)

            job.status = result["status"]
            job.error_message = result.get("error") or ""
            job.save()

            if job.status == GenerationJob.Status.COMPLETE and result.get("audio_url"):
                job.song.audio_url = result.get("audio_url")
                job.song.duration = result.get("duration")
                job.song.save(update_fields=["audio_url", "duration"])

        return job
