import os

from .base import SongGeneratorStrategy
from .mock import MockSongGeneratorStrategy
from .suno import SunoSongGeneratorStrategy


def get_generator() -> SongGeneratorStrategy:
    """
    GRASP Indirection — single, centralized strategy factory.

    Reads the GENERATOR_STRATEGY environment variable to decide which
    concrete strategy to instantiate. Defaults to 'mock' so the system
    works out-of-the-box without an API key.

    This is the ONLY place in the codebase that contains the if/else
    logic for strategy selection. All views call get_generator() and
    interact exclusively with the SongGeneratorStrategy interface,
    achieving Low Coupling and Protected Variations.

    Usage:
        GENERATOR_STRATEGY=mock   → MockSongGeneratorStrategy
        GENERATOR_STRATEGY=suno   → SunoSongGeneratorStrategy
    """
    strategy = os.environ.get("GENERATOR_STRATEGY", "mock").strip().lower()
    if strategy == "suno":
        return SunoSongGeneratorStrategy()
    return MockSongGeneratorStrategy()
