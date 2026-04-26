import { useEffect, useRef, useState } from 'react';
import ePub, { type Book as EpubBook, type Rendition } from 'epubjs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Minus, Plus, List } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTheme } from '@/hooks/useTheme';

interface EpubReaderProps {
  fileUrl: string;
  initialLocation?: string | null;
  onProgress: (location: string, percentage: number) => void;
}

export function EpubReader({ fileUrl, initialLocation, onProgress }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [fontSize, setFontSize] = useState(100);
  const [percentage, setPercentage] = useState(0);
  const [toc, setToc] = useState<Array<{ label: string; href: string }>>([]);
  const [currentHref, setCurrentHref] = useState<string>('');
  const { theme } = useTheme();

  useEffect(() => {
    if (!viewerRef.current) return;
    const book = ePub(fileUrl);
    bookRef.current = book;
    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'auto',
    });
    renditionRef.current = rendition;

    rendition.themes.fontSize(`${fontSize}%`);
    applyTheme(rendition, theme);

    rendition.display(initialLocation || undefined);

    book.ready.then(() => book.locations.generate(1024)).then(() => {
      rendition.on('relocated', (loc) => {
        const cfi = loc.start.cfi;
        const pct = book.locations.percentageFromCfi(cfi);
        setPercentage(pct * 100);
        setCurrentHref(loc.start.href || '');
        onProgress(cfi, pct * 100);
      });
    });

    book.loaded.navigation.then((nav) => {
      const flat: Array<{ label: string; href: string }> = [];
      const walk = (items: typeof nav.toc) => items.forEach((it) => {
        flat.push({ label: it.label.trim(), href: it.href });
        if (it.subitems?.length) walk(it.subitems);
      });
      walk(nav.toc);
      setToc(flat);
    });

    return () => {
      rendition.destroy();
      book.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  useEffect(() => {
    if (renditionRef.current) renditionRef.current.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  useEffect(() => {
    if (renditionRef.current) applyTheme(renditionRef.current, theme);
  }, [theme]);

  const next = () => renditionRef.current?.next();
  const prev = () => renditionRef.current?.prev();

  const currentChapterIndex = (() => {
    if (!currentHref || toc.length === 0) return -1;
    const base = currentHref.split('#')[0];
    return toc.findIndex((t) => t.href.split('#')[0] === base);
  })();

  const goChapter = (delta: number) => {
    if (toc.length === 0) return;
    const idx = currentChapterIndex;
    const target = idx === -1 ? (delta > 0 ? 0 : toc.length - 1) : idx + delta;
    if (target < 0 || target >= toc.length) return;
    renditionRef.current?.display(toc[target].href);
  };
  const nextChapter = () => goChapter(1);
  const prevChapter = () => goChapter(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.shiftKey && e.key === 'ArrowRight') { e.preventDefault(); nextChapter(); }
      else if (e.shiftKey && e.key === 'ArrowLeft') { e.preventDefault(); prevChapter(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toc, currentHref]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.25) prev();
    else if (x > rect.width * 0.75) next();
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-background">
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.max(70, s - 10))}>
          <Minus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setFontSize((s) => Math.min(180, s + 10))}>
          <Plus className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8"><List className="h-4 w-4" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto">
            <SheetHeader><SheetTitle>Capítulos</SheetTitle></SheetHeader>
            <div className="mt-4 flex flex-col gap-1">
              {toc.map((item, i) => {
                const isCurrent = i === currentChapterIndex;
                return (
                  <button
                    key={i}
                    className={`text-left text-sm py-2 px-3 rounded-md transition-colors ${
                      isCurrent ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                    }`}
                    onClick={() => renditionRef.current?.display(item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex-1 w-full relative cursor-pointer" onClick={handleClick}>
        <div ref={viewerRef} className="absolute inset-0" />
      </div>

      <div className="w-full border-t border-border bg-background/95 backdrop-blur px-3 py-2 flex items-center gap-1.5 sm:gap-2">
        <Button variant="ghost" size="icon" onClick={prevChapter} disabled={toc.length === 0 || currentChapterIndex <= 0} className="h-8 w-8" title="Capítulo anterior (Shift+←)">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8" title="Página anterior (←)">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-[80px]">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {Math.round(percentage)}%
        </span>
        <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8" title="Próxima página (→)">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={nextChapter} disabled={toc.length === 0 || currentChapterIndex >= toc.length - 1} className="h-8 w-8" title="Próximo capítulo (Shift+→)">
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function applyTheme(rendition: Rendition, theme: string) {
  const dark = theme === 'dark';
  rendition.themes.override('color', dark ? '#e5e7eb' : '#0a0a0a');
  rendition.themes.override('background', dark ? '#0a0a0a' : '#ffffff');
}
