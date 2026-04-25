from datetime import timedelta
from typing import Optional, Tuple

from django.db import transaction
from django.utils import timezone

from ..models import GenerationJob, Library, MusicCreator, Song
from ..strategies.factory import get_generator


class GenerationService:
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

            song = Song.objects.create(
                library=library,
                title=title,
            )

            job = GenerationJob.objects.create(
                song=song,
                prompt=prompt,
                genre=genre,
                mood=mood,
                voice_type=voice_type,
                occasion=occasion,
                status=GenerationJob.Status.PENDING,
            )

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

        job.provider_job_id = result["provider_job_id"]
        job.status = result["status"]
        job.error_message = result.get("error") or ""
        job.save(update_fields=["provider_job_id", "status", "error_message"])

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