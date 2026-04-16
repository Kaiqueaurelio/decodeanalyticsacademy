import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  FileText, Image, Video, Music, Presentation, File, Link as LinkIcon,
  FileSpreadsheet, ExternalLink, Paperclip, Eye, X, Maximize, Play, Pause,
  SkipBack, SkipForward, Volume2, VolumeX, Loader2, AlertCircle
} from 'lucide-react';
import { useRef } from 'react';

interface LinkedMaterial {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
  file_path: string | null;
  description: string | null;
}

const TYPE_ICONS: Record<string, any> = {
  pdf: FileText, image: Image, video: Video, audio: Music,
  powerpoint: Presentation, word: FileText, excel: FileSpreadsheet,
  link: LinkIcon, gif: Image, other: File, exam: FileText,
};

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

interface Props {
  apostilaId: string;
}

export function ApostilaMaterials({ apostilaId }: Props) {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<LinkedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<LinkedMaterial | null>(null);

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
        // Preserve sort order & get signed URLs
        const matMap = new Map((mats || []).map(m => [m.id, m]));
        const sorted: LinkedMaterial[] = [];
        for (const id of ids) {
          const m = matMap.get(id);
          if (!m) continue;
          // Get signed URL for private files
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
        setMaterials(sorted);
        setLoading(false);
      });
  }, [apostilaId]);

  const openMaterial = (m: LinkedMaterial) => {
    if (m.type === 'link' && m.file_url) {
      window.open(m.file_url, '_blank');
      return;
    }
    if (m.type === 'video') {
      // Navigate to video player page
      navigate(`/video/${m.id}`);
      return;
    }
    setViewing(m);
  };

  if (loading || materials.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border/50 animate-content-show">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="h-4 w-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Material de Apoio</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {materials.map(m => {
          const Icon = TYPE_ICONS[m.type] || File;
          return (
            <Card
              key={m.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => openMaterial(m)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{m.title}</h4>
                    {m.description && (
                      <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                    )}
                    <Badge variant="secondary" className="text-[9px] mt-1">{m.type.toUpperCase()}</Badge>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Viewer Dialog */}
      {viewing && (
        <MaterialViewerDialog material={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function MaterialViewerDialog({ material, onClose }: { material: LinkedMaterial; onClose: () => void }) {
  const [fullscreen, setFullscreen] = useState(false);

  const renderViewer = () => {
    if (!material.file_url) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-3 opacity-50" />
          <p className="text-sm">Arquivo indisponível</p>
        </div>
      );
    }

    switch (material.type) {
      case 'pdf':
        return (
          <div className="space-y-2">
            <iframe src={material.file_url} className="w-full h-[60vh] rounded-lg border border-border/30" title={material.title} />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setFullscreen(true)}>
                <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
              </Button>
            </div>
          </div>
        );

      case 'image':
      case 'gif':
        return (
          <div className="flex justify-center">
            <img
              src={material.file_url}
              alt={material.title}
              className="max-w-full max-h-[60vh] object-contain rounded-lg"
            />
          </div>
        );

      case 'audio':
        return <InlineAudioPlayer url={material.file_url} title={material.title} />;

      case 'powerpoint':
      case 'word':
      case 'excel': {
        const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(material.file_url)}&embedded=true`;
        const typeLabel = material.type === 'powerpoint' ? 'PowerPoint' : material.type === 'word' ? 'Word' : 'Excel';
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>
            </div>
            <iframe src={viewerUrl} className="w-full h-[60vh] rounded-lg border border-border/30" title={material.title} />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setFullscreen(true)}>
                <Maximize className="h-3.5 w-3.5 mr-1.5" /> Tela cheia
              </Button>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <File className="h-8 w-8 opacity-50" />
            <p className="text-sm">Visualização não disponível para este formato</p>
            <Button size="sm" variant="outline" asChild>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir externamente
              </a>
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base truncate flex items-center gap-2">
              {(() => { const Icon = TYPE_ICONS[material.type] || File; return <Icon className="h-4 w-4 text-primary shrink-0" />; })()}
              {material.title}
            </DialogTitle>
          </DialogHeader>
          {renderViewer()}
        </DialogContent>
      </Dialog>

      {/* Fullscreen overlay for PDF/Office */}
      {fullscreen && material.file_url && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2 min-w-0">
              {(() => { const Icon = TYPE_ICONS[material.type] || File; return <Icon className="h-4 w-4 text-primary shrink-0" />; })()}
              <p className="font-medium text-sm truncate">{material.title}</p>
            </div>
            <button onClick={() => setFullscreen(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <iframe
            src={['powerpoint', 'word', 'excel'].includes(material.type)
              ? `https://docs.google.com/gview?url=${encodeURIComponent(material.file_url)}&embedded=true`
              : material.file_url}
            className="flex-1 w-full"
            title={material.title}
          />
        </div>
      )}
    </>
  );
}

/* Inline audio player for the dialog */
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
