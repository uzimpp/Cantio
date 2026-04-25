"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import type { Song, GenerationJob } from "../dashboard/page";

const GENRE_OPTIONS = ["Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Electronic", "R&B", "Country", "Folk", "Ambient"];
const MOOD_OPTIONS  = ["Happy", "Sad", "Energetic", "Calm", "Romantic", "Dark", "Uplifting", "Mysterious"];
const VOICE_OPTIONS = ["male", "female", "instrumental"];
const OCCASION_OPTIONS = ["Birthday", "Wedding", "Party", "Study", "Workout", "Sleep", "Meditation"];

type JobStatus = "idle" | "pending" | "processing" | "complete" | "failed";

export default function GeneratePage() {
  const router = useRouter();
  const { play } = useAudioPlayer();
  const [title, setTitle]               = useState("");
  const [prompt, setPrompt]             = useState("");
  const [genre, setGenre]               = useState("");
  const [mood, setMood]                 = useState("");
  const [voiceType, setVoiceType]       = useState("instrumental");
  const [occasion, setOccasion]         = useState("");
  const [jobStatus, setJobStatus]       = useState<JobStatus>("idle");
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [completedSong, setCompletedSong] = useState<Song | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (songId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { job } = await apiFetch<{ job: GenerationJob }>(
          `/api/songs/${songId}/generation-status/`
        );
        const newStatus = job.status as JobStatus;
        setJobStatus(newStatus);

        if (newStatus === "complete" || newStatus === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (newStatus === "complete") {
            const updated = await apiFetch<{ song: Song }>(`/api/songs/${songId}/`);
            setCompletedSong(updated.song);
          } else {
            setErrorMsg(job.error ?? "Generation failed.");
          }
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    setJobStatus("pending");
    setErrorMsg(null);
    setCompletedSong(null);

    try {
      const data = await apiFetch<{ song: Song & { generation_job: GenerationJob } }>(
        "/api/songs/generate/",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            prompt: prompt.trim(),
            genre: genre || null,
            mood: mood || null,
            voice_type: voiceType || null,
            occasion: occasion || null,
          }),
        }
      );

      const { song } = data;
      const jobStatusFromServer = song.generation_job?.status ?? "pending";
      setJobStatus(jobStatusFromServer as JobStatus);

      if (jobStatusFromServer === "complete") {
        setCompletedSong(song);
      } else if (jobStatusFromServer === "failed") {
        setErrorMsg(song.generation_job?.error ?? "Generation failed.");
      } else {
        startPolling(song.id);
      }
    } catch (err: unknown) {
      setJobStatus("failed");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const isGenerating = jobStatus === "pending" || jobStatus === "processing";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Generate a Song
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Song Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
            required
            placeholder="My awesome track"
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Prompt */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Song Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={8}
            placeholder="Describe the song or enter the text you want to be generated..."
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {voiceType === "instrumental"
              ? "Describe the genre and mood. Max 500 characters."
              : "In Vocal mode (Male/Female), this prompt will be used for the vocal content."}
          </p>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              {GENRE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              {MOOD_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Voice Type</label>
            <select
              value={voiceType}
              onChange={(e) => setVoiceType(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Occasion</label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              {OCCASION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isGenerating || !title.trim() || !prompt.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 font-semibold text-sm transition-colors"
        >
          {isGenerating ? "Generating…" : "Generate"}
        </button>
      </form>

      {/* Status indicator */}
      {isGenerating && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 p-4">
          <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            {jobStatus === "pending" ? "Queued…" : "Processing your track…"}
          </span>
        </div>
      )}

      {/* Error */}
      {jobStatus === "failed" && errorMsg && (
        <div className="mt-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Success — play immediately */}
      {jobStatus === "complete" && completedSong && (
        <div className="mt-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              Song ready!
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">{completedSong.title}</p>
          </div>
          <div className="flex gap-2">
            {completedSong.audio_url && (
              <button
                onClick={() =>
                  play({
                    song_id: completedSong.id,
                    title: completedSong.title,
                    audio_url: completedSong.audio_url!,
                  })
                }
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold transition-colors"
              >
                Play Now
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-2 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
            >
              Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
