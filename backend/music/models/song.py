import uuid
from django.db import models
from .library import Library


class Song(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    library = models.ForeignKey(Library, on_delete=models.CASCADE, related_name="songs")
    title = models.CharField(max_length=256)
    prompt_description = models.TextField()
    genre = models.CharField(max_length=100, blank=True)
    mood = models.CharField(max_length=100, blank=True)
    voice_type = models.CharField(max_length=100, blank=True)
    occasion = models.CharField(max_length=100, blank=True)
    duration = models.FloatField(null=True, blank=True)  # duration in seconds
    is_favourited = models.BooleanField(default=False)
    is_private = models.BooleanField(default=True)
    shareable_url = models.UUIDField(null=True, blank=True, unique=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.is_private and self.shareable_url is None:
            self.shareable_url = uuid.uuid4()
        elif self.is_private:
            self.shareable_url = None
        super().save(*args, **kwargs)

    def share(self):
        self.is_private = False
        self.save()

    def revoke_share(self):
        self.is_private = True
        self.save()

    def toggle_favourite(self):
        self.is_favourited = not self.is_favourited
        self.save()
