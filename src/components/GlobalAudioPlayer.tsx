import React, { useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X,
  ChevronUp, Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    play,
    pause,
    resume,
    stop,
    setPlaybackRate,
    setVolume,
    seek,
    skipNext,
    skipPrevious,
  } = useAudioPlayer();

  const [showExpanded, setShowExpanded] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {/* Mini Player (Rodapé) */}
      {!showExpanded && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-md border-t border-border/50 p-4"
        >
          {/* Barra de progresso */}
          <div className="mb-3 cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            seek(percent * duration);
          }}>
            <div className="h-1 bg-muted rounded-full overflow-hidden group">
              <div
                className="h-full bg-primary transition-all group-hover:bg-primary/80"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Conteúdo do Mini Player */}
          <div className="flex items-center justify-between gap-4">
            {/* Info da Música */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.apostilaTitle || 'Áudio'}
              </p>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaybackRate(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
                className="text-xs h-8 px-2"
              >
                {playbackRate}x
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipPrevious}
                className="h-8 w-8"
               aria-label="Voltar">
                <SkipBack size={16} />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={isPlaying ? pause : resume}
                className="h-8 w-8"
               aria-label="Pausar">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipNext}
                className="h-8 w-8"
               aria-label="Avançar">
                <SkipForward size={16} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() = aria-label="Recolher"> setShowExpanded(true)}
                className="h-8 w-8"
              >
                <ChevronUp size={16} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={stop}
                className="h-8 w-8"
               aria-label="Botão">
                <X size={16} />
              </Button>
            </div>

            {/* Tempo */}
            <div className="text-xs text-muted-foreground font-mono w-12 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Expanded Player (Tela Cheia) */}
      {showExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() = aria-label="Recolher"> setShowExpanded(false)}
              className="h-8 w-8"
            >
              <ChevronUp size={20} />
            </Button>
            <h2 className="text-sm font-semibold">Tocando Agora</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={stop}
              className="h-8 w-8"
             aria-label="Botão">
              <X size={20} />
            </Button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
            {/* Ícone de Música */}
            <div className="w-40 h-40 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Music size={80} className="text-primary/50" />
            </div>

            {/* Título e Apostila */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">{currentTrack.title}</h1>
              <p className="text-muted-foreground">{currentTrack.apostilaTitle}</p>
            </div>

            {/* Barra de Progresso Grande */}
            <div className="w-full max-w-xs space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={(val) => seek(val[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controles Principais */}
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={skipPrevious}
                className="h-10 w-10"
               aria-label="Voltar">
                <SkipBack size={24} />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={isPlaying ? pause : resume}
                className="h-14 w-14"
               aria-label="Pausar">
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={skipNext}
                className="h-10 w-10"
               aria-label="Avançar">
                <SkipForward size={24} />
              </Button>
            </div>

            {/* Controles Secundários */}
            <div className="w-full max-w-xs space-y-4">
              {/* Velocidade */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Velocidade: {playbackRate}x
                </label>
                <div className="flex gap-2">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPlaybackRate(rate)}
                      className="flex-1 text-xs"
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  Volume
                </label>
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  onValueChange={(val) => setVolume(val[0])}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
