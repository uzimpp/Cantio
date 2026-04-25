import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from ..models import MusicCreator
from ..services import AuthService
from .serializers import MusicSerializer

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


@method_decorator(csrf_exempt, name="dispatch")
class AuthView(View):
    """
    Consolidated Authentication Controller (GRASP).
    Handles Google OAuth lifecycle, session verification, and termination.
    Delegates domain logic to AuthService.
    """

    def get(self, request, action=None):
        if action == "google":
            return self._google_login(request)
        if action == "callback":
            return self._google_callback(request)
        if action == "me":
            return self._me(request)
        return JsonResponse({"error": "invalid action"}, status=400)

    def post(self, request, action=None):
        if action == "signout":
            return self._signout(request)
        return JsonResponse({"error": "invalid action"}, status=400)

    def _google_login(self, request):
        state = secrets.token_urlsafe(32)
        request.session["oauth_state"] = state
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
        }
        return redirect(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")

    def _google_callback(self, request):
        code = request.GET.get("code")
        state = request.GET.get("state")
        if not code or state != request.session.get("oauth_state"):
            return redirect(f"{settings.FRONTEND_URL}/?error=oauth_error")

        creator, error = AuthService.process_google_callback(code)
        if error:
            return redirect(f"{settings.FRONTEND_URL}/?error={error}")

        request.session["creator_id"] = str(creator.id)
        request.session.set_expiry(settings.SESSION_COOKIE_AGE)
        return redirect(f"{settings.FRONTEND_URL}/")

    def _me(self, request):
        creator_id = request.session.get("creator_id")
        if not creator_id:
            return JsonResponse({"error": "unauthenticated"}, status=401)
        try:
            creator = MusicCreator.objects.get(pk=creator_id)
            return JsonResponse({"creator": MusicSerializer.creator_to_json(creator)})
        except MusicCreator.DoesNotExist:
            request.session.flush()
            return JsonResponse({"error": "creator not found"}, status=401)

    def _signout(self, request):
        request.session.flush()
        return JsonResponse({"message": "signed out"})
