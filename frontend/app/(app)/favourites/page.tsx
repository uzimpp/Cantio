"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/app/lib/api";
import { SongCard } from "@/app/components/SongCard";
import type { Song } from "../dashboard/page";

export default function FavouritesPage() {
  const { creator } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creator) return;
    apiFetch<{ songs: Song[] }>(`/api/creators/${creator.id}/favourites/`)
      .then((d) => setSongs(d.songs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [creator]);

  const handleFavouriteToggle = (songId: string, newValue: boolean) => {
    if (!newValue) {
      // Remove from favourites view when un-starred
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  };

  const handleDelete = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Favourites
      </h1>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <p className="text-zinc-400 text-lg">No favourited songs yet.</p>
          <Link
            href="/dashboard"
            className="text-indigo-500 hover:underline text-sm"
          >
            Back to library
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
