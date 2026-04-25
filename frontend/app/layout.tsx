import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/contexts/ThemeContext";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { AudioPlayerProvider } from "@/app/contexts/AudioPlayerContext";
import { AudioPlayerBar } from "@/app/components/AudioPlayerBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cantio — AI Music Generation",
  description:
    "Generate AI music from text prompts, manage your library, and share your creations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
        <ThemeProvider>
          <AuthProvider>
            <AudioPlayerProvider>
              {children}
              <AudioPlayerBar />
            </AudioPlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
