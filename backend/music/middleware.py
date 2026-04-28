from django.http import JsonResponse

# Paths that do NOT require an active session
EXEMPT_PATHS = {
    "/api/auth/google/",
    "/api/auth/google/callback/",
    "/api/auth/me/",
    "/api/auth/signout/",
    "/api/docs/",
    "/admin/",
}

EXEMPT_PREFIXES = (
    "/api/shared/",
    "/health/",
)


class RequireAuthMiddleware:
    """
    Rejects unauthenticated requests to /api/* endpoints.

    All protected API calls must include the session cookie set by
    GoogleCallbackView. Exempt paths (auth flow, docs, admin) are listed
    in EXEMPT_PATHS and pass through without a session check.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Only guard /api/ paths that are not explicitly exempt
        if path.startswith("/api/") and path not in EXEMPT_PATHS and not path.startswith(EXEMPT_PREFIXES):
            if not request.session.get("creator_id"):
                return JsonResponse({"error": "unauthenticated"}, status=401)

        return self.get_response(request)
