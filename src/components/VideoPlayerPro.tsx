import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
  SkipBack, SkipForward, PictureInPicture
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoPlayerProProps {
  src: string;
  title?: string;
  poster?: string;
}

export function VideoPlayerPro({ src, title, poster }: VideoPlayerProProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullscreen = async () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        try {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.error('Erro ao entrar em tela cheia:', err);
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    }
  };

  const handlePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error('Erro ao ativar Picture-in-Picture:', err);
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, currentTime + seconds);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-auto"
      />

      {/* Controles */}
      <motion.div
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-4 pointer-events-none"
      >
        {/* Título */}
        {title && (
          <div className="pointer-events-auto">
            <h3 className="text-white font-semibold text-sm">{title}</h3>
          </div>
        )}

        {/* Controles Inferiores */}
        <div className="space-y-3 pointer-events-auto">
          {/* Barra de Progresso */}
          <div className="group/progress cursor-pointer">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary group-hover/progress:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, rgb(var(--primary)) 0%, rgb(var(--primary)) ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-between">
            {/* Esquerda */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(-10)}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Voltar 10s"
              >
                <SkipBack size={16} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(10)}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Avançar 10s"
              >
                <SkipForward size={16} />
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVolume(volume === 0 ? 1 : 0)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 appearance-none cursor-pointer accent-primary"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                />
              </div>

              {/* Tempo */}
              <span className="text-white text-xs font-mono ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Direita */}
            <div className="flex items-center gap-2">
              {/* Settings */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <Settings size={16} />
                </Button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 space-y-1 min-w-max">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full text-left px-3 py-1 rounded text-sm ${
                          playbackRate === rate
                            ? 'bg-primary text-white'
                            : 'text-white hover:bg-white/20'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              {document.pictureInPictureEnabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePictureInPicture}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="Picture in Picture"
                >
                  <PictureInPicture size={16} />
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
