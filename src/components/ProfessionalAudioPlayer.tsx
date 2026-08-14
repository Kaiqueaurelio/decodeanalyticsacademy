import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, 
  RotateCcw, RotateCw, FastForward, Rewind,
  Settings2, Loader2, Maximize2, Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Chapter {
  title: string;
  startTime: number;
  endTime?: number;
}

interface ProfessionalAudioPlayerProps {
  url: string;
  label?: string;
  title?: string;
  chapters?: Chapter[];
  persistProgress?: boolean;
  autoplay?: boolean;
  onEnded?: () => void;
}

export function ProfessionalAudioPlayer({
  url,
  label = "Áudio explicativo",
  title,
  chapters = [],
  persistProgress = true,
  autoplay = false,
  onEnded
}: ProfessionalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `audio-progress-${btoa(url).substring(0, 32)}`;

  // Formatação de tempo MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Persistência: Carregar progresso e volume inicial
  useEffect(() => {
    if (persistProgress) {
      const savedTime = localStorage.getItem(storageKey);
      if (savedTime && audioRef.current) {
        audioRef.current.currentTime = parseFloat(savedTime);
        setCurrentTime(parseFloat(savedTime));
      }
    }
    const savedVolume = localStorage.getItem('audio-global-volume');
    if (savedVolume) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      if (audioRef.current) audioRef.current.volume = vol;
    }
  }, [url, persistProgress, storageKey]);

  // Persistência: Salvar progresso periodicamente
  useEffect(() => {
    if (persistProgress && isPlaying) {
      const interval = setInterval(() => {
        if (audioRef.current) {
          localStorage.setItem(storageKey, audioRef.current.currentTime.toString());
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, persistProgress, storageKey]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Erro ao reproduzir:", err);
        setError("Não foi possível reproduzir o áudio.");
      });
    }
  }, [isPlaying]);

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const time = value[0];
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (value: number[]) => {
    const vol = value[0];
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
    localStorage.setItem('audio-global-volume', vol.toString());
  };

  const skip = (amount: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += amount;
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita disparar se o usuário estiver digitando em um input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'KeyM':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, isMuted]);

  return (
    <div className="my-8 rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 hover:border-primary/40 group">
      {/* Top Banner / Label */}
      <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">{label}</span>
            {title && <h4 className="text-sm font-bold text-foreground leading-none mt-1">{title}</h4>}
          </div>
        </div>
        
        {isLoading && !error && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Carregando...</span>
          </div>
        )}
        
        {error && (
          <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">{error}</span>
        )}
      </div>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsLoading(false);
        }}
        onEnded={onEnded}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onError={() => {
          setError("Erro ao carregar");
          setIsLoading(false);
        }}
      />

      <div className="p-6 space-y-6">
        {/* Main Controls & Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground tabular-nums">
            <span className="bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 text-primary font-bold">
              {formatTime(currentTime)}
            </span>
            <span className="opacity-60">{formatTime(duration)}</span>
          </div>

          <div className="relative group/slider py-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            
            {/* Chapter Markers */}
            {chapters.length > 0 && duration > 0 && (
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 pointer-events-none flex">
                {chapters.map((chapter, idx) => (
                  <div 
                    key={idx}
                    className="absolute h-3 w-0.5 bg-background/50 -translate-y-1 z-10"
                    style={{ left: `${(chapter.startTime / duration) * 100}%` }}
                    title={chapter.title}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => skip(-10)}
              title="Voltar 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="default"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full shadow-lg shadow-primary/20 transition-all duration-300 transform active:scale-95",
                isPlaying ? "bg-primary hover:bg-primary/90" : "bg-primary hover:bg-primary/90 pl-1"
              )}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => skip(10)}
              title="Avançar 10s"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 bg-accent/5 p-1.5 rounded-2xl border border-border/40">
            {/* Speed Control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 text-[11px] font-black rounded-xl hover:bg-background shadow-sm border border-transparent hover:border-border/40">
                  {playbackRate}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[80px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <DropdownMenuItem 
                    key={rate} 
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (audioRef.current) audioRef.current.playbackRate = rate;
                    }}
                    className={cn("text-[11px] font-bold", playbackRate === rate && "bg-primary/10 text-primary")}
                  >
                    {rate}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-[1px] bg-border/40 mx-1" />

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume px-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-background"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20 hidden sm:block">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Volume (Overlay or Bottom) */}
      <div className="sm:hidden px-6 pb-6">
         <div className="flex items-center gap-3 bg-accent/5 p-3 rounded-xl border border-border/40">
            <Volume1 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1 cursor-pointer"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
         </div>
      </div>
    </div>
  );
}
