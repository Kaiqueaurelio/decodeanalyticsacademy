import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, FileText, Image, Video, Music, File, Download, ExternalLink,
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, X,
  Loader2, AlertCircle
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const getMimeType = (url: string): string | undefined => {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    avi: 'video/x-msvideo', mkv: 'video/x-matroska', ogv: 'video/ogg',
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac',
  };
  return ext ? map[ext] : undefined;
};

// Robust Audio Player (Spotify-style)
function AudioPlayer({ url, title }: { url: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retriedRef = useRef(false);
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

    const onTime = () => setCurrTime(audio.currentTime);
    const onMeta = () => { setDuration(audio.duration); setLoading(false); };
    const onEnd = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onError = () => {
      if (!retriedRef.current) {
        retriedRef.current = true;
        audio.src = url;
        audio.load();
        audio.load();
        return;
      }
      setLoading(false); setError(true); setPlaying(false);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);

    audio.src = url;

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.src = '';
    };
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      setLoading(true);
      setError(false);
      audio.play()
        .then(() => { setPlaying(true); setLoading(false); })
        .catch(() => { setLoading(false); setError(true); });
    }
  }, [playing]);

  const seek = useCallback((val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setCurrTime(val[0]);
    }
  }, []);

  const skip = useCallback((s: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + s));
    }
  }, [duration]);

  const handleVolume = useCallback((val: number[]) => {
    const v = val[0];
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v === 0) setMuted(true);
    else setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)/0.15)] to-[hsl(var(--accent))] p-5 border border-border/30">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Music className="h-7 w-7 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{title}</p>
          <p className="text-[10px] text-muted-foreground">Áudio · Material de apoio</p>
        </div>
        {error && (
          <span className="flex items-center gap-1 text-[10px] text-destructive">
            <AlertCircle className="h-3 w-3" /> Erro ao carregar
          </span>
        )}
      </div>

      <Slider
        value={[currentTime]}
        max={duration || 1}
        step={0.1}
        onValueChange={seek}
        className="mb-2"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => skip(-15)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
          <SkipBack className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={toggle}
          disabled={error}
          className="p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
        <button onClick={() => skip(15)} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
          <SkipForward className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={toggleMute} className="p-2 rounded-full hover:bg-primary/10 transition-colors ml-1">
          {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Slider
          value={[muted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolume}
          className="w-20"
        />
      </div>
    </div>
  );
}

// Robust Video Player (YouTube-style)
function VideoPlayer({ url, title }: { url: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const retriedRef = useRef(false);

  const handleError = useCallback(() => {
    if (!retriedRef.current && videoRef.current) {
      retriedRef.current = true;
      videoRef.current.load();
      return;
    }
    setLoading(false);
    setError(true);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden bg-black border border-border/30">
      {error ? (
        <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-2">
          <AlertCircle className="h-8 w-8 opacity-50" />
          <p className="text-sm">Não foi possível carregar o vídeo</p>
          <Button size="sm" variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir externamente
            </a>
          </Button>
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          <video
            ref={videoRef}
            controls
            crossOrigin="anonymous"
            className="w-full aspect-video"
            preload="metadata"
            playsInline
            src={url}
            onLoadedData={() => setLoading(false)}
            onError={handleError}
            onCanPlay={() => setLoading(false)}
          >
            <source src={url} type={getMimeType(url)} />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      )}
      <div className="p-3 bg-card flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Vídeo · Material de apoio</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <Download className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// Image Viewer (supports all formats)
function ImageViewer({ url, title }: { url: string; title: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border/30 cursor-pointer group" onClick={() => !error && setFullscreen(true)}>
        <div className="relative">
          {error ? (
            <div className="w-full h-48 flex items-center justify-center bg-muted/20 text-muted-foreground">
              <AlertCircle className="h-6 w-6 opacity-50 mr-2" />
              <span className="text-sm">Imagem indisponível</span>
            </div>
          ) : (
            <>
              <img
                src={url}
                alt={title}
                className="w-full max-h-[400px] object-contain bg-muted/30"
                onError={() => setError(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          )}
        </div>
        <div className="p-3 bg-card">
          <p className="font-medium text-sm">{title}</p>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X className="h-5 w-5" />
          </button>
          <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

// PDF Viewer with fullscreen
function PdfViewer({ url, title }: { url: string; title: string }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border/30">
        <iframe src={url} className="w-full h-[500px] sm:h-[600px]" title={title} />
        <div className="p-3 bg-card flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-[10px] text-muted-foreground">PDF · Material de apoio</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setFullscreen(true)}>
              <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar
              </a>
            </Button>
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <p className="font-medium text-sm truncate">{title}</p>
            </div>
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe src={url} className="flex-1 w-full" title={title} />
        </div>
      )}
    </>
  );
}

// Office Document Viewer (Word, PowerPoint, Excel) via Google Docs Viewer
function OfficeViewer({ url, title, typeLabel }: { url: string; title: string; typeLabel: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  const iconMap: Record<string, typeof FileText> = {
    PowerPoint: FileText,
    Word: FileText,
    Excel: FileText,
  };
  const Icon = iconMap[typeLabel] || FileText;

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border/30">
        {error ? (
          <div className="w-full h-[400px] flex flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-3">
            <AlertCircle className="h-8 w-8 opacity-50" />
            <p className="text-sm">Não foi possível visualizar o documento</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setError(false)}>
                Tentar novamente
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={viewerUrl}
            className="w-full h-[500px] sm:h-[600px]"
            title={title}
            onError={() => setError(true)}
          />
        )}
        <div className="p-3 bg-card flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-[10px] text-muted-foreground">{typeLabel} · Material de apoio</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setFullscreen(true)}>
              <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar
              </a>
            </Button>
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <p className="font-medium text-sm truncate">{title}</p>
              <Badge className="text-[10px]">{typeLabel}</Badge>
            </div>
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe src={viewerUrl} className="flex-1 w-full" title={title} />
        </div>
      )}
    </>
  );
}

