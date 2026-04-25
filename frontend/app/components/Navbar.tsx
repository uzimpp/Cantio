"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "./ui/Button";
import { cn } from "@/app/lib/utils";
import { MusicNote, House, PlusCircle, Heart, User, List, SignOut } from "@phosphor-icons/react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Navbar() {
  const { creator, signOut } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isApp = pathname !== "/" && pathname !== "/login";

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: House },
    { label: "Generate", href: "/generate", icon: PlusCircle },
    { label: "Favourites", href: "/favourites", icon: Heart },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
            <MusicNote size={20} weight="bold" color="white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-foreground">Cantio</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {isApp && navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-element",
                pathname === item.href ? "text-primary bg-primary/10" : "text-muted"
              )}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {creator ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{creator.first_name}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Creator</span>
              </div>
              <button className="h-9 w-9 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                {creator.profile_picture ? (
                  <img src={creator.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="m-auto text-zinc-400" />
                )}
              </button>
              <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sign Out">
                <SignOut size={20} />
              </Button>
            </div>
          ) : (
            pathname !== "/login" && (
              <Link href="/login">
                <Button size="sm">Get Started</Button>
              </Link>
            )
          )}
          
          {/* Mobile Menu Toggle */}
          {isApp && (
            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              <List size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    pathname === item.href ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-600 dark:text-zinc-400"
                  )}>
                    <item.icon size={20} weight={pathname === item.href ? "fill" : "regular"} />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
