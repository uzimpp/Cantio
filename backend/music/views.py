import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import MusicCreator, Library, Song


def _parse_body(request):
    try:
        return json.loads(request.body) if request.body else {}, None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "invalid json"}, status=400)


def _serialize_creator(c):
    return {
        "id": c.id,
        "first_name": c.first_name,
        "last_name": c.last_name,
        "email": c.email,
        "profile_picture": c.profile_picture,
        "created_at": c.created_at.isoformat(),
    }


def _serialize_song(s):
    return {
        "id": s.id,
        "title": s.title,
        "prompt_description": s.prompt_description,
        "genre": s.genre,
        "mood": s.mood,
        "voice_type": s.voice_type,
        "occasion": s.occasion,
        "duration": s.duration,
        "is_favourited": s.is_favourited,
        "is_private": s.is_private,
        "shareable_url": str(s.shareable_url) if s.shareable_url else None,
        "created_at": s.created_at.isoformat(),
    }


class CreatorUseCase:
    def list(self):
        return MusicCreator.objects.all()

    def create(self, data):
        return MusicCreator.objects.create(
            first_name=data["first_name"],
            last_name=data["last_name"],
            email=data["email"],
            profile_picture=data.get("profile_picture"),
        )

    def update(self, creator_id, data):
        c = MusicCreator.objects.get(pk=creator_id)
        c.first_name = data.get("first_name", c.first_name)
        c.last_name = data.get("last_name", c.last_name)
        c.profile_picture = data.get("profile_picture", c.profile_picture)
        c.save()
        return c

    def delete(self, creator_id):
        MusicCreator.objects.get(pk=creator_id).delete()


class SongUseCase:
    def list(self, creator):
        return Song.objects.filter(library__creator=creator).order_by("-created_at")

    def list_favourites(self, creator):
        return Song.objects.filter(
            library__creator=creator, is_favourited=True
        ).order_by("-created_at")

    def create(self, creator, data):
        return Song.objects.create(
            library=Library.objects.get(creator=creator),
            title=data["title"],
            prompt_description=data["prompt_description"],
            genre=data.get("genre", ""),
            mood=data.get("mood", ""),
            voice_type=data.get("voice_type", ""),
            occasion=data.get("occasion", ""),
        )

    def update(self, song_id, data):
        s = Song.objects.get(pk=song_id)
        for field in ["title", "genre", "mood", "voice_type", "occasion", "duration"]:
            if field in data:
                setattr(s, field, data[field])
        s.save()
        return s

    def delete(self, song_id):
        Song.objects.get(pk=song_id).delete()

    def toggle_favourite(self, song_id):
        s = Song.objects.get(pk=song_id)
        s.toggle_favourite()
        return s

    def share(self, song_id):
        s = Song.objects.get(pk=song_id)
        s.share()
        return s

    def revoke_share(self, song_id):
        s = Song.objects.get(pk=song_id)
        s.revoke_share()
        return s


creator_uc = CreatorUseCase()
song_uc = SongUseCase()


@method_decorator(csrf_exempt, name="dispatch")
class CreatorListCreateView(View):
    def get(self, request):
        return JsonResponse(
            {"creators": [_serialize_creator(c) for c in creator_uc.list()]}
        )

    def post(self, request):
        payload, err = _parse_body(request)
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
        return JsonResponse(
            {
                "message": "creator created",
                "creator": _serialize_creator(creator_uc.create(payload)),
            },
            status=201,
        )


@method_decorator(csrf_exempt, name="dispatch")
class CreatorDetailView(View):
    def get(self, request, creator_id):
        try:
            return JsonResponse(
                {"creator": _serialize_creator(MusicCreator.objects.get(pk=creator_id))}
            )
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)

    def put(self, request, creator_id):
        payload, err = _parse_body(request)
        if err:
            return err
        try:
            return JsonResponse(
                {
                    "message": "creator updated",
                    "creator": _serialize_creator(
                        creator_uc.update(creator_id, payload)
                    ),
                }
            )
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)

    def delete(self, request, creator_id):
        try:
            creator_uc.delete(creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)
        return JsonResponse({"message": "creator deleted"})


@method_decorator(csrf_exempt, name="dispatch")
class SongListCreateView(View):
    def get(self, request, creator_id):
        try:
            creator = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)
        return JsonResponse(
            {"songs": [_serialize_song(s) for s in song_uc.list(creator)]}
        )

    def post(self, request, creator_id):
        payload, err = _parse_body(request)
        if err:
            return err
        try:
            creator = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)
        if not payload.get("title", "").strip():
            return JsonResponse(
                {"error": "title required", "fields": ["title"]}, status=400
            )
        if not payload.get("prompt_description", "").strip():
            return JsonResponse(
                {"error": "prompt required", "fields": ["prompt_description"]},
                status=400,
            )
        return JsonResponse(
            {
                "message": "song created",
                "song": _serialize_song(song_uc.create(creator, payload)),
            },
            status=201,
        )


@method_decorator(csrf_exempt, name="dispatch")
class SongDetailView(View):
    def get(self, request, song_id):
        try:
            return JsonResponse({"song": _serialize_song(Song.objects.get(pk=song_id))})
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)

    def put(self, request, song_id):
        payload, err = _parse_body(request)
        if err:
            return err
        try:
            return JsonResponse(
                {
                    "message": "song updated",
                    "song": _serialize_song(song_uc.update(song_id, payload)),
                }
            )
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)

    def delete(self, request, song_id):
        try:
            song_uc.delete(song_id)
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)
        return JsonResponse({"message": "song deleted"})


@method_decorator(csrf_exempt, name="dispatch")
class FavouritesView(View):
    def get(self, request, creator_id):
        try:
            creator = MusicCreator.objects.get(pk=creator_id)
        except MusicCreator.DoesNotExist:
            return JsonResponse({"error": "creator not found"}, status=404)
        return JsonResponse(
            {"songs": [_serialize_song(s) for s in song_uc.list_favourites(creator)]}
        )


@method_decorator(csrf_exempt, name="dispatch")
class ToggleFavouriteView(View):
    def post(self, request, song_id):
        try:
            return JsonResponse(
                {"song": _serialize_song(song_uc.toggle_favourite(song_id))}
            )
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)


@method_decorator(csrf_exempt, name="dispatch")
class SongShareView(View):
    def post(self, request, song_id):
        try:
            return JsonResponse({"song": _serialize_song(song_uc.share(song_id))})
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)

    def delete(self, request, song_id):
        try:
            return JsonResponse(
                {"song": _serialize_song(song_uc.revoke_share(song_id))}
            )
        except Song.DoesNotExist:
            return JsonResponse({"error": "song not found"}, status=404)
