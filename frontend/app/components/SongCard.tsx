"use client";

import { useState } from "react";
import { apiFetch, API_URL } from "@/app/lib/api";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import type { Song } from "@/app/(app)/dashboard/page";

type Props = {
  song: Song;
  onFavouriteToggle: (songId: string, newValue: boolean) => void;
  onDelete: (songId: string) => void;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SongCard({ song, onFavouriteToggle, onDelete }: Props) {
  const { play, pause, isPlaying, current } = useAudioPlayer();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<"fav" | "share" | "delete" | null>(null);

  const audioUrl = song.audio_url;
  const isThisPlaying = isPlaying && current?.song_id === song.id;
  const jobStatus = song.generation_job?.status ?? null;
  const isReady = jobStatus === "complete" && !!audioUrl;
  const isGenerating = jobStatus === "pending" || jobStatus === "processing";

  const handlePlay = () => {
    if (!audioUrl) return;
    if (isThisPlaying) {
      pause();
    } else {
      play({ song_id: song.id, title: song.title, audio_url: audioUrl });
    }
  };

  const handleFavourite = async () => {
    setLoading("fav");
    try {
      const data = await apiFetch<{ song: Song }>(`/api/songs/${song.id}/favourite/`, {
        method: "POST",
      });
      onFavouriteToggle(song.id, data.song.is_favourited);
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    setLoading("share");
    try {
      // Ensure sharing is enabled
      await apiFetch(`/api/songs/${song.id}/share/`, { method: "POST" });
      const shareUrl = `${window.location.origin}/share/${song.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${song.title}"?`)) return;
    setLoading("delete");
    try {
      await apiFetch(`/api/songs/${song.id}/`, { method: "DELETE" });
      onDelete(song.id);
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const meta = song.generation_job 
    ? [song.generation_job.genre, song.generation_job.mood, song.generation_job.voice_type, song.generation_job.occasion]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 transition-shadow hover:shadow-md">
      {/* Top row: play button + title + fav */}
      <div className="flex items-start gap-3">
        {/* Play button */}
        <button
          onClick={handlePlay}
          disabled={!isReady}
          aria-label={isThisPlaying ? "Pause" : "Play"}
          className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-colors
            bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white disabled:text-zinc-400 dark:disabled:text-zinc-600"
        >
          {isGenerating ? (
            <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          ) : isThisPlaying ? (
            /* Pause */
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            /* Play */
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-white truncate leading-tight">
            {song.title}
          </p>
          {meta && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{meta}</p>
          )}
        </div>

        {/* Favourite */}
        <button
          onClick={handleFavourite}
          disabled={loading === "fav"}
          aria-label={song.is_favourited ? "Remove from favourites" : "Add to favourites"}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-lg"
        >
          {song.is_favourited ? "★" : "☆"}
        </button>
      </div>

      {/* Bottom row: date + duration + share + download + delete */}
      <div className="flex items-center gap-1">
        <span className="flex-1 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDate(song.created_at)}
          {song.duration ? ` · ${formatDuration(song.duration)}` : ""}
        </span>

        {/* Share */}
        <button
          onClick={handleShare}
          disabled={loading === "share" || !isReady}
          aria-label="Copy share link"
          title={copied ? "Copied!" : "Share"}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          {copied ? (
            /* Check */
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            /* Link */
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          )}
        </button>

        {/* Download */}
        {isReady && (
          <a
            href={`${API_URL}/api/songs/${song.id}/download/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download"
            title="Download"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={loading === "delete"}
          aria-label="Delete song"
          title="Delete"
          className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      {/* Generation status badge */}
      {isGenerating && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400">
          {jobStatus === "pending" ? "Queued…" : "Generating…"}
        </p>
      )}
      {jobStatus === "failed" && (
        <p className="text-xs text-red-500">Generation failed</p>
      )}
    </div>
  );
}
