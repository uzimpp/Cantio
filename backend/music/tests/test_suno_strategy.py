import os
from unittest.mock import MagicMock, patch
from django.test import TestCase
from music.strategies.suno import SunoSongGeneratorStrategy
from .conftest import GENERATE_KWARGS

class TestSunoSongGeneratorStrategy(TestCase):
    """
    SunoSongGeneratorStrategy with all outbound HTTP calls replaced by mocks.
    No real API key or network access is needed.
    """

    FAKE_API_KEY = "test-suno-api-key-123"
    FAKE_TASK_ID = "suno-task-abc123"

    def _make_strategy(self) -> SunoSongGeneratorStrategy:
        with patch.dict(os.environ, {"SUNO_API_KEY": self.FAKE_API_KEY}):
            return SunoSongGeneratorStrategy()

    # ---- generate() --------------------------------------------------------

    def test_generate_posts_to_suno_endpoint(self):
        """generate() must call the Suno /generate endpoint via POST."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {"task_id": self.FAKE_TASK_ID}
        mock_response.raise_for_status = MagicMock()

        with patch("requests.post", return_value=mock_response) as mock_post:
            result = strategy.generate(**GENERATE_KWARGS)

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        self.assertIn("sunoapi.org", call_kwargs.args[0])

    def test_generate_includes_bearer_token(self):
        """generate() must send Authorization: Bearer <api_key>."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {"task_id": self.FAKE_TASK_ID}
        mock_response.raise_for_status = MagicMock()

        with patch("requests.post", return_value=mock_response) as mock_post:
            strategy.generate(**GENERATE_KWARGS)

        headers = mock_post.call_args.kwargs.get("headers", {})
        self.assertEqual(headers.get("Authorization"), f"Bearer {self.FAKE_API_KEY}")

    def test_generate_returns_pending_status(self):
        """generate() must return status='pending' (Suno is async)."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {"task_id": self.FAKE_TASK_ID}
        mock_response.raise_for_status = MagicMock()

        with patch("requests.post", return_value=mock_response):
            result = strategy.generate(**GENERATE_KWARGS)

        self.assertEqual(result["status"], "pending")

    def test_generate_extracts_task_id(self):
        """generate() must capture the provider task ID from the response."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {"task_id": self.FAKE_TASK_ID}
        mock_response.raise_for_status = MagicMock()

        with patch("requests.post", return_value=mock_response):
            result = strategy.generate(**GENERATE_KWARGS)

        self.assertEqual(result["provider_job_id"], self.FAKE_TASK_ID)

    def test_generate_no_audio_url_initially(self):
        """generate() must not return an audio URL (generation is async)."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {"task_id": self.FAKE_TASK_ID}
        mock_response.raise_for_status = MagicMock()

        with patch("requests.post", return_value=mock_response):
            result = strategy.generate(**GENERATE_KWARGS)

        self.assertIsNone(result["audio_url"])

    # ---- poll() — SUCCESS --------------------------------------------------

    def test_poll_maps_SUCCESS_to_complete(self):
        """poll() must map Suno's 'SUCCESS' status to our 'complete'."""
        strategy = self._make_strategy()
        audio_url = "https://cdn.sunoapi.org/audio/test.mp3"
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 200,
            "data": {
                "status": "SUCCESS",
                "response": {
                    "sunoData": [{"audioUrl": audio_url, "duration": 120.0}]
                },
            },
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response):
            result = strategy.poll(self.FAKE_TASK_ID)

        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["audio_url"], audio_url)
        self.assertEqual(result["duration"], 120.0)

    def test_poll_maps_PENDING_to_pending(self):
        """poll() must map Suno's 'PENDING' status to our 'pending'."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 200,
            "data": {"status": "PENDING", "response": {"sunoData": []}},
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response):
            result = strategy.poll(self.FAKE_TASK_ID)

        self.assertEqual(result["status"], "pending")
        self.assertIsNone(result["audio_url"])

    def test_poll_maps_FIRST_SUCCESS_to_processing(self):
        """poll() must map Suno's 'FIRST_SUCCESS' (partial) to our 'processing'."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 200,
            "data": {"status": "FIRST_SUCCESS", "response": {"sunoData": []}},
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response):
            result = strategy.poll(self.FAKE_TASK_ID)

        self.assertEqual(result["status"], "processing")

    def test_poll_echoes_provider_job_id(self):
        """poll() must return the same provider_job_id that was passed in."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 200,
            "data": {"status": "PENDING", "response": {"sunoData": []}},
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response):
            result = strategy.poll(self.FAKE_TASK_ID)

        self.assertEqual(result["provider_job_id"], self.FAKE_TASK_ID)

    def test_poll_sends_task_id_as_query_param(self):
        """poll() must pass the task ID to the Suno API as a query parameter."""
        strategy = self._make_strategy()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "code": 200,
            "data": {"status": "PENDING", "response": {"sunoData": []}},
        }
        mock_response.raise_for_status = MagicMock()

        with patch("requests.get", return_value=mock_response) as mock_get:
            strategy.poll(self.FAKE_TASK_ID)

        call_kwargs = mock_get.call_args.kwargs
        self.assertEqual(call_kwargs.get("params", {}).get("taskId"), self.FAKE_TASK_ID)

    def test_missing_api_key_raises_on_init(self):
        """SunoSongGeneratorStrategy must raise KeyError if SUNO_API_KEY is absent."""
        env_without_key = {k: v for k, v in os.environ.items() if k != "SUNO_API_KEY"}
        with patch.dict(os.environ, env_without_key, clear=True):
            with self.assertRaises(KeyError):
                SunoSongGeneratorStrategy()
