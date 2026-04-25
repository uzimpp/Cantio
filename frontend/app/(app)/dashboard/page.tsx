"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/app/lib/api";
import { SongCard } from "@/app/components/SongCard";

export type GenerationJob = {
  job_id: string;
  song_id: string;
  status: "pending" | "processing" | "complete" | "failed";
  prompt: string;
  genre: string;
  mood: string;
  voice_type: string;
  occasion: string;
  error: string | null;
  updated_at: string;
};

export type Song = {
  id: string;
  title: string;
  audio_url: string | null;
  duration: number | null;
  is_favourited: boolean;
  is_private: boolean;
  shareable_url: string | null;
  created_at: string;
  generation_job?: GenerationJob;
};

export default function DashboardPage() {
  const { creator } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSongs = async () => {
    if (!creator) return;
    try {
      const data = await apiFetch<{ songs: Song[] }>(
        `/api/creators/${creator.id}/songs/`
      );
      setSongs(data.songs);
    } catch {
      // ignore — empty state shown below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [creator]);

  const handleFavouriteToggle = (songId: string, newValue: boolean) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, is_favourited: newValue } : s))
    );
  };

  const handleDelete = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        Loading your library…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Library</h1>
        <Link
          href="/generate"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          + Generate
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <p className="text-zinc-400 text-lg">Your library is empty.</p>
          <Link
            href="/generate"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold transition-colors"
          >
            Generate your first song
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onFavouriteToggle={handleFavouriteToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
