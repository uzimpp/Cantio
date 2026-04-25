from abc import ABC, abstractmethod
from typing import TypedDict


class GenerationResult(TypedDict):
    provider_job_id: str    # external task ID to poll against
    status: str             # "pending" | "processing" | "complete" | "failed"
    audio_url: str | None
    duration: float | None
    error: str | None


class SongGeneratorStrategy(ABC):
    """
    GRASP Pure Fabrication + Protected Variations.

    This class does not exist in the domain model — it is a fabricated
    abstraction created to support the generation behavior while keeping
    the rest of the system decoupled from any specific AI provider.

    All callers depend on this interface only, never on concrete
    implementations (MockSongGeneratorStrategy, SunoSongGeneratorStrategy).
    Swapping the AI provider requires no changes outside this package.
    """

    @abstractmethod
    def generate(
        self,
        title: str,
        prompt: str,
        genre: str,
        mood: str,
        voice_type: str,
        occasion: str,
    ) -> GenerationResult:
        """
        Kick off song generation.
        Returns immediately with a provider_job_id that can be polled.
        """
        ...

    @abstractmethod
    def poll(self, provider_job_id: str) -> GenerationResult:
        """Check the status of an in-flight generation job."""
        ...
