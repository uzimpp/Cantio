from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from .music_creator import MusicCreator


class Library(models.Model):
    creator = models.OneToOneField(
        MusicCreator, on_delete=models.CASCADE, related_name="library"
    )
    last_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.creator}'s Library"

    class Meta:
        verbose_name_plural = "libraries"


@receiver(post_save, sender=MusicCreator)
def create_library_for_creator(sender, instance, created, **kwargs):
    if created:
        Library.objects.create(creator=instance)
