from django.urls import path
from . import views

urlpatterns = [
    path(
        "creators/", views.CreatorListCreateView.as_view(), name="creator_list_create"
    ),
    path(
        "creators/<uuid:creator_id>/",
        views.CreatorDetailView.as_view(),
        name="creator_detail",
    ),
    path(
        "creators/<uuid:creator_id>/songs/",
        views.SongListCreateView.as_view(),
        name="creator_songs",
    ),
    path(
        "creators/<uuid:creator_id>/favourites/",
        views.FavouritesView.as_view(),
        name="creator_favourites",
    ),
    path("songs/<uuid:song_id>/", views.SongDetailView.as_view(), name="song_detail"),
    path(
        "songs/<uuid:song_id>/favourite/",
        views.ToggleFavouriteView.as_view(),
        name="toggle_favourite",
    ),
    path(
        "songs/<uuid:song_id>/share/", views.SongShareView.as_view(), name="song_share"
    ),
]
