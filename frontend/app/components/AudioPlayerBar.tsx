"use client";

import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";
import { useState } from "react";
import { Play, Pause, SpeakerHigh, SpeakerX, SkipForward, SkipBack, Repeat } from "@phosphor-icons/react";
import { cn } from "@/app/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerBar() {
  const { current, isPlaying, duration, currentTime, volume, isMuted, isLooping, hasNext, hasPrev, pause, resume, seek, setVolume, toggleMute, toggleLoop, skipNext, skipPrev } =
    useAudioPlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [localTime, setLocalTime] = useState(0);

  if (!current) return null;

  const displayTime = isDragging ? localTime : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleSeekInput = (e: React.FormEvent<HTMLInputElement>) => {
    const val = parseFloat(e.currentTarget.value);
    setLocalTime(val);
    if (!isDragging) setIsDragging(true);
  };

  const handleSeekChange = () => {
    seek(localTime);
    setIsDragging(false);
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 inset-x-0 z-50 px-6 pb-6 pointer-events-none"
    >
      <div className="max-w-5xl mx-auto w-full pointer-events-auto">
        <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Progress Bar Container */}
          <div className="relative h-1 bg-zinc-100 dark:bg-zinc-800 cursor-pointer group">
            <motion.div
              className="absolute inset-y-0 left-0 bg-indigo-600 dark:bg-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
              layoutId="progress"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={displayTime}
              onInput={handleSeekInput}
              onChange={handleSeekChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={handleSeekChange}
              className="absolute -top-4 left-0 w-full h-10 opacity-0 cursor-pointer z-10"
              aria-label="Seek"
            />
          </div>

          <div className="px-10 h-20 flex items-center justify-between gap-8">
            {/* Info */}
            <div className="flex-1 min-w-0 flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <Play size={20} weight="fill" color="white" className={cn(isPlaying && "animate-pulse")} />
               </div>
               <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate tracking-tight">{current.title}</p>
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">Original Composition</p>
               </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={skipPrev}
                disabled={!hasPrev}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous song"
              >
                 <SkipBack size={24} weight="fill" />
              </button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={isPlaying ? pause : resume}
                className="h-14 w-14 flex items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl"
              >
                {isPlaying ? (
                  <Pause size={24} weight="fill" />
                ) : (
                  <Play size={24} weight="fill" className="ml-1" />
                )}
              </motion.button>

              <button
                onClick={skipNext}
                disabled={!hasNext}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next song"
              >
                 <SkipForward size={24} weight="fill" />
              </button>

              <button
                onClick={toggleLoop}
                className={cn(
                  "transition-colors",
                  isLooping
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                aria-label="Toggle loop"
              >
                <Repeat size={20} weight={isLooping ? "fill" : "regular"} />
              </button>
            </div>

            {/* Right side: Time & Volume */}
            <div className="flex-1 flex items-center justify-end gap-6">
               <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 tabular-nums">
                  <span>{formatTime(displayTime)}</span>
                  <span className="opacity-30">/</span>
                  <span>{formatTime(duration)}</span>
               </div>

               <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

               <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {isMuted || volume === 0 ? <SpeakerX size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-600 cursor-pointer"
                    aria-label="Volume"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
