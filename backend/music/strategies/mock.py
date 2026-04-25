import uuid

from .base import GenerationResult, SongGeneratorStrategy

MOCK_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
MOCK_DURATION = 180.0


class MockSongGeneratorStrategy(SongGeneratorStrategy):
    """
    Offline, deterministic strategy for development and testing.

    Does not call any external API. Always returns a fixed audio URL
    and a "complete" status immediately, so the entire generate→play
    flow can be exercised without network access or a Suno API key.
    """

    def generate(
        self,
        title: str,
        prompt: str,
        genre: str,
        mood: str,
        voice_type: str,
        occasion: str,
    ) -> GenerationResult:
        return GenerationResult(
            provider_job_id=str(uuid.uuid4()),
            status="complete",
            audio_url=MOCK_AUDIO_URL,
            duration=MOCK_DURATION,
            error=None,
        )

    def poll(self, provider_job_id: str) -> GenerationResult:
        return GenerationResult(
            provider_job_id=provider_job_id,
            status="complete",
            audio_url=MOCK_AUDIO_URL,
            duration=MOCK_DURATION,
            error=None,
        )
