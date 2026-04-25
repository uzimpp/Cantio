from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from ..models import MusicCreator, Song
from .serializers import MusicSerializer


@method_decorator(csrf_exempt, name="dispatch")
class LibraryView(View):
    """
    GRASP Controller for the Library Aggregate.

    GET /api/creators/<creator_id>/songs/      -> List all songs in library
    GET /api/creators/<creator_id>/favourites/ -> List only favourited songs
    """

    def get(self, request, creator_id):
        try:
            creator = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)

        # The Library is the aggregate root containing these songs
        songs = Song.objects.filter(library__creator=creator).select_related(
            "generation_job"
        )

        if "favourites" in request.path:
            songs = songs.filter(is_favourited=True)

        songs = songs.order_by("-created_at")
        return JsonResponse({"songs": [MusicSerializer.song_to_json(s) for s in songs]})
