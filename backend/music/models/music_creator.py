import uuid
from django.db import models


class MusicCreator(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    profile_picture = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # qouta is still TBD due to AI platform is not decided yet.
    # generation_quota = models.IntegerField(default=10)

    def __str__(self):
        return f"{self.first_name} ({self.email})"
