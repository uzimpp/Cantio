import uuid
from django.db import models
from .song import Song
from .enums import JobStatus, VoiceType


class GenerationJob(models.Model):
    """
    Tracks the lifecycle of a single song generation request.
    Owns the "recipe" (prompt, genre, etc.) and the "process" status.
    """
    # Re-export Enums for convenience/backwards compatibility
    Status = JobStatus
    VoiceType = VoiceType

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    song = models.OneToOneField(
        Song, on_delete=models.CASCADE, related_name="generation_job"
    )
    
    # Request Parameters (The Recipe)
    prompt = models.TextField()
    genre = models.CharField(max_length=100, blank=True)
    mood = models.CharField(max_length=100, blank=True)
    voice_type = models.CharField(
        max_length=20,
        choices=VoiceType.choices,
        default=VoiceType.INSTRUMENTAL
    )
    occasion = models.CharField(max_length=100, blank=True)

    # Provider info
    provider_job_id = models.CharField(max_length=256, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"GenerationJob({self.song.title!r}, {self.status})"
