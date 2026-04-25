"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Navbar } from "@/app/components/Navbar";
import { OnboardingModal } from "@/app/components/OnboardingModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { creator, loading } = useAuth();
  const router = useRouter();

  // FR-01: redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !creator) {
      router.replace("/");
    }
  }, [creator, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-zinc-400">Loading…</span>
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 p-6 pb-28">{children}</main>
      {/* FR-08, FR-09: onboarding modal for first-time users */}
      <OnboardingModal />
    </div>
  );
}
