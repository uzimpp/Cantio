"use client";

import { useState } from "react";
import { apiFetch, API_URL } from "@/app/lib/api";
import { cn } from "@/app/lib/utils";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  Play,
  Pause,
  Heart,
  Lock,
  Globe,
  Link,
  DownloadSimple,
  Trash,
  Check,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Song } from "@/app/(app)/dashboard/page";

type Props = {
  song: Song;
  onFavouriteToggle: (songId: string, newValue: boolean) => void;
  onDelete: (songId: string) => void;
  onPlay?: (track: { song_id: string; title: string; audio_url: string }) => void;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SongCard({ song, onFavouriteToggle, onDelete, onPlay }: Props) {
  const { play, pause, isPlaying, current } = useAudioPlayer();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<"fav" | "visibility" | "delete" | null>(null);
  const [isPrivate, setIsPrivate] = useState(song.is_private);
  const [shareableUrl, setShareableUrl] = useState(song.shareable_url);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const audioUrl = song.audio_url;
  const isThisPlaying = isPlaying && current?.song_id === song.id;
  const jobStatus = song.generation_job?.status ?? null;
  const isReady = jobStatus === "complete" && !!audioUrl;
  const isGenerating = jobStatus === "pending" || jobStatus === "processing";

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioUrl) return;
    if (isThisPlaying) {
      pause();
    } else {
      const track = { song_id: song.id, title: song.title, audio_url: audioUrl };
      if (onPlay) {
        onPlay(track);
      } else {
        play(track);
      }
    }
  };

  const handleFavourite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading("fav");
    try {
      const data = await apiFetch<{ song: Song }>(`/api/songs/${song.id}/favourite/`, {
        method: "POST",
      });
      onFavouriteToggle(song.id, data.song.is_favourited);
    } catch { /* ignore */ } finally {
      setLoading(null);
    }
  };

  const handleVisibilityToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading("visibility");
    try {
      const method = isPrivate ? "POST" : "DELETE";
      const data = await apiFetch<{ song: Song }>(`/api/songs/${song.id}/share/`, { method });
      setIsPrivate(data.song.is_private);
      setShareableUrl(data.song.shareable_url);
    } catch { /* ignore */ } finally {
      setLoading(null);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share/${shareableUrl}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${song.title}"?`)) return;
    setLoading("delete");
    try {
      await apiFetch(`/api/songs/${song.id}/`, { method: "DELETE" });
      onDelete(song.id);
    } catch { /* ignore */ } finally {
      setLoading(null);
    }
  };

  const job = song.generation_job;
  const tags = [
    job?.genre && { label: job.genre, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
    job?.mood && { label: job.mood, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  ].filter(Boolean) as { label: string; color: string }[];

  return (
    <>
      <Card
        className="group flex flex-col p-0 overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        onClick={() => setIsDetailsOpen(true)}
      >
        {/* Background Graphic */}
        <div className="relative h-32 bg-element flex items-center justify-center overflow-hidden">
          <div className="noise-overlay" />
          <div className={cn(
            "h-16 w-16 rounded-2xl bg-surface shadow-xl flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            isThisPlaying && "animate-pulse ring-4 ring-primary/20"
          )}>
            {isThisPlaying ? <Pause size={32} weight="fill" className="text-primary" /> : <Play size={32} weight="fill" className="text-primary" />}
          </div>

          {/* Play Overlay */}
          <button
            onClick={handlePlay}
            disabled={!isReady}
            className="absolute inset-0 z-20 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex flex-col gap-2">
              <h3 className="font-bold text-foreground truncate text-lg tracking-tight">{song.title}</h3>

              {/* FR-21: Genre & Mood tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full", tag.color)}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleFavourite}
              disabled={loading === "fav"}
              className="shrink-0 transition-transform active:scale-90"
            >
              <Heart
                size={24}
                weight={song.is_favourited ? "fill" : "regular"}
                className={cn(song.is_favourited ? "text-rose-500" : "text-muted hover:text-rose-400")}
              />
            </button>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold font-mono text-muted bg-element px-2 py-0.5 rounded-md uppercase">
                {formatDuration(song.duration)}
              </span>
              {/* FR-21: Creation timestamp */}
              <span className="text-[10px] font-bold text-muted/60 uppercase tracking-tighter">
                {formatDate(song.created_at)}
              </span>
              {isGenerating && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tighter">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  Generating
                </span>
              )}
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {isReady && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted hover:text-foreground"
                    onClick={handleVisibilityToggle}
                    disabled={loading === "visibility"}
                    title={isPrivate ? "Make Public" : "Make Private"}
                  >
                    {isPrivate ? <Lock size={18} /> : <Globe size={18} className="text-emerald-500" />}
                  </Button>

                  {!isPrivate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted hover:text-primary"
                      onClick={handleCopyLink}
                      title="Copy Link"
                    >
                      {copied ? <Check size={18} weight="bold" className="text-emerald-500" /> : <Link size={18} />}
                    </Button>
                  )}

                  <a
                    href={`${API_URL}/api/songs/${song.id}/download/`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted hover:text-primary" title="Download">
                      <DownloadSimple size={18} />
                    </Button>
                  </a>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted hover:text-rose-500"
                onClick={handleDelete}
                disabled={loading === "delete"}
                title="Delete"
              >
                <Trash size={18} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* FR-22: Full Details Panel */}
      <AnimatePresence>
        {isDetailsOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDetailsOpen(false)}
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-start justify-between p-8 pb-6 gap-4">
                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Song Details</p>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground truncate">{song.title}</h2>
                  </div>
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="shrink-0 h-8 w-8 rounded-full bg-element flex items-center justify-center text-muted hover:text-foreground transition-colors mt-1"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>

                <div className="px-8 pb-8 flex flex-col gap-6">
                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-bold font-mono text-foreground">{formatDuration(song.duration)}</p>
                    </div>
                    <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Created</p>
                      <p className="text-sm font-bold text-foreground">{formatDate(song.created_at)}</p>
                    </div>
                    {job?.genre && (
                      <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Genre</p>
                        <p className="text-sm font-bold text-foreground">{job.genre}</p>
                      </div>
                    )}
                    {job?.mood && (
                      <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Mood</p>
                        <p className="text-sm font-bold text-foreground">{job.mood}</p>
                      </div>
                    )}
                    {job?.voice_type && (
                      <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Voice</p>
                        <p className="text-sm font-bold text-foreground capitalize">{job.voice_type}</p>
                      </div>
                    )}
                    {job?.occasion && (
                      <div className="bg-element rounded-2xl p-4 flex flex-col gap-1">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Occasion</p>
                        <p className="text-sm font-bold text-foreground">{job.occasion}</p>
                      </div>
                    )}
                  </div>

                  {/* Full Prompt */}
                  {job?.prompt && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Generation Prompt</p>
                      <div className="bg-element rounded-2xl p-4">
                        <p className="text-sm text-foreground leading-relaxed">{job.prompt}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {isReady && (
                    <Button
                      onClick={(e) => { handlePlay(e); setIsDetailsOpen(false); }}
                      className="w-full h-12"
                    >
                      <Play size={18} weight="fill" className="mr-2" />
                      {isThisPlaying ? "Now Playing" : "Play Song"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
