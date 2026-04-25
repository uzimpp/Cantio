import json

from django.http import JsonResponse


class MusicSerializer:
    """
    Pure Fabrication & Indirection class for adapting internal Django Models into the JSON format expected by the client.
    """

    @staticmethod
    def parse_body(request):
        try:
            return json.loads(request.body) if request.body else {}, None
        except json.JSONDecodeError:
            return None, JsonResponse({"error": "invalid json"}, status=400)

    @staticmethod
    def creator_to_json(c):
        return {
            "id": str(c.id),
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "profile_picture": c.profile_picture,
            "created_at": c.created_at.isoformat(),
        }

    @staticmethod
    def job_to_json(job):
        if not job:
            return None
        return {
            "job_id": str(job.id),
            "song_id": str(job.song_id),
            "status": job.status,
            "error": job.error_message or None,
            "prompt": job.prompt,
            "genre": job.genre,
            "mood": job.mood,
            "voice_type": job.voice_type,
            "occasion": job.occasion,
            "updated_at": job.updated_at.isoformat(),
        }

    @staticmethod
    def song_to_json(s):
        data = {
            "id": str(s.id),
            "title": s.title,
            "audio_url": s.audio_url,
            "duration": s.duration,
            "is_favourited": s.is_favourited,
            "is_private": s.is_private,
            "shareable_url": str(s.shareable_url) if s.shareable_url else None,
            "created_at": s.created_at.isoformat(),
        }
        try:
            # Aggregate the job data into the song representation
            data["generation_job"] = MusicSerializer.job_to_json(s.generation_job)
        except Exception:
            data["generation_job"] = None
        return data
