import json
from unittest.mock import patch
from django.test import TestCase, Client
from music.models import MusicCreator, Song, GenerationJob

class GenerationViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.creator = MusicCreator.objects.create(
            first_name="Gen",
            last_name="Test",
            email="gen@example.com"
        )
        # Authenticate
        session = self.client.session
        session["creator_id"] = str(self.creator.id)
        session.save()

    @patch("music.services.generation_service.get_generator")
    def test_initiate_generation_success(self, mock_get_generator):
        mock_gen = mock_get_generator.return_value
        mock_gen.generate.return_value = {
            "provider_job_id": "test-job-123",
            "status": "pending",
            "audio_url": None,
            "duration": None,
            "error": None
        }

        payload = {
            "title": "Summer Vibes",
            "prompt": "Upbeat pop song",
            "genre": "Pop",
            "mood": "Happy"
        }
        response = self.client.post(
            "/api/songs/generate/",
            data=json.dumps(payload),
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["song"]["title"], "Summer Vibes")
        
        # Verify job was created
        job = GenerationJob.objects.get(song_id=data["song"]["id"])
        self.assertEqual(job.provider_job_id, "test-job-123")
        self.assertEqual(job.status, "pending")

    @patch("music.services.generation_service.get_generator")
    def test_sync_status_complete(self, mock_get_generator):
        song = Song.objects.create(library=self.creator.library, title="Existing Song")
        job = GenerationJob.objects.create(
            song=song,
            provider_job_id="job-456",
            status="pending"
        )

        mock_gen = mock_get_generator.return_value
        mock_gen.poll.return_value = {
            "provider_job_id": "job-456",
            "status": "complete",
            "audio_url": "https://suno.ai/track.mp3",
            "duration": 180.5,
            "error": None
        }

        response = self.client.get(f"/api/songs/{song.id}/generation-status/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["job"]["status"], "complete")
        
        # Verify song was updated
        song.refresh_from_db()
        self.assertEqual(song.audio_url, "https://suno.ai/track.mp3")
        self.assertEqual(song.duration, 180.5)

    def test_initiate_generation_invalid_json(self):
        response = self.client.post(
            "/api/songs/generate/",
            data="not json",
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_initiate_generation_missing_fields(self):
        payload = {"title": "Only Title"}
        response = self.client.post(
            "/api/songs/generate/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
