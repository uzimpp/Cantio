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
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  play: (track: Track) => void;
  playWithQueue: (tracks: Track[], index: number) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  skipNext: () => void;
  skipPrev: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue>({
  current: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  isMuted: false,
  isLooping: false,
  hasNext: false,
  hasPrev: false,
  play: () => {},
  playWithQueue: () => {},
  pause: () => {},
  resume: () => {},
  seek: () => {},
  setVolume: () => {},
  toggleMute: () => {},
  toggleLoop: () => {},
  skipNext: () => {},
  skipPrev: () => {},
});

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoopingRef = useRef(false);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(-1);
  const [current, setCurrent] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (isLoopingRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const playTrack = (track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.audio_url;
    setCurrent(track);
    setDuration(0);
    setCurrentTime(0);
    audio.play().then(() => setIsPlaying(true)).catch(console.error);
  };

  const play = (track: Track) => {
    queueRef.current = [];
    queueIndexRef.current = -1;
    setHasNext(false);
    setHasPrev(false);
    playTrack(track);
  };

  const playWithQueue = (tracks: Track[], index: number) => {
    queueRef.current = tracks;
    queueIndexRef.current = index;
    setHasNext(index < tracks.length - 1);
    setHasPrev(index > 0);
    playTrack(tracks[index]);
  };

  const skipNext = () => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (i < q.length - 1) playWithQueue(q, i + 1);
  };

  const skipPrev = () => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (i > 0) {
      playWithQueue(q, i - 1);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
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

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = false;
    }
    setVolumeState(clamped);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const next = !isMuted;
    audioRef.current.muted = next;
    setIsMuted(next);
  };

  const toggleLoop = () => {
    const next = !isLooping;
    isLoopingRef.current = next;
    setIsLooping(next);
  };

  return (
    <AudioPlayerContext.Provider
      value={{ current, isPlaying, duration, currentTime, volume, isMuted, isLooping, hasNext, hasPrev, play, playWithQueue, pause, resume, seek, setVolume, toggleMute, toggleLoop, skipNext, skipPrev }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
