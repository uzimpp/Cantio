"use client";

import { useEffect, useState } from "react";

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cantio_onboarded")) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cantio_onboarded", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl">
            🎵
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Welcome to Cantio
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Generate original songs with AI. Set a title, describe what you
            want, pick a genre and mood — then hit Generate. Your tracks live in
            your Library, ready to play, share, or favourite any time.
          </p>
        </div>

        <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-500">✦</span>
            <span>Generate songs from natural language prompts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-500">✦</span>
            <span>Play tracks directly in the browser</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-500">✦</span>
            <span>Share songs via a unique link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-indigo-500">✦</span>
            <span>Star your favourites to find them quickly</span>
          </li>
        </ul>

        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold text-sm transition-colors"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
