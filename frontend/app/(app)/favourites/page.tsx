"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/app/lib/api";
import { SongCard } from "@/app/components/SongCard";
import { Heart, Sparkle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song } from "../dashboard/page";

export default function FavouritesPage() {
  const { creator } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavourites = async () => {
    if (!creator) return;
    try {
      const data = await apiFetch<{ songs: Song[] }>(
        `/api/creators/${creator.id}/favourites/`
      );
      setSongs(data.songs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, [creator]);

  const handleFavouriteToggle = (songId: string, newValue: boolean) => {
    // In the favourites page, toggling usually means removing it from this list
    if (!newValue) {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    }
  };

  const handleDelete = (songId: string) => {
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
        <Heart size={32} className="text-rose-500 animate-pulse" weight="fill" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Favourites...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white flex items-center gap-4">
          <Heart size={44} className="text-rose-500" weight="fill" />
          Favourites
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Your curated selection of original AI soundtracks.</p>
      </div>

      {songs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[40dvh] text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 p-12"
        >
          <div className="h-20 w-20 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl flex items-center justify-center mb-8">
            <Heart size={40} className="text-zinc-200" weight="bold" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Empty Favourites</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-[320px] leading-relaxed">
            Tracks you mark as favourites will appear here for quick access.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {songs.map((song, i) => (
              <motion.div
                key={song.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05, type: "spring", stiffness: 100, damping: 20 }}
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
    </div>
  );
}
