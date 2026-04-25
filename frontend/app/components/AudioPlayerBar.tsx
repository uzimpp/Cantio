"use client";

import { useAudioPlayer } from "@/app/contexts/AudioPlayerContext";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayerBar() {
  const { current, isPlaying, duration, currentTime, pause, resume, seek } =
    useAudioPlayer();

  if (!current) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg">
      {/* Seek bar — full width at very top */}
      <div className="relative h-1 bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full bg-indigo-500 transition-none"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Seek"
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
            {current.title}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs tabular-nums text-zinc-400">
            {formatTime(currentTime)}
          </span>

          <button
            onClick={isPlaying ? pause : resume}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            {isPlaying ? (
              /* Pause */
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              /* Play */
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          <span className="text-xs tabular-nums text-zinc-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
