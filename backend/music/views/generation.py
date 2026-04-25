import json

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from ..models import GenerationJob, MusicCreator
from ..services import GenerationService
from .serializers import MusicSerializer


@method_decorator(csrf_exempt, name="dispatch")
class GenerationView(View):
    """
    GRASP Controller: Orchestrates the song generation lifecycle.

    POST /api/songs/generate/ -> Initiate generation.
    GET  /api/songs/<id>/generation-status/ -> Check status.
    """

    def post(self, request):
        """Initiate song generation."""
        try:
            payload = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({"error": "invalid json"}, status=400)

        creator_id = request.session.get("creator_id")
        if not creator_id:
            return JsonResponse({"error": "unauthenticated"}, status=401)

        try:
            creator = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)

        title = (payload.get("title") or "").strip()
        prompt = (payload.get("prompt") or "").strip()

        if not title or not prompt:
            return JsonResponse({"error": "title and prompt are required"}, status=400)

        song, job, error = GenerationService.initiate_generation(
            creator=creator,
            title=title,
            prompt=prompt,
            genre=(payload.get("genre") or "").strip(),
            mood=(payload.get("mood") or "").strip(),
            voice_type=(payload.get("voice_type") or "instrumental").strip(),
            occasion=(payload.get("occasion") or "").strip(),
        )

        if error:
            return JsonResponse({"error": error}, status=502)

        return JsonResponse({"song": MusicSerializer.song_to_json(song)}, status=201)

    def get(self, request, song_id):
        """Check generation status."""
        try:
            job = GenerationJob.objects.select_related("song").get(song_id=song_id)
        except GenerationJob.DoesNotExist:
            return JsonResponse({"error": "generation job not found"}, status=404)

        try:
            job = GenerationService.sync_status(job)
        except Exception as exc:
            return JsonResponse({"error": str(exc)}, status=502)

        return JsonResponse({"job": MusicSerializer.job_to_json(job)})
