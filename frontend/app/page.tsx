"use client";

import Link from "next/link";
import { Navbar } from "@/app/components/Navbar";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import {
  MusicNote,
  Sparkle,
  ShareNetwork,
  DownloadSimple,
  GoogleLogo,
  Play,
  Waveform,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

const WAVE_BARS = Array.from({ length: 40 }, () => Math.random());

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Performance optimized noise filter */}
      <div className="noise-overlay" />

      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-fit"
            >
              <Sparkle
                size={14}
                className="text-indigo-600 dark:text-indigo-400 animate-pulse"
                weight="fill"
              />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                AI-Driven Composition
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] text-zinc-900 dark:text-white"
            >
              Words that <br />
              <span className="text-indigo-600 dark:text-indigo-500">
                Breathe Music.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[500px]"
            >
              Cantio transforms your narrative into professional-grade original
              soundtracks. No instruments required. Just your imagination.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-base"
                >
                  Start Creating Now
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base group"
              >
                <Play
                  size={18}
                  className="mr-2 group-hover:text-indigo-500 transition-colors"
                  weight="fill"
                />
                Explore Library
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-6 mt-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-sm"
                  >
                    <img
                      src={`https://picsum.photos/seed/user${i}/100/100`}
                      alt="User"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Joined by{" "}
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                  2,400+
                </span>{" "}
                creators
              </p>
            </motion.div>
          </div>

          {/* Visual Asset */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full" />
            <Card
              variant="glass"
              className="relative p-10 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <div className="flex flex-col gap-10">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Waveform size={24} color="white" weight="bold" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="h-2 w-32 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "0%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-full w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
                    />
                  </div>

                  <div className="flex items-end gap-1.5 h-32 justify-center">
                    {WAVE_BARS.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 4 }}
                        animate={{ height: `${h * 100}%` }}
                        transition={{
                          repeat: Infinity,
                          repeatType: "mirror",
                          duration: 0.5 + Math.random(),
                          delay: i * 0.02,
                        }}
                        className="w-2 rounded-full bg-indigo-500/40 dark:bg-indigo-400/30"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center px-4">
                  <div className="flex flex-col gap-1">
                    <div className="h-3 w-24 bg-zinc-900 dark:text-white font-bold text-sm tracking-tight italic">
                      "Stellar Drift"
                    </div>
                    <div className="h-2 w-16 bg-zinc-400/50 rounded-full" />
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/20">
                    <Play
                      size={16}
                      color="white"
                      weight="fill"
                      className="ml-1"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Feature Grid - Bento Style */}
        <section className="w-full bg-zinc-50 dark:bg-zinc-900/50 py-32 border-y border-zinc-200/50 dark:border-zinc-800/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-4">
                Built for the next generation of sound.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-[500px]">
                Enterprise-grade AI models combined with an intuitive creator
                interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <Card className="md:col-span-8 h-[400px] group overflow-hidden relative">
                <div className="relative z-10 p-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                    Prompt Engineering
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px]">
                    Describe style, instruments, and mood. Watch as Cantio
                    interprets your vision with mathematical precision.
                  </p>
                </div>
                <div className="absolute bottom-0 right-0 p-8 w-2/3 h-2/3 bg-indigo-50 dark:bg-indigo-900/20 rounded-tl-[3rem] border-t border-l border-indigo-100 dark:border-indigo-800 transition-transform group-hover:-translate-x-2 group-hover:-translate-y-2">
                  <div className="flex flex-col gap-4 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 opacity-60">
                    <p>// Initializing generation model v5.5</p>
                    <p>&gt; Analysing prompt: "Jazz, Melancholic, Piano"</p>
                    <p>&gt; Detecting harmonic structure...</p>
                    <p>&gt; Generating waveform tensors...</p>
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-4 h-[400px] flex flex-col justify-between bg-indigo-600 border-none">
                <div className="p-2">
                  <ShareNetwork size={32} color="white" weight="duotone" />
                  <h3 className="text-xl font-bold text-white mt-6 mb-2">
                    Global Sharing
                  </h3>
                  <p className="text-sm text-indigo-100/70">
                    Instant public links for your creations. Revoke access
                    anytime with a single toggle.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-white text-xs font-mono">
                  cantio.sh/track/3f2a...
                </div>
              </Card>

              <Card className="md:col-span-4 min-h-[300px]">
                <DownloadSimple
                  size={28}
                  className="text-indigo-600"
                  weight="duotone"
                />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-4">
                  HQ Exports
                </h3>
                <p className="text-sm text-zinc-500 mt-2">
                  Download your tracks in high-quality MP3 format for use in any
                  project.
                </p>
              </Card>

              <Card className="md:col-span-8 min-h-[300px] flex items-center justify-between">
                <div className="max-w-[300px]">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Seamless Library
                  </h3>
                  <p className="text-sm text-zinc-500 mt-2">
                    Organize, favourite, and manage your entire musical
                    portfolio in one place.
                  </p>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
              <MusicNote
                size={14}
                className="text-white dark:text-zinc-900"
                weight="bold"
              />
            </div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white uppercase text-xs">
              Cantio &copy; 2026
            </span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition-colors">
              Home
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
