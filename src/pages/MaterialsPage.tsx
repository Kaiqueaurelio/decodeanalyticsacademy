import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, FileText, Image, Video, Music, File, Download, ExternalLink,
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize, X
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;

// Audio Player Component (Spotify-style)
function AudioPlayer({ url, title }: { url: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio] = useState(() => new Audio(url));

  useEffect(() => {
    audio.addEventListener('timeupdate', () => setCurrTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => setPlaying(false));
    return () => { audio.pause(); audio.src = ''; };
  }, [audio]);

  const toggle = () => {
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  };

  const seek = (val: number[]) => {
    audio.currentTime = val[0];
    setCurrTime(val[0]);
  };

  const skip = (s: number) => {
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + s));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
      </div>

      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={0.1}
        onValueChange={seek}
        className="mb-2"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => skip(-15)} className="p-2 rounded-full hover:bg-primary/10 smooth-all">
          <SkipBack className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={toggle} className="p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 smooth-all shadow-lg">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button onClick={() => skip(15)} className="p-2 rounded-full hover:bg-primary/10 smooth-all">
          <SkipForward className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-full hover:bg-primary/10 smooth-all ml-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// Video Player Component (YouTube-style)
function VideoPlayer({ url, title }: { url: string; title: string }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-black border border-border/30">
      <video
        controls
        className="w-full aspect-video"
        poster=""
        preload="metadata"
      >
        <source src={url} />
        Seu navegador não suporta vídeos.
      </video>
      <div className="p-3 bg-card">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Vídeo · Material de apoio</p>
      </div>
    </div>
  );
}

// Image Viewer
function ImageViewer({ url, title }: { url: string; title: string }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border/30 cursor-pointer group" onClick={() => setFullscreen(true)}>
        <div className="relative">
          <img src={url} alt={title} className="w-full max-h-[400px] object-contain bg-muted/30" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 smooth-all flex items-center justify-center">
            <Maximize className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 smooth-all" />
          </div>
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

// PDF Viewer
function PdfViewer({ url, title }: { url: string; title: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/30">
      <iframe src={url} className="w-full h-[500px] sm:h-[600px]" title={title} />
      <div className="p-3 bg-card flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-[10px] text-muted-foreground">PDF · Material de apoio</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Baixar
          </a>
        </Button>
      </div>
    </div>
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
    { value: 'other', label: 'Outros', icon: File },
  ];

  const filtered = filter === 'all' ? materials : materials.filter(m => {
    if (filter === 'other') return !['pdf', 'image', 'video', 'audio'].includes(m.type);
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
      case 'link':
        return (
          <Card key={m.id} className="p-4 bg-card border border-border/50 hover:border-primary/30 smooth-all">
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
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground smooth-all mb-4">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap smooth-all border ${
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
