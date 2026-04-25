"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/app/lib/api";
import { SongCard } from "@/app/components/SongCard";
import { Button } from "@/app/components/ui/Button";
import {
  Plus,
  MusicNote,
  Sparkle,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [search, setSearch] = useState("");

  const fetchSongs = async () => {
    if (!creator) return;
    try {
      const data = await apiFetch<{ songs: Song[] }>(
        `/api/creators/${creator.id}/songs/`,
      );
      setSongs(data.songs);
    } catch {
      // ignore
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

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.generation_job?.prompt.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
          <MusicNote
            size={24}
            className="text-indigo-600 animate-bounce"
            weight="bold"
          />
        </div>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
          Syncing Library...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">
            Your Collection
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Manage and share your AI-generated soundtracks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-sm font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none w-full md:w-64 transition-all"
            />
          </div>
          <Link href="/generate">
            <Button className="h-11 px-6 shadow-indigo-500/20">
              <Plus size={18} weight="bold" className="mr-2" />
              New Song
            </Button>
          </Link>
        </div>
      </div>

      {songs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[40dvh] text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 p-12"
        >
          <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center mb-8">
            <Sparkle size={40} className="text-indigo-600" weight="duotone" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
            Your library is silent.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-[320px] mb-10 leading-relaxed">
            Every masterpiece starts with a single prompt. Initialize your first
            generation to fill this space.
          </p>
          <Link href="/generate">
            <Button size="lg" className="h-14 px-10">
              Initialize First Track
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSongs.map((song, i) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                }}
              >
                <SongCard
                  song={song}
                  onFavouriteToggle={handleFavouriteToggle}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {songs.length > 0 && filteredSongs.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">
            No tracks match your search.
          </p>
        </div>
      )}
    </div>
  );
}
