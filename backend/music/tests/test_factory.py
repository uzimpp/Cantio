import os
from unittest.mock import patch
from django.test import TestCase
from music.strategies.base import SongGeneratorStrategy
from music.strategies.factory import get_generator
from music.strategies.mock import MockSongGeneratorStrategy
from music.strategies.suno import SunoSongGeneratorStrategy

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
