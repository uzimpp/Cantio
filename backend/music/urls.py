from django.urls import path
from .views.songs import SongView
from .views.library import LibraryView
from .views.generation import GenerationView
from .views.creators import CreatorView

urlpatterns = [
    # Song generation
    path("songs/generate/", GenerationView.as_view(), name="song_generate"),
    path(
        "songs/<uuid:song_id>/generation-status/",
        GenerationView.as_view(),
        name="generation_status",
    ),
    
    # Song instance operations
    path("songs/<uuid:song_id>/", SongView.as_view(), name="song_detail"),
    path("songs/<uuid:song_id>/download/", SongView.as_view(), name="song_download"),
    path("songs/<uuid:song_id>/favourite/", SongView.as_view(), name="toggle_favourite"),
    path("songs/<uuid:song_id>/share/", SongView.as_view(), name="song_share"),

    # Creator & Library operations
    path("creators/", CreatorView.as_view(), name="creator_list_create"),
    path("creators/<uuid:creator_id>/", CreatorView.as_view(), name="creator_detail"),
    path("creators/<uuid:creator_id>/songs/", LibraryView.as_view(), name="creator_songs"),
    path("creators/<uuid:creator_id>/favourites/", LibraryView.as_view(), name="creator_favourites"),
]
