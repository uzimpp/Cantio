"use client";

import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from "react";

type ThemeContextValue = {
  theme: "dark";
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

/**
 * Cantio strictly uses a Cinematic Dark Theme.
 * FR-06, FR-07: Modified to force dark mode exclusively.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Force dark class on document root for Tailwind semantic tokens
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
