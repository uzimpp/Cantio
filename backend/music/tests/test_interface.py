from django.test import TestCase
from music.strategies.base import GenerationResult, SongGeneratorStrategy

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