export default function MaterialsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    loadMaterials();
  }, [user]);

  const loadMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    setMaterials(data || []);
  };

  const types = [
    { value: 'all', label: 'Todos', icon: File },
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'image', label: 'Imagens', icon: Image },
    { value: 'video', label: 'Vídeos', icon: Video },
    { value: 'audio', label: 'Áudios', icon: Music },
    { value: 'docs', label: 'Documentos', icon: FileText },
    { value: 'other', label: 'Outros', icon: File },
  ];

  const docTypes = ['powerpoint', 'word', 'excel'];
  const filtered = filter === 'all' ? materials : materials.filter(m => {
    if (filter === 'docs') return docTypes.includes(m.type);
    if (filter === 'other') return !['pdf', 'image', 'video', 'audio', ...docTypes].includes(m.type);
    return m.type === filter;
  });

  const renderMaterial = (m: Material) => {
    if (!m.file_url) {
      return (
        <Card key={m.id} className="p-4 bg-card border border-border/50">
          <p className="font-medium text-sm">{m.title}</p>
          {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
          <p className="text-[10px] text-muted-foreground mt-2">Sem arquivo disponível</p>
        </Card>
      );
    }

    switch (m.type) {
      case 'audio':
        return <AudioPlayer key={m.id} url={m.file_url} title={m.title} />;
      case 'video':
        return <VideoPlayer key={m.id} url={m.file_url} title={m.title} />;
      case 'image':
      case 'gif':
        return <ImageViewer key={m.id} url={m.file_url} title={m.title} />;
      case 'pdf':
        return <PdfViewer key={m.id} url={m.file_url} title={m.title} />;
      case 'powerpoint':
        return <OfficeViewer key={m.id} url={m.file_url} title={m.title} typeLabel="PowerPoint" />;
      case 'word':
        return <OfficeViewer key={m.id} url={m.file_url} title={m.title} typeLabel="Word" />;
      case 'excel':
        return <OfficeViewer key={m.id} url={m.file_url} title={m.title} typeLabel="Excel" />;
      case 'link':
        return (
          <Card key={m.id} className="p-4 bg-card border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <ExternalLink className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                <p className="text-[10px] text-primary truncate mt-1">{m.file_url}</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </Card>
        );
      default:
        return (
          <Card key={m.id} className="p-4 bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent p-2.5">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                <Badge className="text-[10px] mt-1">{m.type.toUpperCase()}</Badge>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-6 px-4 max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mb-5 animate-content-show">
          <h1 className="text-xl font-bold">Materiais de Apoio</h1>
          <p className="text-sm text-muted-foreground">Arquivos, vídeos, áudios e links para complementar seus estudos</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 hide-scrollbar animate-content-show delay-1">
          {types.map(t => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                filter === t.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/50 hover:border-primary/30'
              }`}
            >
              <t.icon className="h-3 w-3" /> {t.label}
              {filter === t.value && (
                <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-[10px]">
                  {t.value === 'all' ? materials.length : filtered.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Materials */}
        <div className="space-y-4 animate-content-show delay-2">
          {filtered.map(renderMaterial)}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum material encontrado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
