import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/hooks/useGamification';
import { AppHeader } from '@/components/AppHeader';
import { Watermark } from '@/components/Watermark';
import { Button } from '@/components/ui/button';
import { FlashcardsWidget } from '@/components/FlashcardsWidget';
import { AnnotationsPanel } from '@/components/AnnotationsPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ArrowLeft, BookOpen, PenLine, Eye, List, X,
  ChevronUp, StickyNote, Layers
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface Section {
  id: string;
  title: string;
  level: number;
  content: string;
}

function parseContent(raw: string | null): Section[] {
  if (!raw) return [{ id: 'intro', title: 'Introdução', level: 1, content: '' }];

  const lines = raw.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    // Match patterns like "1.", "1.1", "1.1.1", "## Title", "### Title"
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*)[.\s\-–]+\s*(.+)/);
    const hashMatch = line.match(/^(#{1,3})\s+(.+)/);

    if (numberedMatch) {
      if (current) sections.push(current);
      const depth = numberedMatch[1].split('.').length;
      const title = numberedMatch[2].trim();
      const id = `section-${sections.length}`;
      current = { id, title, level: Math.min(depth, 3), content: '' };
    } else if (hashMatch) {
      if (current) sections.push(current);
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
  if (current) sections.push(current);

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
  const [showSidebar, setShowSidebar] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    supabase.from('apostilas').select('*').eq('id', id).single().then(({ data }) => setApostila(data));
    supabase.from('exercises').select('id').eq('apostila_id', id).then(({ data }) => setExerciseCount(data?.length || 0));
    gamification.addXP(5);
    gamification.updateStreak();
  }, [id]);

  const sections = useMemo(() => parseContent(apostila?.content || null), [apostila?.content]);

  // Intersection observer for active section tracking
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

  if (!apostila) return null;

  const tocContent = (
    <nav className="space-y-0.5">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollToSection(s.id)}
          className={`block w-full text-left py-1.5 px-2 rounded text-xs transition-all duration-200 ${
            s.level === 1 ? 'font-semibold' : s.level === 2 ? 'pl-4' : 'pl-6 text-[11px]'
          } ${
            activeSection === s.id
              ? 'text-primary bg-primary/10 border-l-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
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

      {/* Focus mode top bar */}
      {focusMode && (
        <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-card/95 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4">
          <span className="font-mono-label text-xs text-muted-foreground uppercase tracking-wider truncate max-w-[50%]">
            {apostila.title}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setFocusMode(false)} className="text-xs gap-1.5">
            <X className="h-3.5 w-3.5" /> Sair do foco
          </Button>
        </div>
      )}

      <main className={`relative z-10 ${focusMode ? 'pt-16' : ''}`}>
        {/* Navigation bar */}
        <div className={`container max-w-7xl px-4 ${focusMode ? 'py-2' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-xs gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              {isMobile && sections.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTocMobile(!showTocMobile)}
                  className="text-xs gap-1.5"
                >
                  <List className="h-3.5 w-3.5" /> Índice
                </Button>
              )}
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                className="text-xs gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" /> {focusMode ? 'Foco ativo' : 'Modo foco'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile TOC overlay */}
        {isMobile && showTocMobile && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md pt-20 px-6 overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Índice</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTocMobile(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {tocContent}
          </div>
        )}

        {/* 3-column layout */}
        <div className="container max-w-7xl px-4 pb-12">
          <div className={`grid gap-6 ${
            focusMode
              ? 'grid-cols-1 max-w-3xl mx-auto'
              : isMobile
                ? 'grid-cols-1'
                : 'grid-cols-[220px_1fr_280px]'
          }`}>

            {/* Left: TOC sidebar */}
            {!isMobile && !focusMode && sections.length > 1 && (
              <aside className="animate-fade-in">
                <div className="sticky top-20">
                  <div className="flex items-center gap-2 mb-3">
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
            <article ref={contentRef} className="min-w-0 animate-content-show">
              {/* Header */}
              <div className="mb-8 pb-6 border-b border-border/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono-label text-[10px] uppercase tracking-wider text-primary">
                    {apostila.category}
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3 text-foreground">
                  {apostila.title}
                </h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {sections.length} seções
                  </span>
                  {exerciseCount > 0 && (
                    <span className="flex items-center gap-1">
                      <PenLine className="h-3 w-3" /> {exerciseCount} exercícios
                    </span>
                  )}
                </div>
              </div>

              {/* Rendered sections */}
              <div className="space-y-8">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    data-section-id={section.id}
                    className="scroll-mt-24"
                  >
                    {section.level === 1 && (
                      <h2 className="font-display text-2xl sm:text-3xl mb-4 text-foreground">
                        {section.title}
                      </h2>
                    )}
                    {section.level === 2 && (
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 text-foreground/90">
                        {section.title}
                      </h3>
                    )}
                    {section.level === 3 && (
                      <h4 className="text-base font-medium mb-2 text-foreground/80 font-mono-label">
                        {section.title}
                      </h4>
                    )}
                    {section.content.trim() && (
                      <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {section.content.trim()}
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {/* Exercise CTA */}
              {exerciseCount > 0 && (
                <div className="mt-10 pt-6 border-t border-border/30 text-center animate-content-show delay-2">
                  <Button
                    className="gradient-primary text-primary-foreground"
                    onClick={() => navigate(`/exercises/${id}`)}
                  >
                    <PenLine className="mr-1.5 h-4 w-4" /> Fazer exercícios ({exerciseCount})
                  </Button>
                </div>
              )}
            </article>

            {/* Right: Tools sidebar */}
            {!focusMode && (
              <aside className={`${isMobile ? '' : 'animate-fade-in'}`}>
                <div className={isMobile ? 'space-y-4 mt-6' : 'sticky top-20 space-y-4'}>
                  <div className="flex items-center gap-2 mb-1">
                    <StickyNote className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">Ferramentas</span>
                  </div>

                  {/* Annotations */}
                  <AnnotationsPanel apostilaId={id!} />

                  {/* Flashcards */}
                  <FlashcardsWidget apostilaId={id} />
                </div>
              </aside>
            )}
          </div>
        </div>

        {/* Scroll to top FAB */}
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      </main>
    </div>
  );
}
