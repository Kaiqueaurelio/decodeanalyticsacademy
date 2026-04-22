import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AppImage } from '@/components/ui/app-image';
import {
  ExternalLink, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Loader2, AlertCircle, Music, Maximize, X
} from 'lucide-react';

interface LinkedMaterial {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  file_path: string | null;
  description: string | null;
}

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface Props {
  apostilaId: string;
  /** Quando true, oculta materiais do tipo 'audio' (renderizados em ApostilaAudios). */
  excludeAudio?: boolean;
}

export function ApostilaMaterials({ apostilaId, excludeAudio }: Props) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<LinkedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenMat, setFullscreenMat] = useState<LinkedMaterial | null>(null);

  useEffect(() => {
    supabase
      .from('apostila_materials')
      .select('material_id, sort_order')
      .eq('apostila_id', apostilaId)
      .order('sort_order')
      .then(async ({ data: links }) => {
        if (!links || links.length === 0) { setLoading(false); return; }
        const ids = links.map(l => (l as any).material_id);
        const { data: mats } = await supabase.from('materials').select('id, title, type, file_url, file_path, description').in('id', ids);
        const matMap = new Map((mats || []).map(m => [m.id, m]));
        const sorted: LinkedMaterial[] = [];
        for (const id of ids) {
          const m = matMap.get(id);
          if (!m) continue;
          if (m.file_path && m.type !== 'link') {
            const { data: signedData } = await supabase.storage
              .from('materials')
              .createSignedUrl(m.file_path, 3600);
            if (signedData?.signedUrl) {
              sorted.push({ ...m, file_url: signedData.signedUrl });
              continue;
            }
          }
          sorted.push(m);
        }
        const filtered = excludeAudio ? sorted.filter((m) => m.type !== 'audio') : sorted;
        setMaterials(filtered);
        setLoading(false);
      });
  }, [apostilaId, excludeAudio]);

  if (loading || materials.length === 0) return null;

  return (
    <>
      <div className="mt-8 space-y-10 animate-content-show">
        {materials.map(m => (
          <InlineMaterial
            key={m.id}
            material={m}
            onNavigateVideo={() => navigate(`/video/${m.id}`)}
            onFullscreen={() => setFullscreenMat(m)}
          />
        ))}
      </div>

      {fullscreenMat && fullscreenMat.file_url && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <p className="font-medium text-sm truncate">{fullscreenMat.title}</p>
            <button onClick={() => setFullscreenMat(null)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            src={['powerpoint', 'word', 'excel'].includes(fullscreenMat.type)
              ? `https://docs.google.com/gview?url=${encodeURIComponent(fullscreenMat.file_url)}&embedded=true`
              : fullscreenMat.file_url}
            className="flex-1 w-full"
            title={fullscreenMat.title}
          />
        </div>
      )}
    </>
  );
}

function InlineMaterial({
  material,
  onNavigateVideo,
  onFullscreen,
}: {
  material: LinkedMaterial;
  onNavigateVideo: () => void;
  onFullscreen: () => void;
}) {
  const { title, description, type, file_url } = material;

  if (!file_url) return null;

  const heading = (
    <h3 className="font-display text-lg font-semibold mb-3 text-foreground">{title}</h3>
  );

  switch (type) {
    case 'pdf':
      return (
        <section>
          {heading}
          {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
          <iframe src={file_url} className="w-full h-[55vh] rounded-xl border border-border/30" title={title} />
          <div className="flex justify-end mt-2">
            <Button size="sm" variant="ghost" onClick={onFullscreen} className="text-xs text-muted-foreground hover:text-primary">
              <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
            </Button>
          </div>
        </section>
      );

    case 'image':
    case 'gif':
      return (
        <figure>
          <AppImage src={file_url} alt={title} className="w-full max-h-[60vh] object-contain rounded-xl" fallbackClassName="w-full min-h-[220px] rounded-xl" />
        </figure>
      );

    case 'video':
      return (
        <section>
          {heading}
          {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
          <div
            onClick={onNavigateVideo}
            className="relative w-full aspect-video rounded-xl bg-muted/30 border border-border/30 flex items-center justify-center cursor-pointer group hover:border-primary/40 transition-colors"
          >
            <div className="p-4 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <span className="absolute bottom-3 left-3 text-xs text-muted-foreground">Clique para assistir</span>
          </div>
        </section>
      );

    case 'audio':
      return (
        <section>
          {heading}
          {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
          <InlineAudioPlayer url={file_url} title={title} />
        </section>
      );

    case 'powerpoint':
    case 'word':
    case 'excel': {
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file_url)}&embedded=true`;
      return (
        <section>
          {heading}
          {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
          <iframe src={viewerUrl} className="w-full h-[55vh] rounded-xl border border-border/30" title={title} />
          <div className="flex justify-end mt-2">
            <Button size="sm" variant="ghost" onClick={onFullscreen} className="text-xs text-muted-foreground hover:text-primary">
              <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
            </Button>
          </div>
        </section>
      );
    }

    case 'link':
      return (
        <section>
          {heading}
          {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
          <Button variant="outline" size="sm" asChild>
            <a href={file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Acessar
            </a>
          </Button>
        </section>
      );

    default:
      return (
        <section>
          {heading}
          <Button variant="outline" size="sm" asChild>
            <a href={file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir arquivo
            </a>
          </Button>
        </section>
      );
  }
}

/* Inline audio player */
function InlineAudioPlayer({ url, title }: { url: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentTime, setCurrTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audioRef.current = audio;
    audio.addEventListener('timeupdate', () => setCurrTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => { setDuration(audio.duration); setLoading(false); });
    audio.addEventListener('ended', () => setPlaying(false));
    audio.addEventListener('error', () => { setLoading(false); setError(true); });
    audio.src = url;
    return () => { audio.pause(); audio.src = ''; };
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else {
      setLoading(true); setError(false);
      audio.play().then(() => { setPlaying(true); setLoading(false); }).catch(() => { setLoading(false); setError(true); });
    }
  }, [playing]);

  return (
    <div className="rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--accent))] p-5 border border-border/30">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{title}</p>
          <p className="text-[10px] text-muted-foreground">Áudio</p>
        </div>
        {error && <span className="text-[10px] text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Erro</span>}
      </div>
      <Slider value={[currentTime]} max={duration || 1} step={0.1}
        onValueChange={v => { if (audioRef.current) { audioRef.current.currentTime = v[0]; setCurrTime(v[0]); } }} className="mb-2" />
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
        <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15); }} className="p-2 rounded-full hover:bg-primary/10"><SkipBack className="h-4 w-4 text-muted-foreground" /></button>
        <button onClick={toggle} disabled={error} className="p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 shadow-lg disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15); }} className="p-2 rounded-full hover:bg-primary/10"><SkipForward className="h-4 w-4 text-muted-foreground" /></button>
        <button onClick={() => { if (audioRef.current) { audioRef.current.muted = !muted; setMuted(!muted); } }} className="p-2 rounded-full hover:bg-primary/10 ml-1">
          {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Slider value={[muted ? 0 : volume]} max={1} step={0.01}
          onValueChange={v => { setVolume(v[0]); if (audioRef.current) audioRef.current.volume = v[0]; setMuted(v[0] === 0); }} className="w-20" />
      </div>
    </div>
  );
}
