from datetime import timedelta
from typing import Optional, Tuple

import requests as http_requests
from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from ..models import MusicCreator


class AuthService:
    """
    GRASP Indirection & High Cohesion for Authentication.
    Handles domain logic for verifying tokens and managing identity.
    """

    @staticmethod
    def process_google_callback(
        code: str,
    ) -> Tuple[Optional[MusicCreator], Optional[str]]:
        GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

        token_resp = http_requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        if not token_resp.ok:
            return None, "token_error"

        raw_id_token = token_resp.json().get("id_token")
        if not raw_id_token:
            return None, "invalid_token"

        try:
            payload = id_token.verify_oauth2_token(
                raw_id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except Exception:
            return None, "invalid_token"

        creator, _ = MusicCreator.objects.get_or_create(
            email=payload["email"],
            defaults={
                "first_name": payload.get("given_name", ""),
                "last_name": payload.get("family_name", ""),
                "profile_picture": payload.get("picture"),
            },
        )
        return creator, None