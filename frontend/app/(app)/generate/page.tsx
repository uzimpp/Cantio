"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import {

  MagicWand,

  Queue,
  CheckCircle,
  WarningCircle,
  Play,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { Song, GenerationJob } from "../dashboard/page";
import { cn } from "@/app/lib/utils";

const GENRE_OPTIONS = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Jazz",
  "Classical",
  "Electronic",
  "R&B",
  "Country",
  "Folk",
  "Ambient",
];
const MOOD_OPTIONS = [
  "Happy",
  "Sad",
  "Energetic",
  "Calm",
  "Romantic",
  "Dark",
  "Uplifting",
  "Mysterious",
];
const VOICE_OPTIONS = ["male", "female", "instrumental"];
const OCCASION_OPTIONS = [
  "Birthday",
  "Wedding",
  "Party",
  "Study",
  "Workout",
  "Sleep",
  "Meditation",
];

type JobStatus = "idle" | "pending" | "processing" | "complete" | "failed";

export default function GeneratePage() {
  const router = useRouter();
  const { play } = useAudioPlayer();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [voiceType, setVoiceType] = useState("instrumental");
  const [occasion, setOccasion] = useState("");

  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedSong, setCompletedSong] = useState<Song | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (songId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const { job } = await apiFetch<{ job: GenerationJob }>(
          `/api/songs/${songId}/generation-status/`,
        );
        const newStatus = job.status as JobStatus;
        setJobStatus(newStatus);

        if (newStatus === "complete" || newStatus === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (newStatus === "complete") {
            const updated = await apiFetch<{ song: Song }>(
              `/api/songs/${songId}/`,
            );
            setCompletedSong(updated.song);
          } else {
            setErrorMsg(job.error ?? "Generation failed.");
          }
        }
      } catch {
        // Network error — keep polling
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    setJobStatus("pending");
    setErrorMsg(null);
    setCompletedSong(null);

    try {
      const data = await apiFetch<{
        song: Song & { generation_job: GenerationJob };
      }>("/api/songs/generate/", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          prompt: prompt.trim(),
          genre: genre || null,
          mood: mood || null,
          voice_type: voiceType || null,
          occasion: occasion || null,
        }),
      });

      const { song } = data;
      const jobStatusFromServer = song.generation_job?.status ?? "pending";
      setJobStatus(jobStatusFromServer as JobStatus);

      if (jobStatusFromServer === "complete") {
        setCompletedSong(song);
      } else if (jobStatusFromServer === "failed") {
        setErrorMsg(song.generation_job?.error ?? "Generation failed.");
      } else {
        startPolling(song.id);
      }
    } catch (err: unknown) {
      setJobStatus("failed");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const isGenerating = jobStatus === "pending" || jobStatus === "processing";

  return (
    <div className="max-w-[1200px] mx-auto min-h-[80dvh] flex flex-col justify-center gap-12 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-foreground">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <MagicWand size={14} className="text-primary" weight="fill" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Composer Studio
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
            Create your next <br />
            <span className="text-primary">Masterpiece.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 text-muted text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                jobStatus === "idle" ? "bg-border" : "bg-emerald-500",
              )}
            />
            Config
          </div>
          <ArrowRight size={14} />
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isGenerating ? "bg-primary animate-pulse" : "bg-border",
              )}
            />
            Generation
          </div>
          <ArrowRight size={14} />
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                jobStatus === "complete" ? "bg-primary" : "bg-border",
              )}
            />
            Release
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Main Input - Bento 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="flex-1 p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted uppercase tracking-widest">
                Song Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                disabled={isGenerating}
                rows={8}
                placeholder="Describe your vision — e.g. 'A futuristic synthwave track with heavy bass and ethereal vocals about lost time'..."
                className="w-full bg-transparent text-xl md:text-2xl font-medium tracking-tight text-foreground placeholder:text-muted/40 focus:outline-none resize-none leading-tight"
              />
            </div>

            <div className="h-px w-full bg-border" />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted uppercase tracking-widest">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={256}
                required
                disabled={isGenerating}
                placeholder="Give it a name..."
                className="w-full bg-transparent text-lg font-bold text-foreground placeholder:text-muted/40 focus:outline-none"
              />
            </div>
          </Card>

          {/* Status Feedback Area */}
          <div className="min-h-[100px]">
            {isGenerating && (
              <Card
                variant="glass"
                className="border-primary/10 flex items-center justify-between p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                    <Queue size={24} color="white" weight="fill" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {jobStatus === "pending" ? "In Queue" : "Synthesizing..."}
                    </p>
                    <p className="text-xs text-muted">
                      The AI is currently composing your soundtrack. This takes
                      about 60s.
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        delay: i * 0.2,
                      }}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </Card>
            )}

            {jobStatus === "failed" && errorMsg && (
              <Card className="border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/10 p-6 flex items-center gap-4 text-foreground">
                <WarningCircle
                  size={24}
                  className="text-rose-500"
                  weight="fill"
                />
                <div>
                  <p className="font-bold text-sm">Orchestration Error</p>
                  <p className="text-xs text-rose-500/70">{errorMsg}</p>
                </div>
              </Card>
            )}

            {jobStatus === "complete" && completedSong && (
              <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-900/10 p-6 flex items-center justify-between text-foreground">
                <div className="flex items-center gap-4">
                  <CheckCircle
                    size={24}
                    className="text-emerald-500"
                    weight="fill"
                  />
                  <div>
                    <p className="font-bold text-sm">Composition Ready</p>
                    <p className="text-xs text-emerald-600/70">
                      "{completedSong.title}" has been successfully added to
                      your library.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {completedSong.audio_url && (
                    <Button
                      size="sm"
                      onClick={() =>
                        play({
                          song_id: completedSong.id,
                          title: completedSong.title,
                          audio_url: completedSong.audio_url!,
                        })
                      }
                    >
                      <Play size={16} className="mr-2" weight="fill" />
                      Preview
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                  >
                    View Library
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar - Bento 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-8 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">
                Musical Genre
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-element rounded-xl px-4 py-3 text-sm font-bold text-foreground border-none appearance-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Style</option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">
                Emotional Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-element rounded-xl px-4 py-3 text-sm font-bold text-foreground border-none appearance-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Vibe</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest">
                Vocal Texture
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VOICE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVoiceType(v)}
                    disabled={isGenerating}
                    className={cn(
                      "px-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                      voiceType === v
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-element text-muted hover:text-foreground",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            disabled={isGenerating || !title.trim() || !prompt.trim()}
            className="h-16 text-lg tracking-tight group"
          >
            {isGenerating ? "Synthesizing..." : "Initialize Generation"}
            <ArrowRight
              size={20}
              className="ml-3 group-hover:translate-x-1 transition-transform"
              weight="bold"
            />
          </Button>

          <p className="text-[10px] text-muted text-center uppercase tracking-widest font-bold leading-relaxed">
            Each generation consumes <br /> 1 composition credit.
          </p>
        </div>
      </form>
    </div>
  );
}
