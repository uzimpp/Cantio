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
  DotsThreeVertical,
  Check
} from "@phosphor-icons/react";
import type { Song } from "@/app/(app)/dashboard/page";

type Props = {
  song: Song;
  onFavouriteToggle: (songId: string, newValue: boolean) => void;
  onDelete: (songId: string) => void;
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongCard({ song, onFavouriteToggle, onDelete }: Props) {
  const { play, pause, isPlaying, current } = useAudioPlayer();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState<"fav" | "visibility" | "delete" | null>(null);
  const [isPrivate, setIsPrivate] = useState(song.is_private);
  const [shareableUrl, setShareableUrl] = useState(song.shareable_url);

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

  const meta = song.generation_job 
    ? [song.generation_job.genre, song.generation_job.mood, song.generation_job.voice_type].filter(Boolean).join(" · ")
    : "Original Composition";

  return (
    <Card className="group flex flex-col p-0 overflow-hidden hover:-translate-y-1 transition-all duration-300">
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
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate text-lg tracking-tight">{song.title}</h3>
            <p className="text-xs text-muted mt-1 uppercase tracking-widest font-mono font-bold opacity-70">
              {meta}
            </p>
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
            {isGenerating && (
               <span className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-tighter">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  Generating
               </span>
            )}
          </div>

          <div className="flex items-center gap-1">
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

                <a href={`${API_URL}/api/songs/${song.id}/download/`} target="_blank">
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
  );
}
