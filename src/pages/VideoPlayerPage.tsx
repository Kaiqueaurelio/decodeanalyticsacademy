import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Search, Subtitles, ChevronDown, ChevronUp,
  Loader2, AlertCircle, BookOpen, PenLine, ExternalLink
} from 'lucide-react';
import { getSubjectColor } from '@/lib/subject-colors';
import { sameSubject } from '@/lib/subject-semester-map';
import type { Tables } from '@/integrations/supabase/types';

type Material = Tables<'materials'>;

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface TranscriptLine {
  id: number;
  time: number;
  text: string;
}

// Parse simple transcript format: "0:00 - Text" or just lines
function parseTranscript(content: string | null): TranscriptLine[] {
  if (!content) return [];
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    const match = line.match(/^(\d+):(\d{2})\s*[-–]\s*(.+)/);
    if (match) {
      const time = parseInt(match[1]) * 60 + parseInt(match[2]);
      return { id: i, time, text: match[3].trim() };
    }
    return { id: i, time: 0, text: line.trim() };
  });
}

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const [material, setMaterial] = useState<Material | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [relatedApostila, setRelatedApostila] = useState<Tables<'apostilas'> | null>(null);

  // Player state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);

  // Transcript state
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const [activeLineId, setActiveLineId] = useState<number>(-1);

  useEffect(() => {
    if (!id) return;
    loadMaterial();
  }, [id]);

  const loadMaterial = async () => {
    setLoading(true);
    const { data: mat } = await supabase.from('materials').select('*').eq('id', id).single();
    if (!mat) { setLoading(false); return; }
    setMaterial(mat);

    // Get signed URL
    if (mat.file_path) {
      const { data: signed } = await supabase.storage
        .from('materials')
        .createSignedUrl(mat.file_path, 3600);
      if (signed?.signedUrl) setVideoUrl(signed.signedUrl);
      else setVideoUrl(mat.file_url || '');
    } else {
      setVideoUrl(mat.file_url || '');
    }

    // Generate mock transcript from description if available
    if (mat.description) {
      const sentences = mat.description.split(/[.!?]+/).filter(s => s.trim());
      const mockTranscript: TranscriptLine[] = sentences.map((s, i) => ({
        id: i,
        time: i * 30, // approximate 30s per sentence
        text: s.trim(),
      }));
      setTranscript(mockTranscript);
    }

    // Try to find related apostila by category
    if (mat.category_id) {
      const { data: cat } = await supabase.from('categories').select('name').eq('id', mat.category_id).single();
      if (cat) {
        const { data: ap } = await supabase.from('apostilas').select('*').eq('published', true);
        const related = ap?.find((apostila) => sameSubject(apostila.category, cat.name));
        if (related) setRelatedApostila(related);
      }
    }

    setLoading(false);
  };

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    // Find active transcript line
    if (transcript.length > 0) {
      let active = -1;
      for (let i = transcript.length - 1; i >= 0; i--) {
        if (t >= transcript[i].time) { active = transcript[i].id; break; }
      }
      if (active !== activeLineId) {
        setActiveLineId(active);
        // Auto-scroll transcript
        const el = document.getElementById(`transcript-line-${active}`);
        if (el && transcriptRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [transcript, activeLineId]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().then(() => setPlaying(true)).catch(() => setError(true)); }
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  }, [duration]);

  const seekToTime = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    if (!playing) { videoRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  }, [playing]);

  const skip = useCallback((s: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + s));
  }, [duration]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('video-container');
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Filtered transcript lines
  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(l => l.text.toLowerCase().includes(q));
  }, [transcript, searchQuery]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const categoryColor = material?.category_id ? '#E8FF47' : getSubjectColor(material?.title || '');

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="container max-w-5xl px-4 py-8">
          <div className="skeleton-shimmer h-8 w-48 rounded-lg mb-4" />
          <div className="skeleton-shimmer aspect-video rounded-xl mb-4" />
          <div className="skeleton-shimmer h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-dvh bg-background">
        <AppHeader />
        <div className="container max-w-5xl px-4 py-16 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Vídeo não encontrado</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/materials')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Voltar aos Materiais
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="container max-w-5xl px-4 py-4 sm:py-6">
        {/* Back nav */}
        <button onClick={() => navigate('/materials')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 animate-fade-in">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos Materiais
        </button>

        {/* Title bar */}
        <div className="mb-4 animate-content-show" style={{ backgroundColor: `${categoryColor}12`, borderLeft: `3px solid ${categoryColor}` }}>
          <div className="px-4 py-3">
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-snug">
              {material.title}
            </h1>
            {material.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{material.description}</p>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div id="video-container" className="rounded-xl overflow-hidden bg-black mb-4 animate-content-show delay-1">
          <div className="relative">
            {error ? (
              <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
                <AlertCircle className="h-8 w-8 opacity-50" />
                <p className="text-sm font-medium">Não foi possível carregar o vídeo</p>
                <Button size="sm" variant="outline" asChild>
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir externamente
                  </a>
                </Button>
              </div>
            ) : (
              <>
                {buffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                  </div>
                )}
                <video
                  ref={videoRef}
                  className="w-full aspect-video cursor-pointer"
                  src={videoUrl}
                  playsInline
                  preload="metadata"
                  onClick={togglePlay}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
                  onWaiting={() => setBuffering(true)}
                  onCanPlay={() => setBuffering(false)}
                  onError={() => setError(true)}
                  onEnded={() => setPlaying(false)}
                />
                {/* Play overlay when paused */}
                {!playing && !buffering && !error && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
                      <Play className="h-7 w-7 sm:h-8 sm:w-8 text-white ml-1" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Custom Controls Bar */}
          {!error && (
            <div className="bg-card/95 backdrop-blur-sm px-3 py-2 space-y-2">
              {/* Progress bar */}
              <div
                className="h-1.5 bg-muted rounded-full cursor-pointer group relative"
                onClick={seek}
              >
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{ width: `${progress}%`, backgroundColor: categoryColor }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, backgroundColor: categoryColor, transform: `translate(-50%, -50%)` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button onClick={togglePlay} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <button onClick={() => skip(-10)} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <SkipBack className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => skip(10)} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <SkipForward className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={toggleMute} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <span className="text-[10px] text-muted-foreground font-mono-label ml-1">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className={`p-1.5 rounded-md transition-colors ${showTranscript ? 'bg-primary/15 text-primary' : 'hover:bg-muted/50'}`}
                  >
                    <Subtitles className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={toggleFullscreen} className="p-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Panel */}
        {showTranscript && transcript.length > 0 && (
          <Card className="mb-4 overflow-hidden animate-content-show delay-2">
            {/* Search bar */}
            <div className="flex items-center gap-2 p-3 border-b border-border/50">
              <div className="rounded-lg bg-primary/10 p-2">
                <Subtitles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar na legenda"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 rounded-lg pl-9 pr-3 py-2 text-sm border border-border/30 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Transcript lines */}
            <div ref={transcriptRef} className="max-h-64 overflow-y-auto hide-scrollbar">
              {filteredTranscript.map(line => (
                <button
                  key={line.id}
                  id={`transcript-line-${line.id}`}
                  onClick={() => seekToTime(line.time)}
                  className={`w-full text-left px-4 py-3 text-sm transition-all duration-200 border-l-3 ${
                    activeLineId === line.id
                      ? 'bg-primary/8 border-l-primary text-foreground font-medium'
                      : 'border-l-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <div className="flex gap-3">
                    {line.time > 0 && (
                      <span className="text-[10px] font-mono-label text-primary/70 shrink-0 mt-0.5">
                        {fmt(line.time)}
                      </span>
                    )}
                    <span className="leading-relaxed">{line.text}</span>
                  </div>
                </button>
              ))}
              {filteredTranscript.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado para "{searchQuery}"
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Transcript placeholder when no transcript */}
        {showTranscript && transcript.length === 0 && (
          <Card className="mb-4 p-6 text-center animate-content-show delay-2">
            <Subtitles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Legenda não disponível para este vídeo</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">O admin pode adicionar legendas na descrição do material</p>
          </Card>
        )}

        {/* Related Apostila */}
        {relatedApostila && (
          <Card className="p-4 animate-content-show delay-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Apostila relacionada</p>
                <p className="font-medium text-sm truncate">{relatedApostila.title}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => navigate(`/apostila/${relatedApostila.id}`)} className="text-xs gap-1.5 h-8">
                  <BookOpen className="h-3.5 w-3.5" /> Ler
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
