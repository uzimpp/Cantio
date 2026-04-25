from django.urls import path
from .views.auth import AuthView

urlpatterns = [
    path("google/", AuthView.as_view(), {"action": "google"}, name="google_login"),
    path("google/callback/", AuthView.as_view(), {"action": "callback"}, name="google_callback"),
    path("me/", AuthView.as_view(), {"action": "me"}, name="auth_me"),
    path("signout/", AuthView.as_view(), {"action": "signout"}, name="signout"),
]
