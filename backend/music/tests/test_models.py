from django.test import TestCase
from music.models import MusicCreator, Song

class MusicModelsTests(TestCase):
    def setUp(self):
        self.creator = MusicCreator.objects.create(
            first_name="Test",
            last_name="User",
            email="test@example.com"
        )

    def test_library_signal(self):
        """Test that a Library is automatically created for a new MusicCreator."""
        self.assertIsNotNone(self.creator.library)
        self.assertEqual(self.creator.library.creator, self.creator)

    def test_song_share_logic(self):
        """Test song sharing and revoking share."""
        song = Song.objects.create(
            library=self.creator.library,
            title="Test Song"
        )
        self.assertTrue(song.is_private)
        self.assertIsNone(song.shareable_url)

        song.share()
        self.assertFalse(song.is_private)
        self.assertIsNotNone(song.shareable_url)

        song.revoke_share()
        self.assertTrue(song.is_private)
        self.assertIsNone(song.shareable_url)

    def test_song_toggle_favourite(self):
        """Test toggling song favourite status."""
        song = Song.objects.create(
            library=self.creator.library,
            title="Test Song"
        )
        self.assertFalse(song.is_favourited)
        song.toggle_favourite()
        self.assertTrue(song.is_favourited)
        song.toggle_favourite()
        self.assertFalse(song.is_favourited)
