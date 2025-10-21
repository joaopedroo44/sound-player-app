import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react";
import type { YouTubeVideo } from "@shared/schema";

interface PlayerContextType {
  currentTrack: YouTubeVideo | null;
  isPlaying: boolean;
  queue: YouTubeVideo[];
  currentIndex: number;
  play: (track: YouTubeVideo, newQueue?: YouTubeVideo[]) => void;
  pause: () => void;
  resume: () => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (track: YouTubeVideo) => void;
  clearQueue: () => void;
  shuffle: boolean;
  repeat: "none" | "one" | "all";
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  currentTime: number;
  duration: number;
  seekTo: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<YouTubeVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"none" | "one" | "all">("none");
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const playerRef = useRef<any>(null);

  const play = (track: YouTubeVideo, newQueue?: YouTubeVideo[]) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(index !== -1 ? index : 0);
    }
  };

  const pause = () => setIsPlaying(false);
  const resume = () => setIsPlaying(true);

  const playNext = () => {
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    if (repeat === "one") {
      nextIndex = currentIndex;
    } else if (nextIndex >= queue.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }
    
    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      if (repeat === "all") {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    
    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
  };

  const addToQueue = (track: YouTubeVideo) => {
    setQueue([...queue, track]);
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const toggleShuffle = () => setShuffle(!shuffle);
  
  const toggleRepeat = () => {
    if (repeat === "none") setRepeat("all");
    else if (repeat === "all") setRepeat("one");
    else setRepeat("none");
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        queue,
        currentIndex,
        play,
        pause,
        resume,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
        shuffle,
        repeat,
        toggleShuffle,
        toggleRepeat,
        volume,
        setVolume,
        currentTime,
        duration,
        seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}
