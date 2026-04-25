import uuid
from unittest.mock import patch
from django.test import TestCase
from music.strategies.base import SongGeneratorStrategy
from music.strategies.mock import (
    MOCK_AUDIO_URL,
    MOCK_DURATION,
    MockSongGeneratorStrategy,
)
from .conftest import GENERATE_KWARGS

class TestMockSongGeneratorStrategy(TestCase):
    """MockSongGeneratorStrategy must be offline, deterministic, and instant."""

    def setUp(self):
        self.strategy = MockSongGeneratorStrategy()

    def test_is_instance_of_base(self):
        """MockSongGeneratorStrategy must be a concrete SongGeneratorStrategy."""
        self.assertIsInstance(self.strategy, SongGeneratorStrategy)

    def test_generate_returns_complete_immediately(self):
        """Mock never queues — status must be 'complete' on first call."""
        result = self.strategy.generate(**GENERATE_KWARGS)
        self.assertEqual(result["status"], "complete")

    def test_generate_returns_fixed_audio_url(self):
        """Mock always returns the same well-known sample audio URL."""
        result = self.strategy.generate(**GENERATE_KWARGS)
        self.assertEqual(result["audio_url"], MOCK_AUDIO_URL)

    def test_generate_returns_fixed_duration(self):
        """Mock always returns the same pre-defined duration."""
        result = self.strategy.generate(**GENERATE_KWARGS)
        self.assertEqual(result["duration"], MOCK_DURATION)

    def test_generate_returns_no_error(self):
        """Mock generation must never produce an error field."""
        result = self.strategy.generate(**GENERATE_KWARGS)
        self.assertIsNone(result["error"])

    def test_generate_returns_unique_job_ids(self):
        """Each call to generate() must return a distinct provider_job_id."""
        ids = {self.strategy.generate(**GENERATE_KWARGS)["provider_job_id"]
               for _ in range(5)}
        self.assertEqual(len(ids), 5, "provider_job_ids should be unique across calls")

    def test_generate_result_has_valid_uuid_job_id(self):
        """provider_job_id must be a valid UUID string."""
        result = self.strategy.generate(**GENERATE_KWARGS)
        # Should not raise
        parsed = uuid.UUID(result["provider_job_id"])
        self.assertIsNotNone(parsed)

    def test_poll_always_returns_complete(self):
        """Mock poll() must always report the job as complete."""
        fake_id = str(uuid.uuid4())
        result = self.strategy.poll(fake_id)
        self.assertEqual(result["status"], "complete")

    def test_poll_echoes_provider_job_id(self):
        """Mock poll() must return the same provider_job_id passed to it."""
        fake_id = str(uuid.uuid4())
        result = self.strategy.poll(fake_id)
        self.assertEqual(result["provider_job_id"], fake_id)

    def test_poll_returns_fixed_audio_url(self):
        """Mock poll() must return the same sample audio URL."""
        result = self.strategy.poll(str(uuid.uuid4()))
        self.assertEqual(result["audio_url"], MOCK_AUDIO_URL)

    def test_generate_requires_no_external_calls(self):
        """Mock must never make network calls (no requests import side-effects)."""
        with patch("requests.post") as mock_post, patch("requests.get") as mock_get:
            self.strategy.generate(**GENERATE_KWARGS)
            mock_post.assert_not_called()
            mock_get.assert_not_called()
