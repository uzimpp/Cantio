"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import type { Song } from "../../library/page";

export default function SharedSongPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { play, pause, isPlaying, current } = useAudioPlayer();
  const [song, setSong] = useState<Song | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Find the song by its shareable_url field
    // The backend exposes songs at /api/songs/<id>/ but we need to find by shareId.
    // For now, call a list endpoint — in a future iteration add /api/shared/<shareId>/
    // We attempt to GET /api/songs/ which requires auth; fall back to showing a message.
    apiFetch<{ song: Song }>(`/api/songs/${shareId}/`)
      .then((d) => setSong(d.song))
      .catch(() => setNotFound(true));
  }, [shareId]);

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Song not found</h1>
        <p className="text-zinc-400">This link may have been revoked or does not exist.</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        Loading…
      </div>
    );
  }

  const audioUrl = song.audio_url;
  const isThisPlaying = isPlaying && current?.song_id === song.id;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-24 w-24 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-4xl">
          🎵
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{song.title}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {song.generation_job 
            ? [song.generation_job.genre, song.generation_job.mood].filter(Boolean).join(" · ")
            : ""}
        </p>
      </div>

      {audioUrl ? (
        <button
          onClick={() => {
            if (isThisPlaying) {
              pause();
            } else {
              play({ song_id: song.id, title: song.title, audio_url: audioUrl });
            }
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-2xl transition-colors shadow-lg"
        >
          {isThisPlaying ? "⏸" : "▶"}
        </button>
      ) : (
        <p className="text-zinc-400">Audio not available.</p>
      )}

      <p className="text-xs text-zinc-400">Shared via Cantio</p>
    </div>
  );
}
