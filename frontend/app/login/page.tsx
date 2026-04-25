"use client";

import { useAuth, signInWithGoogle } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { GoogleLogo, MusicNote, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { creator, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (creator) {
      router.push("/dashboard");
    }
  }, [creator, router]);

  if (loading) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="noise-overlay" />
      
      <div className="w-full max-w-[440px] flex flex-col gap-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Back to home</span>
        </Link>

        <Card className="p-10 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8">
            <MusicNote size={32} weight="bold" color="white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">Welcome to Cantio</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-10 leading-relaxed">
            Sign in to start generating original soundtracks with artificial intelligence.
          </p>

          <Button 
            onClick={signInWithGoogle}
            variant="outline" 
            className="w-full h-14 flex items-center justify-center gap-3 bg-surface border-border hover:border-primary/50 shadow-sm transition-colors"
          >
            <GoogleLogo size={20} weight="bold" className="text-primary" />
            <span>Continue with Google</span>
          </Button>

          <p className="mt-8 text-[11px] text-zinc-400 uppercase tracking-widest font-bold">
            Protected by Enterprise Security
          </p>
        </Card>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-600">
          By continuing, you agree to Cantio's <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
