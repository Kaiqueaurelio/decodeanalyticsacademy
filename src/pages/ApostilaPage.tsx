import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { FlashcardsWidget } from '@/components/FlashcardsWidget';
import { AnnotationsPanel } from '@/components/AnnotationsPanel';
import { CommentsWidget } from '@/components/CommentsWidget';

import { ApostilaMaterials } from '@/components/ApostilaMaterials';
import { ApostilaChat } from '@/components/ApostilaChat';
import { ApostilaContentRenderer } from '@/components/ApostilaContentRenderer';
import { SpeakButton } from '@/components/SpeakButton';
import { ApostilaSummaryDialog } from '@/components/ApostilaSummaryDialog';
import { UnitTilesGrid, buildUnitResources } from '@/components/UnitTilesGrid';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { ActionSheet, type ActionItem } from '@/components/ActionSheet';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, PenLine, Eye, List, X, MoreHorizontal,
  ChevronUp, StickyNote, Layers, Sparkles, MessageSquare, Share2, CheckCircle2, Copy, Volume2
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
}

/**
 * Remove sintaxe markdown residual (negrito, itálico, código, links etc.)
 * para renderizar texto puro com fonte unificada.
 */
function cleanText(input: string): string {
  if (!input) return '';
  return input
    // imagens deixam para o renderer (já tratado depois)
    // links [texto](url) → texto
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // bold/italic combinados ***x*** ou ___x___
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    // bold **x** ou __x__
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    // italic *x* ou _x_ (evita pegar listas no início "* item")
    .replace(/(?<![*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1')
    .replace(/(?<![_\w])_(?!\s)([^_\n]+?)_(?!\w)/g, '$1')
    // code `x`
    .replace(/`([^`]+)`/g, '$1')
    // strike ~~x~~
    .replace(/~~([^~]+)~~/g, '$1')
    // marcadores de bullet markdown no início → ponto
    .replace(/^\s*[*+-]\s+/gm, '• ')
    // headings hash residuais "# Título" → "Título"
    .replace(/^\s*#{1,6}\s+/gm, '');
}

function parseContent(raw: string | null): Section[] {
  if (!raw) return [{ id: 'intro', title: 'Introdução', level: 1, content: '' }];

  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line));

  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const numberedMatch = trimmedLine.match(/^(\d+(?:\.\d+)*)[.\s\-–]+\s*(.+)/);
    const hashMatch = trimmedLine.match(/^(#{1,3})\s+(.+)/);

    if (numberedMatch) {
      if (current && (current.title.trim() || current.content.trim())) sections.push(current);
      const depth = numberedMatch[1].split('.').length;
      const title = numberedMatch[2].trim();
      const id = `section-${sections.length}`;
      current = { id, title, level: Math.min(depth, 3), content: '' };
    } else if (hashMatch) {
      if (current && (current.title.trim() || current.content.trim())) sections.push(current);
      const level = hashMatch[1].length;
      const title = hashMatch[2].trim();
      const id = `section-${sections.length}`;
      current = { id, title, level, content: '' };
    } else {
      if (!current) {
        current = { id: 'section-0', title: 'Introdução', level: 1, content: '' };
      }
      current.content += line + '\n';
    }
  }

  if (current && (current.title.trim() || current.content.trim())) sections.push(current);

  return sections.length > 0 ? sections : [{ id: 'intro', title: 'Conteúdo', level: 1, content: raw }];
}

export default function ApostilaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gamification = useGamification();
  const isMobile = useIsMobile();
  const [apostila, setApostila] = useState<Tables<'apostilas'> | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showTocMobile, setShowTocMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('apostilas').select('*').eq('id', id).single(),
      supabase.from('exercises').select('id').eq('apostila_id', id),
    ]).then(([{ data: ap }, { data: exs }]) => {
      setApostila(ap);
      setExerciseCount(exs?.length || 0);
      setLoading(false);
    });
    gamification.addXP(5);
    gamification.updateStreak();
  }, [id]);

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = useMemo(() => parseContent(apostila?.content || null), [apostila?.content]);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    const headings = contentRef.current.querySelectorAll('[data-section-id]');
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowTocMobile(false);
    }
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container max-w-7xl px-4 py-12">
          <div className="skeleton-shimmer h-8 w-48 rounded-lg mb-4" />
          <div className="skeleton-shimmer h-12 w-3/4 rounded-lg mb-3" />
          <div className="skeleton-shimmer h-5 w-1/3 rounded-lg mb-10" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton-shimmer h-4 rounded" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!apostila) return null;

  const tocContent = (
    <nav className="space-y-0.5">
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => scrollToSection(s.id)}
          className={`block w-full text-left py-2 px-3 rounded-lg text-xs transition-all duration-200 animate-fade-in ${
            s.level === 1 ? 'font-semibold' : s.level === 2 ? 'pl-5' : 'pl-7 text-[11px]'
          } ${
            activeSection === s.id
              ? 'text-primary bg-primary/10 border-l-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {s.title}
        </button>
      ))}
    </nav>
  );

  return (
    <div className={`min-h-screen bg-background relative ${focusMode ? 'focus-mode' : ''}`}>
      {!focusMode && <Watermark />}
      {!focusMode && <AppHeader />}

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-border/20">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Focus mode top bar */}
      {focusMode && (
        <div className="fixed top-0.5 left-0 right-0 z-50 h-12 bg-card/95 backdrop-blur-md flex items-center justify-between px-4 animate-fade-in border-b border-border/50">
          <span className="font-mono-label text-xs text-muted-foreground uppercase tracking-wider truncate max-w-[50%]">
            {apostila.title}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setFocusMode(false)} className="text-xs gap-1.5 hover-lift">
            <X className="h-3.5 w-3.5" /> Sair do foco
          </Button>
        </div>
      )}

      <main className={`relative z-10 ${focusMode ? 'pt-16' : ''}`}>
        {/* Navigation bar */}
        <div className={`container max-w-7xl px-4 ${focusMode ? 'py-2' : 'py-4'} animate-content-show`}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-xs gap-1.5 hover-lift">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Dashboard
            </Button>
            <div className="flex items-center gap-2">
              {isMobile && sections.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTocMobile(!showTocMobile)}
                  className="text-xs gap-1.5 hover-lift"
                >
                  <List className="h-3.5 w-3.5" /> Índice
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="text-xs gap-1.5 hover-lift border-primary/40 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Conversar com a apostila</span>
                <span className="sm:hidden">Chat</span>
              </Button>
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="text-xs gap-1.5 hover-lift"
              >
                <Eye className="h-3.5 w-3.5" /> {focusMode ? 'Foco ativo' : 'Modo foco'}
              </Button>

              {/* Bottom sheet de ações rápidas (mobile-first) */}
              <ActionSheet
                title={apostila?.title || 'Ações'}
                description="Atalhos para esta apostila"
                actions={[
                  {
                    id: 'mark-read',
                    label: 'Marcar como lida',
                    description: '+10 XP de progresso',
                    icon: CheckCircle2,
                    variant: 'primary',
                    onSelect: async () => {
                      await gamification.addXP(10);
                      toast.success('Marcada como lida! +10 XP');
                    },
                  },
                  {
                    id: 'note',
                    label: 'Nova anotação',
                    description: 'Abrir painel lateral',
                    icon: PenLine,
                    onSelect: () => {
                      const annotations = document.querySelector('[data-annotations-panel]');
                      annotations?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    },
                  },
                  {
                    id: 'chat',
                    label: 'Conversar com a apostila',
                    description: 'Tirar dúvidas com IA',
                    icon: Sparkles,
                    onSelect: () => setChatOpen(true),
                  },
                  {
                    id: 'listen',
                    label: 'Ouvir em voz',
                    description: 'Rolar até o leitor de áudio',
                    icon: Volume2,
                    onSelect: () => {
                      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    },
                  },
                  {
                    id: 'share',
                    label: 'Compartilhar',
                    description: 'Copiar link da apostila',
                    icon: Share2,
                    onSelect: async () => {
                      const url = window.location.href;
                      const shareData = { title: apostila?.title, url };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard.writeText(url);
                          toast.success('Link copiado');
                        }
                      } catch { /* cancelado */ }
                    },
                  },
                  {
                    id: 'copy-link',
                    label: 'Copiar link',
                    icon: Copy,
                    onSelect: async () => {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copiado');
                    },
                  },
                ]}
                trigger={
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 hover-lift" aria-label="Mais ações">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* Mobile TOC overlay */}
        {isMobile && showTocMobile && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-20 px-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg flex items-center gap-2">
                <List className="h-4 w-4 text-primary" /> Índice da Apostila
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTocMobile(false)} className="hover-lift">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {tocContent}
          </div>
        )}

        {/* 3-column layout */}
        <div className="container max-w-7xl px-4 pb-16">
          <div className={`grid gap-8 ${
            focusMode
              ? 'grid-cols-1 max-w-3xl mx-auto'
              : isMobile
                ? 'grid-cols-1'
                : 'grid-cols-[220px_1fr_280px]'
          }`}>

            {/* Left: TOC sidebar */}
            {!isMobile && !focusMode && sections.length > 1 && (
              <aside className="animate-content-show delay-1">
                <div className="sticky top-20">
                  <div className="flex items-center gap-2 mb-4">
                    <List className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">Índice</span>
                  </div>
                  <div className="max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar pr-2">
                    {tocContent}
                  </div>
                </div>
              </aside>
            )}

            {/* Center: Main content */}
            <article ref={contentRef} className="min-w-0 animate-content-show delay-2">
              {/* Header */}
              <div className="mb-10 pb-8 border-b border-border/50">
                <div className="flex items-center gap-2 mb-4 animate-fade-in">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 font-mono-label text-[10px] uppercase tracking-wider text-primary border border-primary/20">
                    <BookOpen className="h-3 w-3" /> {apostila.category}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 text-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
                  {apostila.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> {sections.length} seções
                  </span>
                  {exerciseCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <PenLine className="h-3.5 w-3.5" /> {exerciseCount} exercícios
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-primary/70">
                    ~{Math.max(1, Math.round((apostila.content?.length || 0) / 1200))} min de leitura
                  </span>
                </div>

                {/* Ações rápidas — Ouvir, Resumo, Mapa Mental */}
                <div className="mt-5 flex flex-wrap items-center gap-2 animate-fade-in" style={{ animationDelay: '280ms' }}>
                  <SpeakButton
                    size="lg"
                    label="Ouvir apostila"
                    getText={() => `${apostila.title}. ${apostila.content || ''}`}
                  />
                  <ApostilaSummaryDialog apostilaId={id!} apostilaTitle={apostila.title} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Leitura em PT-BR · resumo de 1 página + mapa mental gerado por IA
                </p>
              </div>

              {/* Unit tiles - estilo AVA */}
              <UnitTilesGrid
                unitNumber="I"
                unitTitle={apostila.title}
                resources={buildUnitResources({
                  onOpenContent: () => {
                    document.getElementById('conteudo-principal')?.scrollIntoView({ behavior: 'smooth' });
                  },
                  onOpenSlides: () => {
                    document.getElementById('materiais-vinculados')?.scrollIntoView({ behavior: 'smooth' });
                  },
                  onOpenVideos: () => {
                    document.getElementById('materiais-vinculados')?.scrollIntoView({ behavior: 'smooth' });
                  },
                  onOpenActivity: () => navigate(`/exercises/${id}`),
                  hasSlides: true,
                  hasVideos: true,
                })}
              />

              {/* Rendered sections */}
              <div id="conteudo-principal" className="space-y-10 scroll-mt-24">
                {sections.map((section, idx) => (
                  <section
                    key={section.id}
                    id={section.id}
                    data-section-id={section.id}
                    className="scroll-mt-24 animate-content-show"
                    style={{ animationDelay: `${300 + idx * 80}ms` }}
                  >
                    {section.level === 1 && (
                      <h2 className="font-display text-2xl sm:text-3xl mb-5 text-foreground relative">
                        <span className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/40 rounded-full hidden sm:block" />
                        {cleanText(section.title)}
                      </h2>
                    )}
                    {section.level === 2 && (
                      <h3 className="font-display text-lg sm:text-xl font-semibold mb-4 text-foreground/90">
                        {cleanText(section.title)}
                      </h3>
                    )}
                    {section.level === 3 && (
                      <h4 className="font-display text-base font-semibold mb-3 text-foreground/85">
                        {cleanText(section.title)}
                      </h4>
                    )}
                    {section.content.trim() && (
                      <ApostilaContentRenderer content={section.content} />
                    )}
                  </section>
                ))}
              </div>

              {/* Linked Materials */}
              <div id="materiais-vinculados" className="scroll-mt-24">
                <ApostilaMaterials apostilaId={id!} />
              </div>

              {/* Exercise CTA */}
              {exerciseCount > 0 && (
                <div className="mt-12 pt-8 text-center animate-content-show border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">Pronto para testar seus conhecimentos?</p>
                  <Button
                    size="lg"
                    className="gradient-primary text-primary-foreground hover-lift"
                    onClick={() => navigate(`/exercises/${id}`)}
                  >
                    <PenLine className="mr-2 h-4 w-4" /> Fazer {exerciseCount} exercícios
                  </Button>
                </div>
              )}

              {/* Comments section */}
              <div className="mt-12 pt-8 border-t border-border/50 animate-content-show">
                <CommentsWidget contextType="apostila" contextId={id!} />
              </div>
            </article>

            {/* Right: Tools sidebar */}
            {!focusMode && (
              <aside className={`${isMobile ? '' : 'animate-content-show delay-3'}`}>
                <div className={isMobile ? 'space-y-4 mt-8' : 'sticky top-20 space-y-4'}>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">Ferramentas de Estudo</span>
                  </div>

                  <AnnotationsPanel apostilaId={id!} />
                  <FlashcardsWidget apostilaId={id} />
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Scroll to top FAB */}
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-30 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover-lift transition-all duration-300 ${
            scrollProgress > 10 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </button>

        {/* FAB: Conversar com a apostila */}
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 left-6 z-30 h-14 px-5 rounded-full gradient-primary text-primary-foreground flex items-center gap-2.5 shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover-lift transition-all ring-2 ring-primary/30"
          aria-label="Conversar com a IA sobre a apostila"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-semibold">Chat IA</span>
        </button>

        {/* Chat Sheet */}
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg lg:max-w-xl p-0 flex flex-col gap-0 border-l border-primary/20">
            <div className="flex-1 overflow-hidden">
              <ApostilaChat apostilaId={id!} apostilaTitle={apostila.title} />
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
