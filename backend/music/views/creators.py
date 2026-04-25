from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from ..models import MusicCreator
from .serializers import MusicSerializer


@method_decorator(csrf_exempt, name="dispatch")
class CreatorView(View):
    """
    GRASP Controller for the Creator Resource.

    GET    /api/creators/             -> List all creators
    POST   /api/creators/             -> Create new creator
    GET    /api/creators/<id>/        -> Get detail
    PUT    /api/creators/<id>/        -> Update profile
    DELETE /api/creators/<id>/        -> Delete profile
    """

    def get(self, request, creator_id=None):
        if creator_id:
            try:
                c = MusicCreator.objects.get(pk=creator_id)
                return JsonResponse({"creator": MusicSerializer.creator_to_json(c)})
            except MusicCreator.DoesNotExist:
                return JsonResponse({"error": "creator not found"}, status=404)

        creators = MusicCreator.objects.all()
        return JsonResponse(
            {"creators": [MusicSerializer.creator_to_json(c) for c in creators]}
        )

    def post(self, request):
        payload, err = MusicSerializer.parse_body(request)
        if err:
            return err

        missing = [
            f for f in ["first_name", "last_name", "email"] if not payload.get(f)
        ]
        if missing:
            return JsonResponse(
                {"error": "missing fields", "fields": missing}, status=400
            )

        if MusicCreator.objects.filter(email=payload["email"]).exists():
            return JsonResponse({"error": "email already exists"}, status=400)

        c = MusicCreator.objects.create(
            first_name=payload["first_name"],
            last_name=payload["last_name"],
            email=payload["email"],
            profile_picture=payload.get("profile_picture"),
        )
        return JsonResponse(
            {
                "message": "creator created",
                "creator": MusicSerializer.creator_to_json(c),
            },
            status=201,
        )

    def put(self, request, creator_id):
        payload, err = MusicSerializer.parse_body(request)
        if err:
            return err

        try:
            c = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)

        c.first_name = payload.get("first_name", c.first_name)
        c.last_name = payload.get("last_name", c.last_name)
        c.profile_picture = payload.get("profile_picture", c.profile_picture)
        c.save()
        return JsonResponse(
            {
                "message": "creator updated",
                "creator": MusicSerializer.creator_to_json(c),
            }
        )

    def delete(self, request, creator_id):
        try:
            MusicCreator.objects.get(pk=creator_id).delete()
            return JsonResponse({"message": "creator deleted"})
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)
