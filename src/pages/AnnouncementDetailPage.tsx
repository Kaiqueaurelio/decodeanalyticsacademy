import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppImage } from '@/components/ui/app-image';
import {
  ArrowLeft, ExternalLink, Megaphone, GraduationCap, Calendar,
  Briefcase, Sparkles, Clock, Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  link_url: string | null;
  published: boolean;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; accent: string }> = {
  geral: { label: 'Geral', icon: Megaphone, color: 'bg-primary/10 text-primary', accent: 'from-primary/20 to-primary/5' },
  cursos: { label: 'Cursos', icon: GraduationCap, color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]', accent: 'from-[hsl(var(--success))]/20 to-[hsl(var(--success))]/5' },
  provas: { label: 'Provas', icon: Calendar, color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]', accent: 'from-[hsl(var(--warning))]/20 to-[hsl(var(--warning))]/5' },
  empregos: { label: 'Empregos', icon: Briefcase, color: 'bg-accent text-accent-foreground', accent: 'from-accent/20 to-accent/5' },
  eventos: { label: 'Eventos', icon: Sparkles, color: 'bg-primary/10 text-primary', accent: 'from-primary/20 to-primary/5' },
};

const CATEGORY_LABELS: Record<string, string> = {
  cursos: 'Sobre o Curso',
  empregos: 'Sobre a Vaga',
  eventos: 'Sobre o Evento',
  provas: 'Sobre a Prova',
  geral: 'Detalhes',
};

const CTA_LABELS: Record<string, string> = {
  cursos: 'Acessar Curso',
  empregos: 'Ver Vaga Completa',
  eventos: 'Ir para o Evento',
  provas: 'Acessar Link',
  geral: 'Saiba Mais',
};

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Aviso não encontrado');
          navigate(-1);
          return;
        }
        setAnnouncement(data as Announcement);
        setLoading(false);
      });
  }, [id, navigate]);

  const handleShare = async () => {
    if (!announcement) return;
    try {
      await navigator.share({
        title: announcement.title,
        text: announcement.content.slice(0, 100),
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    }
  };

  if (loading || !announcement) {
    return (
      <div className="min-h-dvh bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const cfg = CATEGORY_CONFIG[announcement.category] || CATEGORY_CONFIG.geral;
  const Icon = cfg.icon;
  const sectionLabel = CATEGORY_LABELS[announcement.category] || 'Detalhes';
  const ctaLabel = CTA_LABELS[announcement.category] || 'Saiba Mais';
  const timeAgo = getTimeAgo(announcement.created_at);

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() = aria-label="Voltar"> navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{cfg.label}</span>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare} aria-label="Compartilhar">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-8">
        {/* Hero Image */}
        {announcement.image_url && (
          <div className="relative w-full aspect-video overflow-hidden">
            <AppImage
              src={announcement.image_url}
              alt={announcement.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              fallbackClassName="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        )}

        <div className="px-4 space-y-5">
          {/* Category + Date */}
          <div className={`flex items-center gap-3 ${announcement.image_url ? '-mt-8 relative z-10' : 'mt-4'}`}>
            <Badge variant="secondary" className={`${cfg.color} text-xs px-3 py-1`}>
              <Icon className="h-3 w-3 mr-1.5" /> {cfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {timeAgo}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-xl font-bold leading-tight">{announcement.title}</h1>

          {/* Content */}
          <Card className={`border-0 bg-gradient-to-br ${cfg.accent}`}>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {sectionLabel}
              </h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                <p className="text-[10px] text-muted-foreground">Categoria</p>
                <p className="text-xs font-semibold">{cfg.label}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                <p className="text-[10px] text-muted-foreground">Publicado em</p>
                <p className="text-xs font-semibold">
                  {new Date(announcement.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Button */}
          {announcement.link_url && (
            <a
              href={announcement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full h-12 text-sm font-semibold gap-2 gradient-primary text-primary-foreground rounded-xl">
                <ExternalLink className="h-4 w-4" />
                {ctaLabel}
              </Button>
            </a>
          )}

          {/* Back */}
          <Button
            variant="outline"
            className="w-full h-10 text-xs rounded-xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Voltar ao Mural
          </Button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  if (diffD < 7) return `${diffD}d atrás`;
  return date.toLocaleDateString('pt-BR');
}
