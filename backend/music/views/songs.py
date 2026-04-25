import json

from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from ..models import GenerationJob, Library, MusicCreator, Song
from .serializers import MusicSerializer


@method_decorator(csrf_exempt, name="dispatch")
class SongView(View):
    """
    GET    /api/songs/<id>/ -> Detail
    DELETE /api/songs/<id>/ -> Delete
    POST   /api/songs/<id>/favourite/ -> Toggle favourite
    POST   /api/songs/<id>/share/ -> Toggle sharing
    GET    /api/songs/<id>/download/ -> Download audio
    """

    def get(self, request, song_id):
        if "download" in request.path:
            return self._download(song_id)

        try:
            s = Song.objects.get(pk=song_id)
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)
        return JsonResponse({"song": MusicSerializer.song_to_json(s)})

    def delete(self, request, song_id):
        try:
            s = Song.objects.get(pk=song_id)
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)

        if "share" in request.path:
            s.revoke_share()
            return JsonResponse({"song": MusicSerializer.song_to_json(s)})

        s.delete()
        return JsonResponse({"message": "song deleted"})

    def post(self, request, song_id):
        try:
            s = Song.objects.get(pk=song_id)
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)

        if "favourite" in request.path:
            s.toggle_favourite()
            return JsonResponse({"song": MusicSerializer.song_to_json(s)})

        if "share" in request.path:
            s.share()
            return JsonResponse({"song": MusicSerializer.song_to_json(s)})

        return JsonResponse({"error": "invalid action"}, status=400)

    def _download(self, song_id):
        try:
            s = Song.objects.get(pk=song_id)
            if not s.audio_url:
                return JsonResponse({"error": "audio not ready"}, status=404)
            return redirect(s.audio_url)
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)
