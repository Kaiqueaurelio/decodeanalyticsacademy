import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  duration?: number;
  apostilaTitle?: string;
  category?: string;
}

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  queue: AudioTrack[];
  
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  seek: (time: number) => void;
  addToQueue: (track: AudioTrack) => void;
  skipNext: () => void;
  skipPrevious: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Sincroniza o tempo de reprodução
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => skipNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const play = (track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTrack(track);
    setQueue([track]);
    setQueueIndex(0);
    audio.src = track.url;
    audio.play();
    setIsPlaying(true);
  };

  const pause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  const setPlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = rate;
      setPlaybackRateState(rate);
    }
  };

  const setVolume = (vol: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
      setVolumeState(vol);
    }
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  const addToQueue = (track: AudioTrack) => {
    setQueue(prev => [...prev, track]);
  };

  const skipNext = () => {
    if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      setQueueIndex(queueIndex + 1);
      play(nextTrack);
    } else {
      stop();
    }
  };

  const skipPrevious = () => {
    if (queueIndex > 0) {
      const prevTrack = queue[queueIndex - 1];
      setQueueIndex(queueIndex - 1);
      play(prevTrack);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        queue,
        play,
        pause,
        resume,
        stop,
        setPlaybackRate,
        setVolume,
        seek,
        addToQueue,
        skipNext,
        skipPrevious,
      }}
    >
      <audio ref={audioRef} crossOrigin="anonymous" />
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer deve ser usado dentro de AudioPlayerProvider');
  }
  return context;
}
