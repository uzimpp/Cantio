from django.contrib import admin
from .models import MusicCreator, Library, Song


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
    search_fields = ["title", "prompt_description"]
    readonly_fields = ["id", "shareable_url", "created_at"]
