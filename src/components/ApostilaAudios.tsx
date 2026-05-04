/**
 * ApostilaAudios — seção dedicada "🎧 Áudios da aula" no topo da apostila.
 * Lista todos os materiais do tipo 'audio' vinculados à apostila com player inline.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Loader2, AlertCircle, Music, Headphones, Gauge, PlayCircle,
} from 'lucide-react';

interface AudioMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
}

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function ApostilaAudios({ apostilaId }: { apostilaId: string }) {
  const [audios, setAudios] = useState<AudioMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: links } = await supabase
        .from('apostila_materials')
        .select('material_id, sort_order')
        .eq('apostila_id', apostilaId)
        .order('sort_order');
      if (!links || !links.length) { setLoading(false); return; }

      const ids = links.map((l) => (l as any).material_id);
      const { data: mats } = await supabase
        .from('materials')
        .select('id, title, type, file_url, file_path, description')
        .in('id', ids)
        .eq('type', 'audio');

      if (!mats || !mats.length) { setLoading(false); return; }

      const order = new Map(ids.map((id, i) => [id, i]));
      const sorted = await Promise.all(
        mats.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).map(async (m) => {
          let url = m.file_url;
          if (m.file_path) {
            const { data: signed } = await supabase.storage
              .from('materials')
              .createSignedUrl(m.file_path, 3600);
            if (signed?.signedUrl) url = signed.signedUrl;
          }
          return { id: m.id, title: m.title, description: m.description, file_url: url || '' };
        }),
      );

      setAudios(sorted.filter((a) => a.file_url));
      setLoading(false);
    })();
  }, [apostilaId]);

  if (loading || audios.length === 0) return null;

  return (
    <section className="mt-8 mb-10 animate-content-show">
      <header className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Headphones className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg sm:text-xl text-foreground leading-none">
            Áudios da aula
          </h2>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {audios.length} {audios.length === 1 ? 'gravação disponível' : 'gravações disponíveis'}
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {audios.map((a) => (
          <AudioCard key={a.id} audio={a} apostilaTitle="Apostila" />
        ))}
      </div>
    </section>
  );
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

function AudioCard({ audio, apostilaTitle }: { audio: AudioMaterial; apostilaTitle?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const globalPlayer = useAudioPlayer();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentTime, setCurrTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.preload = 'metadata';
    el.src = audio.file_url;
    audioRef.current = el;
    el.addEventListener('timeupdate', () => setCurrTime(el.currentTime));
    el.addEventListener('loadedmetadata', () => { setDuration(el.duration); setLoading(false); });
    el.addEventListener('ended', () => setPlaying(false));
    el.addEventListener('error', () => { setLoading(false); setError(true); });
    return () => { el.pause(); el.src = ''; };
  }, [audio.file_url]);

  const toggle = useCallback(() => {
    const el = audioRef.current; if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else {
      setLoading(true); setError(false);
      el.play().then(() => { setPlaying(true); setLoading(false); })
        .catch(() => { setLoading(false); setError(true); });
    }
  }, [playing]);

  const playInGlobalPlayer = () => {
    globalPlayer.play({
      id: audio.id,
      title: audio.title,
      url: audio.file_url,
      apostilaTitle,
    });
  };

  const cycleSpeed = () => {
    const el = audioRef.current; if (!el) return;
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    el.playbackRate = next;
    setSpeed(next);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 border border-primary/20 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate text-foreground">{audio.title}</p>
          {audio.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{audio.description}</p>
          )}
        </div>
        {error && (
          <span className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Erro
          </span>
        )}
      </div>

      <Slider
        value={[currentTime]}
        max={duration || 1}
        step={0.1}
        onValueChange={(v) => {
          if (audioRef.current) { audioRef.current.currentTime = v[0]; setCurrTime(v[0]); }
        }}
        className="mb-1.5"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3 font-mono">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15); }}
          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
          aria-label="Voltar 15 segundos"
        >
          <SkipBack className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={toggle}
          disabled={error}
          aria-label={playing ? 'Pausar' : 'Tocar'}
          className="p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 shadow-lg disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> :
            playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={playInGlobalPlayer}
          className="gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
          title="Ouvir em player flutuante"
        >
          <PlayCircle size={14} />
          <span className="hidden sm:inline text-[10px] uppercase font-bold">Player</span>
        </Button>

        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15); }}
          className="p-2 rounded-full hover:bg-primary/10 transition-colors"
          aria-label="Avançar 15 segundos"
        >
          <SkipForward className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={cycleSpeed}
          className="ml-1 px-2 py-1 rounded-md bg-muted text-[10px] font-mono font-bold text-foreground hover:bg-primary/10 transition-colors flex items-center gap-1"
          aria-label="Velocidade"
        >
          <Gauge className="h-3 w-3" /> {speed}x
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { if (audioRef.current) { audioRef.current.muted = !muted; setMuted(!muted); } }}
            className="p-2 rounded-full hover:bg-primary/10 transition-colors"
            aria-label={muted ? 'Reativar áudio' : 'Mutar'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
          </button>
          <Slider
            value={[muted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={(v) => {
              setVolume(v[0]);
              if (audioRef.current) audioRef.current.volume = v[0];
              setMuted(v[0] === 0);
            }}
            className="w-16 sm:w-20"
          />
        </div>
      </div>
    </div>
  );
}
