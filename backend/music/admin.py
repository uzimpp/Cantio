from django.contrib import admin
from .models import MusicCreator, Library, Song, GenerationJob


@admin.register(MusicCreator)
class MusicCreatorAdmin(admin.ModelAdmin):
    list_display = ["id", "first_name", "last_name", "email", "created_at"]
    search_fields = ["email", "first_name", "last_name"]
    readonly_fields = ["id", "created_at"]


@admin.register(Library)
class LibraryAdmin(admin.ModelAdmin):
    list_display = ["creator", "last_modified"]


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ["title", "library", "is_private", "is_favourited", "created_at"]
    list_filter = ["is_private", "is_favourited"]
    search_fields = ["title"]
    readonly_fields = ["id", "shareable_url", "created_at"]


@admin.register(GenerationJob)
class GenerationJobAdmin(admin.ModelAdmin):
    list_display = ["song", "status", "voice_type", "updated_at"]
    list_filter = ["status", "voice_type"]
    search_fields = ["song__title", "prompt", "provider_job_id"]
    readonly_fields = ["id", "created_at", "updated_at"]
