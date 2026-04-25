"""
Unit tests for the Song Generation Strategy Pattern (Exercise 7).

Covers:
  - SongGeneratorStrategy ABC (interface contract)
  - MockSongGeneratorStrategy  (offline/deterministic)
  - SunoSongGeneratorStrategy  (live API, HTTP mocked)
  - get_generator() factory     (env-var-based selection)

Run with:
    docker-compose exec backend python manage.py test music.tests --verbosity=2
"""

import os
import uuid
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from music.strategies.base import GenerationResult, SongGeneratorStrategy
from music.strategies.factory import get_generator
from music.strategies.mock import (
    MOCK_AUDIO_URL,
    MOCK_DURATION,
    MockSongGeneratorStrategy,
)
from music.strategies.suno import SunoSongGeneratorStrategy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

GENERATE_KWARGS = dict(
    title="Test Song",
    prompt="A happy pop song about summer",
    genre="Pop",
    mood="Happy",
    voice_type="female",
    occasion="Summer party",
)


def _assert_valid_result(test_case: TestCase, result: GenerationResult) -> None:
    """Assert that a GenerationResult has all required keys with correct types."""
    test_case.assertIn(result["status"], {"pending", "processing", "complete", "failed"})
    test_case.assertIsInstance(result["provider_job_id"], str)
    test_case.assertTrue(len(result["provider_job_id"]) > 0)


# ===========================================================================
# 1. Strategy Interface (Abstract Base Class)
# ===========================================================================

class TestSongGeneratorStrategyInterface(TestCase):
    """Verify the ABC correctly enforces the interface contract."""

    def test_cannot_instantiate_abstract_class(self):
        """SongGeneratorStrategy must not be directly instantiable."""
        with self.assertRaises(TypeError):
            SongGeneratorStrategy()  # type: ignore[abstract]

    def test_abstract_methods_are_declared(self):
        """Both generate() and poll() must be abstract."""
        abstract_methods = SongGeneratorStrategy.__abstractmethods__
        self.assertIn("generate", abstract_methods)
        self.assertIn("poll", abstract_methods)

    def test_concrete_class_without_all_methods_raises(self):
        """A subclass that only implements one method must still be uninstantiable."""
        class Incomplete(SongGeneratorStrategy):
            def generate(self, title, prompt, genre, mood, voice_type, occasion):
                return GenerationResult(
                    provider_job_id="x", status="complete",
                    audio_url=None, duration=None, error=None,
                )
            # poll() is intentionally missing

        with self.assertRaises(TypeError):
            Incomplete()  # type: ignore[abstract]


# ===========================================================================
# 2. MockSongGeneratorStrategy
# ===========================================================================

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


# ===========================================================================
# 3. SunoSongGeneratorStrategy (HTTP layer mocked)
# ===========================================================================

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


# ===========================================================================
# 4. get_generator() factory
# ===========================================================================

class TestGetGeneratorFactory(TestCase):
    """Factory must select the correct strategy based on GENERATOR_STRATEGY env var."""

    def test_returns_mock_by_default(self):
        """When GENERATOR_STRATEGY is unset, factory must return MockSongGeneratorStrategy."""
        env = {k: v for k, v in os.environ.items() if k != "GENERATOR_STRATEGY"}
        with patch.dict(os.environ, env, clear=True):
            strategy = get_generator()
        self.assertIsInstance(strategy, MockSongGeneratorStrategy)

    def test_returns_mock_when_explicitly_set(self):
        """When GENERATOR_STRATEGY=mock, factory must return MockSongGeneratorStrategy."""
        with patch.dict(os.environ, {"GENERATOR_STRATEGY": "mock"}):
            strategy = get_generator()
        self.assertIsInstance(strategy, MockSongGeneratorStrategy)

    def test_returns_mock_for_uppercase_mock(self):
        """Factory must be case-insensitive (MOCK should equal mock)."""
        with patch.dict(os.environ, {"GENERATOR_STRATEGY": "MOCK"}):
            strategy = get_generator()
        self.assertIsInstance(strategy, MockSongGeneratorStrategy)

    def test_returns_suno_when_set_to_suno(self):
        """When GENERATOR_STRATEGY=suno, factory must return SunoSongGeneratorStrategy."""
        with patch.dict(os.environ, {
            "GENERATOR_STRATEGY": "suno",
            "SUNO_API_KEY": "fake-key",
        }):
            strategy = get_generator()
        self.assertIsInstance(strategy, SunoSongGeneratorStrategy)

    def test_returns_suno_for_uppercase_suno(self):
        """Factory must be case-insensitive (SUNO should equal suno)."""
        with patch.dict(os.environ, {
            "GENERATOR_STRATEGY": "SUNO",
            "SUNO_API_KEY": "fake-key",
        }):
            strategy = get_generator()
        self.assertIsInstance(strategy, SunoSongGeneratorStrategy)

    def test_unknown_value_falls_back_to_mock(self):
        """Unknown GENERATOR_STRATEGY values must fall back to Mock (safe default)."""
        with patch.dict(os.environ, {"GENERATOR_STRATEGY": "openai"}):
            strategy = get_generator()
        self.assertIsInstance(strategy, MockSongGeneratorStrategy)

    def test_returned_strategy_implements_interface(self):
        """Factory output must always be a SongGeneratorStrategy regardless of value."""
        for value in ("mock", "suno", "unknown"):
            with patch.dict(os.environ, {
                "GENERATOR_STRATEGY": value,
                "SUNO_API_KEY": "fake-key",
            }):
                strategy = get_generator()
            self.assertIsInstance(strategy, SongGeneratorStrategy,
                                  f"Expected SongGeneratorStrategy for value={value!r}")
