"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "glass" | "solid" | "ghost";
}

export function Card({ className, variant = "solid", ...props }: CardProps) {
  const variants = {
    solid: "bg-surface border-border text-foreground shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]",
    glass: "bg-surface/70 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl",
    ghost: "bg-transparent border-transparent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[2rem] p-6 transition-all",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
