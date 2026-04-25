"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/app/lib/api";
import { SongCard } from "@/app/components/SongCard";
import type { Song } from "@/app/lib/types";

export type { Song };
export type { GenerationJob } from "@/app/lib/types";

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4" />
          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex gap-1 justify-end">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7 w-7 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { creator } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSongs = async () => {
    if (!creator) return;
    try {
      const data = await apiFetch<{ songs: Song[] }>(
        `/api/creators/${creator.id}/songs/`,
      );
      setSongs(data.songs);
    } catch {
      // empty state shown below
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [creator]);

  const handleFavouriteToggle = (songId: string, newValue: boolean) => {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === songId ? { ...s, is_favourited: newValue } : s,
      ),
    );
  };

  const handleDelete = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            My Library
          </h1>
          {!loading && songs.length > 0 && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
              {songs.length} {songs.length === 1 ? "track" : "tracks"}
            </p>
          )}
        </div>
        <Link
          href="/generate"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white px-4 py-2 text-sm font-semibold transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generate
        </Link>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && songs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-zinc-400"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-600 dark:text-zinc-300 font-medium">
              Your library is empty
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Generate your first song to get started.
            </p>
          </div>
          <Link
            href="/generate"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold transition-all"
          >
            Generate a song
          </Link>
        </div>
      )}

      {/* Song grid */}
      {!loading && songs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {songs.map((song, i) => (
            <div
              key={song.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <SongCard
                song={song}
                onFavouriteToggle={handleFavouriteToggle}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
