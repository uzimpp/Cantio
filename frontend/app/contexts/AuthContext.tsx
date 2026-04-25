"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch, API_URL, ApiError } from "@/app/lib/api";

export type Creator = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string | null;
  created_at: string;
};

type AuthContextValue = {
  creator: Creator | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  creator: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ creator: Creator }>("/api/auth/me/")
      .then((d) => setCreator(d.creator))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status !== 401) console.error("Auth check failed:", err);
        setCreator(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await apiFetch("/api/auth/signout/", { method: "POST" }).catch(() => {});
    setCreator(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ creator, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Redirects browser to Django's Google OAuth initiation endpoint */
export function signInWithGoogle() {
  window.location.href = `${API_URL}/api/auth/google/`;
}
