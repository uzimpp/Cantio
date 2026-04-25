"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Track = {
  song_id: string;
  title: string;
  audio_url: string;
};

type AudioPlayerContextValue = {
  current: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue>({
  current: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  play: () => {},
  pause: () => {},
  resume: () => {},
  seek: () => {},
});

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const play = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.audio_url;
    audio.play().catch(console.error);
    setCurrent(track);
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resume = () => {
    audioRef.current?.play().catch(console.error);
    setIsPlaying(true);
  };

  const seek = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  return (
    <AudioPlayerContext.Provider
      value={{ current, isPlaying, duration, currentTime, play, pause, resume, seek }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
