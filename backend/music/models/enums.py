from django.db import models

class JobStatus(models.TextChoices):
    """GRASP: Pure Fabrication for process state management."""
    PENDING    = "pending",    "Pending"
    PROCESSING = "processing", "Processing"
    COMPLETE   = "complete",   "Complete"
    FAILED     = "failed",     "Failed"

class VoiceType(models.TextChoices):
    """GRASP: Pure Fabrication for domain-specific constraints."""
    MALE = 'male', 'Male'
    FEMALE = 'female', 'Female'
    INSTRUMENTAL = 'instrumental', 'Instrumental'
