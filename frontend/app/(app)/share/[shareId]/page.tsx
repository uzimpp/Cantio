"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, MusicNote, Clock, Waveform, Microphone } from "@phosphor-icons/react";
import type { Song } from "@/app/(app)/dashboard/page";

type Creator = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SharedSongPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const { play, pause, isPlaying, current } = useAudioPlayer();
  const [song, setSong] = useState<Song | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [notFound, setNotFound] = useState(false);
  const waveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ song: Song; creator: Creator }>(`/api/shared/${shareId}/`)
      .then((d) => {
        setSong(d.song);
        setCreator(d.creator);
      })
      .catch(() => setNotFound(true));
  }, [shareId]);

  const isThisPlaying = isPlaying && current?.song_id === song?.id;

  const handlePlayToggle = () => {
    if (!song?.audio_url) return;
    if (isThisPlaying) {
      pause();
    } else {
      play({ song_id: song.id, title: song.title, audio_url: song.audio_url });
    }
  };

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-6 min-h-screen bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-20 w-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <MusicNote size={36} className="text-zinc-600" weight="duotone" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Link unavailable</h1>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            This track may have been set to private or the link no longer exists.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-950">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="flex items-center gap-3 text-zinc-500"
        >
          <Waveform size={20} weight="bold" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading</span>
        </motion.div>
      </div>
    );
  }

  const job = song.generation_job;
  const tags = [job?.genre, job?.mood, job?.voice_type, job?.occasion].filter(Boolean);
  const avatarLetter = creator
    ? `${creator.first_name[0]}${creator.last_name[0]}`
    : "?";

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-screen bg-zinc-950 text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(139,92,246,0.08),transparent)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg flex flex-col gap-10"
        >
          {/* Header label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-zinc-500"
          >
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Shared via Cantio</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/40"
          >
            {/* Visual header */}
            <div className="relative h-52 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-zinc-900 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_100%,rgba(0,0,0,0.6),transparent)]" />

              {/* Animated waveform bars */}
              <div ref={waveRef} className="absolute bottom-6 left-0 right-0 flex items-end justify-center gap-0.5 px-10 opacity-30">
                {Array.from({ length: 48 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-indigo-400"
                    animate={isThisPlaying ? {
                      height: [`${6 + Math.sin(i * 0.7) * 10}px`, `${16 + Math.sin(i * 0.5 + 1) * 20}px`, `${6 + Math.sin(i * 0.7) * 10}px`],
                    } : { height: "4px" }}
                    transition={{ duration: 0.8 + (i % 5) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.02 }}
                  />
                ))}
              </div>

              {/* Play button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.93 }}
                onClick={handlePlayToggle}
                disabled={!song.audio_url}
                className="relative z-10 h-20 w-20 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-2xl shadow-black/50 disabled:opacity-40 disabled:cursor-not-allowed transition-shadow hover:shadow-indigo-500/20"
              >
                <AnimatePresence mode="wait">
                  {isThisPlaying ? (
                    <motion.div key="pause" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Pause size={32} weight="fill" />
                    </motion.div>
                  ) : (
                    <motion.div key="play" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Play size={32} weight="fill" className="ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Song info */}
            <div className="px-8 pt-7 pb-8 flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                  {song.title}
                </h1>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 bg-zinc-800/50 rounded-2xl px-4 py-3">
                  <Clock size={16} className="text-zinc-500 shrink-0" weight="bold" />
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-bold text-white font-mono">{formatDuration(song.duration)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-zinc-800/50 rounded-2xl px-4 py-3">
                  <Microphone size={16} className="text-zinc-500 shrink-0" weight="bold" />
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Created</p>
                    <p className="text-sm font-bold text-white">{formatDate(song.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Prompt */}
              {job?.prompt && (
                <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-2xl px-4 py-3">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">Prompt</p>
                  <p className="text-sm text-zinc-300 leading-relaxed italic">"{job.prompt}"</p>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-zinc-800" />

              {/* Creator */}
              {creator && (
                <div className="flex items-center gap-3">
                  {creator.profile_picture ? (
                    <img
                      src={creator.profile_picture}
                      alt={creator.first_name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-700"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                      {avatarLetter}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Shared by</p>
                    <p className="text-sm font-bold text-white truncate">
                      {creator.first_name} {creator.last_name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-[11px] text-zinc-600 font-bold tracking-widest uppercase"
          >
            Cantio — AI Music Generation
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
