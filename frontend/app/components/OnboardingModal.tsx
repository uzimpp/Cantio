"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { MagicWand, PlayCircle, ShareNetwork, Star, MusicNote, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  {
    icon: <MagicWand size={20} weight="duotone" />,
    title: "AI Composition",
    text: "Generate original tracks from plain text prompts.",
  },
  {
    icon: <PlayCircle size={20} weight="duotone" />,
    title: "Instant Playback",
    text: "Listen to your creations directly in the browser.",
  },
  {
    icon: <ShareNetwork size={20} weight="duotone" />,
    title: "Global Sharing",
    text: "Share your sound with unique public links.",
  },
  {
    icon: <Star size={20} weight="duotone" />,
    title: "Curated Library",
    text: "Favourite tracks for quick future access.",
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cantio_onboarded")) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("cantio_onboarded", "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-[500px]"
          >
            <Card className="p-0 overflow-hidden shadow-2xl relative">
              <button 
                onClick={dismiss}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors z-10"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="p-10 flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 shrink-0">
                    <MusicNote size={28} weight="bold" color="white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Welcome to Cantio
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium">Your personal AI orchestrator.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {FEATURES.map((f, i) => (
                    <motion.div 
                      key={f.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        {f.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{f.title}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{f.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Button 
                  onClick={dismiss}
                  size="lg" 
                  className="w-full h-14 text-base font-bold shadow-indigo-500/20"
                >
                  Start Composing
                </Button>
              </div>
              
              {/* Noise layer */}
              <div className="absolute inset-0 z-[-1] opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
