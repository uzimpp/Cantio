import uuid
from django.test import TestCase, Client
from music.models import MusicCreator, Song

class SongViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.creator = MusicCreator.objects.create(
            first_name="Test",
            last_name="User",
            email="test@example.com"
        )
        self.song = Song.objects.create(
            library=self.creator.library,
            title="API Test Song",
            audio_url="https://example.com/audio.mp3"
        )
        # Authenticate the session (bypass RequireAuthMiddleware)
        session = self.client.session
        session["creator_id"] = str(self.creator.id)
        session.save()

    def test_get_song_detail(self):
        response = self.client.get(f"/api/songs/{self.song.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["song"]["title"], "API Test Song")

    def test_get_song_not_found(self):
        bad_id = uuid.uuid4()
        response = self.client.get(f"/api/songs/{bad_id}/")
        self.assertEqual(response.status_code, 404)

    def test_delete_song(self):
        song_id = self.song.id
        response = self.client.delete(f"/api/songs/{song_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Song.objects.filter(id=song_id).exists())

    def test_post_favourite(self):
        response = self.client.post(f"/api/songs/{self.song.id}/favourite/")
        self.assertEqual(response.status_code, 200)
        self.song.refresh_from_db()
        self.assertTrue(self.song.is_favourited)

    def test_post_share(self):
        response = self.client.post(f"/api/songs/{self.song.id}/share/")
        self.assertEqual(response.status_code, 200)
        self.song.refresh_from_db()
        self.assertFalse(self.song.is_private)
        self.assertIsNotNone(self.song.shareable_url)

    def test_download_redirect(self):
        response = self.client.get(f"/api/songs/{self.song.id}/download/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "https://example.com/audio.mp3")
