// PlayBooks Reader — unified PDF + EPUB reading engine, Google Play Books-like.
// Implements: pagination/scroll modes, themes (light/sepia/dark), font controls,
// margins/justify/line-height (EPUB), tap-center toggle UI, swipe nav, long-press
// selection menu (highlight/note/copy/share), bookmark engine, search, dictionary tap.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ePub, { type Book as EpubBook, type Rendition } from 'epubjs';
// Use the worker shipped with the exact pdfjs version react-pdf uses.
// Loading via new URL(...import.meta.url) keeps API and Worker versions in sync,
// preventing "API version X does not match Worker version Y" errors after deps update.
const pdfWorker = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Bookmark, BookmarkCheck, List, Search, Type,
  Sun, Moon, Coffee, Highlighter, StickyNote, Copy, Share2, Loader2, X, Minus, Plus,
  AlignLeft, AlignJustify, ScrollText, BookOpen as BookOpenIcon, Maximize2, BookMarked,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { pbCache } from '../storage';
import { addBookmark, addHighlight, deleteBookmark, deleteHighlight, fetchBookmarks, fetchHighlights, fetchNotes, addNote, saveProgress } from '../api';
import type { PBBook, PBBookmark, PBHighlight, PBNote, HighlightColor } from '../types';
import { HIGHLIGHT_COLORS } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type Theme = 'light' | 'sepia' | 'dark';
type Mode = 'paged' | 'scroll';
type FontFamily = 'serif' | 'sans' | 'mono';

const THEME: Record<Theme, { bg: string; fg: string; pageShadow: string; pdfFilter?: string }> = {
  light: { bg: '#f3f1ec', fg: '#1a1a1a', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.25)' },
  sepia: { bg: '#f4ecd8', fg: '#3a2f1b', pageShadow: '0 8px 30px -6px rgba(120,90,40,0.25)' },
  dark:  { bg: '#1a1a1a', fg: '#e5e7eb', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.6)', pdfFilter: 'invert(1) hue-rotate(180deg)' },
};

interface Props {
  book: PBBook;
  initialPage?: number;
  initialLocation?: string | null;
  onBack: () => void;
}

export function PlayBooksReader({ book, initialPage = 1, initialLocation, onBack }: Props) {
  const { user } = useAuth();
  const userId = user?.id || '';

  const prefs = pbCache.getPrefs() as any;
  const [theme, setTheme] = useState<Theme>(prefs.theme || 'light');
  const [mode, setMode] = useState<Mode>(prefs.mode || 'paged');
  const [fontFamily, setFontFamily] = useState<FontFamily>(prefs.fontFamily || 'serif');
  const [fontSize, setFontSize] = useState<number>(prefs.fontSize || 110);
  const [lineHeight, setLineHeight] = useState<number>(prefs.lineHeight || 1.6);
  const [margin, setMargin] = useState<number>(prefs.margin || 24);
  const [justify, setJustify] = useState<boolean>(prefs.justify ?? true);

  const [chrome, setChrome] = useState(true);
  const [bookmarks, setBookmarks] = useState<PBBookmark[]>([]);
  const [highlights, setHighlights] = useState<PBHighlight[]>([]);
  const [notes, setNotes] = useState<PBNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ page?: number; cfi?: string; snippet: string }>>([]);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string; pdfPage?: number; cfi?: string } | null>(null);
  const [dictWord, setDictWord] = useState<string | null>(null);

  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    pbCache.setPrefs({ theme, mode, fontFamily, fontSize, lineHeight, margin, justify });
  }, [theme, mode, fontFamily, fontSize, lineHeight, margin, justify]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [bms, hls, nts] = await Promise.all([
        fetchBookmarks(userId, book.id),
        fetchHighlights(userId, book.id),
        fetchNotes(userId, book.id),
      ]);
      setBookmarks(bms);
      setHighlights(hls);
      setNotes(nts);
    })();
  }, [userId, book.id]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChrome(false), 3200);
  }, []);
  useEffect(() => { scheduleHide(); return () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }; }, [scheduleHide]);
  const showChrome = useCallback(() => { setChrome(true); scheduleHide(); }, [scheduleHide]);

  const themeStyle = THEME[theme];

  const handleHighlight = useCallback(async (color: HighlightColor) => {
    if (!selectionMenu || !userId) return;
    const newH = await addHighlight({
      user_id: userId, book_id: book.id, text: selectionMenu.text, color,
      start_location: selectionMenu.cfi || null, end_location: selectionMenu.cfi || null,
      page: selectionMenu.pdfPage ?? null,
    });
    if (newH) setHighlights((p) => [newH, ...p]);
    setSelectionMenu(null);
    toast.success('Trecho destacado');
  }, [selectionMenu, userId, book.id]);

  const handleNote = useCallback(async () => {
    if (!selectionMenu || !userId) return;
    const content = window.prompt('Adicionar nota ao trecho:', selectionMenu.text.slice(0, 80));
    if (!content) return;
    const h = await addHighlight({
      user_id: userId, book_id: book.id, text: selectionMenu.text, color: 'yellow',
      start_location: selectionMenu.cfi || null, end_location: selectionMenu.cfi || null,
      page: selectionMenu.pdfPage ?? null,
    });
    const n = await addNote({
      user_id: userId, book_id: book.id, highlight_id: h?.id || null, content, page: selectionMenu.pdfPage ?? null,
    } as any);
    if (h) setHighlights((p) => [h, ...p]);
    if (n) setNotes((p) => [n, ...p]);
    setSelectionMenu(null);
    toast.success('Nota salva');
  }, [selectionMenu, userId, book.id]);

  const handleCopy = useCallback(() => {
    if (!selectionMenu) return;
    void navigator.clipboard.writeText(selectionMenu.text);
    setSelectionMenu(null);
    toast.success('Copiado');
  }, [selectionMenu]);

  const handleShare = useCallback(async () => {
    if (!selectionMenu) return;
    try {
      if (navigator.share) await navigator.share({ text: selectionMenu.text, title: book.title });
      else { await navigator.clipboard.writeText(selectionMenu.text); toast.success('Copiado'); }
    } catch { /* noop */ }
    setSelectionMenu(null);
  }, [selectionMenu, book.title]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: themeStyle.bg, color: themeStyle.fg, height: '100dvh' }}
      onMouseMove={showChrome}
    >
      <header
        className={`absolute top-0 inset-x-0 z-40 flex items-center justify-between gap-2 px-3 transition-all duration-300 ${
          chrome ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(48px + env(safe-area-inset-top))',
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.92), transparent)',
        }}
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="h-9 rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Biblioteca</span>
        </Button>
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className="text-sm font-medium truncate">{book.title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <SearchSheet query={searchQuery} setQuery={setSearchQuery} results={searchResults} onPickResult={(r) => {}} />
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {book.format === 'pdf' ? (
          <PdfEngine
            book={book}
            theme={theme}
            mode={mode}
            margin={margin}
            initialPage={initialPage}
            chrome={chrome}
            setChrome={setChrome}
            onProgress={(page, total) => {
              if (!userId) return;
              void saveProgress(userId, book.id, 'pdf', { current_page: page, progress_percentage: (page / total) * 100 });
            }}
            onSelection={(s) => setSelectionMenu(s)}
            onWordTap={(w) => setDictWord(w)}
            onSearchResults={setSearchResults}
            searchQuery={searchQuery}
            highlights={highlights}
            bookmarks={bookmarks}
            onAddBookmark={async (page) => {
              const b = await addBookmark({ user_id: userId, book_id: book.id, location: null, page, label: `Página ${page}` });
              if (b) { setBookmarks((p) => [b, ...p]); toast.success('Marcador adicionado'); }
            }}
            onRemoveBookmark={async (id) => { await deleteBookmark(id); setBookmarks((p) => p.filter((x) => x.id !== id)); }}
          />
        ) : (
          <EpubEngine
            book={book}
            theme={theme}
            mode={mode}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineHeight={lineHeight}
            margin={margin}
            justify={justify}
            initialLocation={initialLocation}
            chrome={chrome}
            setChrome={setChrome}
            onProgress={(loc, pct) => {
              if (!userId) return;
              void saveProgress(userId, book.id, 'epub', { location: loc, progress_percentage: pct });
            }}
            onSelection={(s) => setSelectionMenu(s)}
            onWordTap={(w) => setDictWord(w)}
            onSearchResults={setSearchResults}
            searchQuery={searchQuery}
            bookmarks={bookmarks}
            onAddBookmark={async (loc, label) => {
              const b = await addBookmark({ user_id: userId, book_id: book.id, location: loc, page: null, label });
              if (b) { setBookmarks((p) => [b, ...p]); toast.success('Marcador adicionado'); }
            }}
            onRemoveBookmark={async (id) => { await deleteBookmark(id); setBookmarks((p) => p.filter((x) => x.id !== id)); }}
          />
        )}

        {selectionMenu && (() => {
          const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
          // Clamp para nunca sair da viewport (bubble ~ 280px de largura)
          const clampedX = Math.min(Math.max(selectionMenu.x, 150), vw - 24);
          return (
            <div
              className="absolute z-50 -translate-x-1/2 -translate-y-full"
              style={{ left: clampedX, top: Math.max(48, selectionMenu.y - 8) }}
            >
              <div className="bg-foreground text-background rounded-full shadow-2xl flex items-center gap-0.5 p-1 animate-in fade-in zoom-in-95 max-w-[calc(100vw-24px)] flex-wrap justify-center">
                {(['yellow', 'blue', 'green', 'pink', 'purple'] as HighlightColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => handleHighlight(c)}
                    className="h-7 w-7 rounded-full border-2 border-background/40 hover:scale-110 transition-transform shrink-0"
                    style={{ background: HIGHLIGHT_COLORS[c] }}
                    title={`Destacar ${c}`}
                  />
                ))}
                <div className="w-px h-5 bg-background/30 mx-1" />
                <button onClick={handleNote} className="h-7 w-7 rounded-full hover:bg-background/15 flex items-center justify-center shrink-0" title="Nota"><StickyNote className="h-3.5 w-3.5" /></button>
                <button onClick={handleCopy} className="h-7 w-7 rounded-full hover:bg-background/15 flex items-center justify-center shrink-0" title="Copiar"><Copy className="h-3.5 w-3.5" /></button>
                <button onClick={handleShare} className="h-7 w-7 rounded-full hover:bg-background/15 flex items-center justify-center shrink-0" title="Compartilhar"><Share2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => setSelectionMenu(null)} className="h-7 w-7 rounded-full hover:bg-background/15 flex items-center justify-center shrink-0" title="Fechar"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })()}

        {dictWord && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-background border border-border rounded-2xl shadow-2xl p-4 max-w-sm w-[90%]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{dictWord}</p>
              <button onClick={() => setDictWord(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Pesquisar definição online:</p>
            <div className="flex gap-2">
              <a target="_blank" rel="noopener noreferrer" href={`https://www.google.com/search?q=define+${encodeURIComponent(dictWord)}`}
                 className="flex-1 text-center text-xs bg-primary text-primary-foreground rounded-md py-2 hover:opacity-90">Google</a>
              <a target="_blank" rel="noopener noreferrer" href={`https://en.wiktionary.org/wiki/${encodeURIComponent(dictWord)}`}
                 className="flex-1 text-center text-xs bg-secondary text-secondary-foreground rounded-md py-2 hover:opacity-90">Wikcionário</a>
            </div>
          </div>
        )}
      </div>

      <footer
        className={`absolute bottom-0 inset-x-0 z-40 flex items-center justify-around gap-1 px-3 transition-all duration-300 ${
          chrome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(56px + env(safe-area-inset-bottom))',
          background: theme === 'dark'
            ? 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'
            : 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)',
        }}
      >
        <TypographySheet
          theme={theme} setTheme={setTheme}
          mode={mode} setMode={setMode}
          fontFamily={fontFamily} setFontFamily={setFontFamily}
          fontSize={fontSize} setFontSize={setFontSize}
          lineHeight={lineHeight} setLineHeight={setLineHeight}
          margin={margin} setMargin={setMargin}
          justify={justify} setJustify={setJustify}
          isEpub={book.format === 'epub'}
        />
        <BookmarksSheet bookmarks={bookmarks} onJump={() => {}} />
        <HighlightsSheet highlights={highlights} notes={notes} onDeleteHighlight={async (id) => { await deleteHighlight(id); setHighlights((p) => p.filter((x) => x.id !== id)); }} />
      </footer>
    </div>
  );
}

function PdfEngine(props: {
  book: PBBook; theme: Theme; mode: Mode; margin: number;
  initialPage: number; chrome: boolean; setChrome: (v: boolean) => void;
  onProgress: (page: number, total: number) => void;
  onSelection: (s: { x: number; y: number; text: string; pdfPage?: number } | null) => void;
  onWordTap: (w: string) => void;
  onSearchResults: (r: Array<{ page?: number; snippet: string }>) => void;
  searchQuery: string;
  highlights: PBHighlight[]; bookmarks: PBBookmark[];
  onAddBookmark: (page: number) => void;
  onRemoveBookmark: (id: string) => void;
}) {
  const { book, theme, mode, margin, initialPage, chrome, setChrome, onProgress, onSelection, onSearchResults, searchQuery } = props;
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(800);
  const [pageAspect, setPageAspect] = useState(1.4);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const scrollPageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const programmatic = useRef(false);

  const fileOption = useMemo(() => ({ url: book.fileUrl, withCredentials: false }), [book.fileUrl]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pageWidth = useMemo(() => {
    const baseW = Math.max(280, containerWidth - margin * 2);
    const verticalChrome = mode === 'paged' ? 120 : margin * 2;
    const availableH = Math.max(360, containerHeight - verticalChrome);
    const widthFromHeight = availableH / pageAspect;
    return Math.min(baseW, widthFromHeight, 1100);
  }, [containerWidth, containerHeight, pageAspect, margin, mode]);

  useEffect(() => { if (numPages > 0) onProgress(page, numPages); }, [page, numPages, onProgress]);

  useEffect(() => {
    if (mode !== 'scroll') return;
    const el = scrollPageRefs.current.get(page);
    if (!el) return;
    programmatic.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => { programmatic.current = false; }, 700);
  }, [page, mode]);

  useEffect(() => {
    if (mode !== 'scroll' || !scrollerRef.current || numPages === 0) return;
    const obs = new IntersectionObserver((entries) => {
      if (programmatic.current) return;
      let best = page; let bestR = 0;
      for (const e of entries) {
        if (e.intersectionRatio > bestR) {
          bestR = e.intersectionRatio;
          const p = Number((e.target as HTMLElement).dataset.page);
          if (p) best = p;
        }
      }
      if (bestR > 0.4 && best !== page) setPage(best);
    }, { root: scrollerRef.current, threshold: [0.25, 0.5, 0.75] });
    scrollPageRefs.current.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [mode, numPages]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setPage((p) => Math.min(numPages, p + 1)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [numPages]);

  const handleMouseUp = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length < 2) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    onSelection({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top,
      text,
      pdfPage: page,
    });
  };

  const handleClickPage = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.28) setPage((p) => Math.max(1, p - 1));
    else if (x > rect.width * 0.72) setPage((p) => Math.min(numPages, p + 1));
    else setChrome(!chrome);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;
    touchStart.current = null;
    if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      setChrome(!chrome);
      return;
    }
    if (mode === 'paged' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) setPage((p) => Math.min(numPages, p + 1));
      else setPage((p) => Math.max(1, p - 1));
    }
  };

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { onSearchResults([]); return; }
    const results: Array<{ page?: number; snippet: string }> = [];
    const q = searchQuery.toLowerCase();
    document.querySelectorAll('.react-pdf__Page').forEach((pageEl) => {
      const p = Number((pageEl as HTMLElement).dataset.pageNumber);
      const t = pageEl.textContent || '';
      const idx = t.toLowerCase().indexOf(q);
      if (idx >= 0) {
        results.push({ page: p, snippet: '…' + t.slice(Math.max(0, idx - 30), idx + 60) + '…' });
      }
    });
    onSearchResults(results);
  }, [searchQuery, page, onSearchResults]);

  const isCurrentBookmarked = props.bookmarks.some((b) => b.page === page);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <button
        onClick={() => {
          if (isCurrentBookmarked) {
            const b = props.bookmarks.find((x) => x.page === page);
            if (b) props.onRemoveBookmark(b.id);
          } else props.onAddBookmark(page);
        }}
        className={`absolute right-3 z-30 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
          chrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: 'calc(56px + env(safe-area-inset-top))', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
        title={isCurrentBookmarked ? 'Remover marcador' : 'Adicionar marcador'}
      >
        {isCurrentBookmarked
          ? <BookmarkCheck className="h-4 w-4" style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }} />
          : <Bookmark className="h-4 w-4" />}
      </button>

      <div
        ref={scrollerRef}
        className={`w-full h-full ${mode === 'scroll' ? 'overflow-y-auto' : 'overflow-hidden flex items-center justify-center'}`}
        style={{ padding: mode === 'scroll' ? margin : 0 }}
        onClick={mode === 'paged' ? handleClickPage : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMouseUp}
      >
        <Document
          file={fileOption}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(e) => setError(e?.message || 'Erro ao carregar PDF')}
          loading={<div className="flex flex-col items-center gap-3 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin" /><p className="text-sm">Carregando livro…</p></div>}
          error={<div className="text-sm text-destructive">{error || 'Não foi possível abrir este PDF.'}</div>}
        >
          {mode === 'paged' ? (
            <div style={{ filter: THEME[theme].pdfFilter, boxShadow: THEME[theme].pageShadow, background: '#fff' }}>
              <Page
                pageNumber={page}
                width={pageWidth}
                renderAnnotationLayer
                renderTextLayer
                onLoadSuccess={({ height, width }) => setPageAspect(height / width)}
              />
            </div>
          ) : (
            Array.from({ length: numPages }, (_, i) => i + 1).map((pn) => (
              <div
                key={pn}
                ref={(el) => { if (el) scrollPageRefs.current.set(pn, el); else scrollPageRefs.current.delete(pn); }}
                data-page={pn}
                className="mx-auto mb-4"
                style={{ filter: THEME[theme].pdfFilter, boxShadow: THEME[theme].pageShadow, background: '#fff', width: pageWidth }}
              >
                <Page
                  pageNumber={pn}
                  width={pageWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer
                  onLoadSuccess={pn === 1 ? ({ height, width }) => setPageAspect(height / width) : undefined}
                />
              </div>
            ))
          )}
        </Document>
      </div>

      {numPages > 0 && (
        <div
          className={`absolute inset-x-3 z-30 transition-opacity ${chrome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-background/90 backdrop-blur rounded-full px-3 py-2 flex items-center gap-2 border border-border/40 shadow-lg">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(Math.max(1, page - 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Slider
              value={[page]}
              min={1}
              max={numPages}
              step={1}
              onValueChange={(v) => setPage(v[0])}
              className="flex-1"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(Math.min(numPages, page + 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
            <span className="text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">{page}/{numPages}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EpubEngine(props: {
  book: PBBook; theme: Theme; mode: Mode;
  fontFamily: FontFamily; fontSize: number; lineHeight: number; margin: number; justify: boolean;
  initialLocation?: string | null; chrome: boolean; setChrome: (v: boolean) => void;
  onProgress: (loc: string, pct: number) => void;
  onSelection: (s: { x: number; y: number; text: string; cfi?: string } | null) => void;
  onWordTap: (w: string) => void;
  onSearchResults: (r: Array<{ cfi?: string; snippet: string }>) => void;
  searchQuery: string;
  bookmarks: PBBookmark[];
  onAddBookmark: (loc: string, label: string) => void;
  onRemoveBookmark: (id: string) => void;
}) {
  const { book, theme, mode, fontFamily, fontSize, lineHeight, margin, justify, initialLocation, chrome, setChrome, onProgress, onSelection, onSearchResults, searchQuery } = props;
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [pct, setPct] = useState(0);
  const [toc, setToc] = useState<Array<{ label: string; href: string }>>([]);
  const [currentLoc, setCurrentLoc] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;
    const b = ePub(book.fileUrl);
    bookRef.current = b;
    const r = b.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: mode === 'scroll' ? 'scrolled-doc' : 'paginated',
      spread: 'auto',
    });
    renditionRef.current = r;
    applyEpubTheme(r, theme, fontFamily, fontSize, lineHeight, margin, justify);
    r.display(initialLocation || undefined);

    b.ready.then(() => b.locations.generate(1024)).then(() => {
      r.on('relocated', (loc: any) => {
        const cfi = loc.start.cfi;
        const p = b.locations.percentageFromCfi(cfi);
        setPct(p * 100);
        setCurrentLoc(cfi);
        onProgress(cfi, p * 100);
      });
    });

    b.loaded.navigation.then((nav: any) => {
      const flat: Array<{ label: string; href: string }> = [];
      const walk = (items: any[]) => items.forEach((it) => {
        flat.push({ label: it.label.trim(), href: it.href });
        if (it.subitems?.length) walk(it.subitems);
      });
      walk(nav.toc);
      setToc(flat);
    });

    r.on('selected', (cfiRange: string, contents: any) => {
      const text = contents.window.getSelection().toString().trim();
      if (!text) return;
      const range = contents.range(cfiRange);
      const rect = range.getBoundingClientRect();
      const iframeEl = contents.document.defaultView.frameElement as HTMLIFrameElement;
      const iRect = iframeEl?.getBoundingClientRect();
      onSelection({
        x: (iRect?.left || 0) + rect.left + rect.width / 2,
        y: (iRect?.top || 0) + rect.top,
        text,
        cfi: cfiRange,
      });
    });

    r.on('click', () => setChrome(!chrome));

    return () => { r.destroy(); b.destroy(); };
  }, [book.fileUrl, mode]);

  useEffect(() => {
    if (renditionRef.current) applyEpubTheme(renditionRef.current, theme, fontFamily, fontSize, lineHeight, margin, justify);
  }, [theme, fontFamily, fontSize, lineHeight, margin, justify]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !bookRef.current) { onSearchResults([]); return; }
    let cancel = false;
    (async () => {
      const b = bookRef.current!;
      const results: Array<{ cfi?: string; snippet: string }> = [];
      const spine: any = b.spine;
      const items: any[] = (spine?.spineItems || []).slice(0, 20);
      for (const item of items) {
        if (cancel) return;
        try {
          await item.load(b.load.bind(b));
          const found: any[] = item.find(searchQuery) || [];
          found.slice(0, 5).forEach((f) => results.push({ cfi: f.cfi, snippet: f.excerpt }));
          item.unload();
        } catch { /* noop */ }
        if (results.length > 30) break;
      }
      if (!cancel) onSearchResults(results);
    })();
    return () => { cancel = true; };
  }, [searchQuery, onSearchResults]);

  const isCurrentBookmarked = currentLoc ? props.bookmarks.some((b) => b.location === currentLoc) : false;

  return (
    <div className="relative w-full h-full">
      <button
        onClick={() => {
          if (!currentLoc) return;
          if (isCurrentBookmarked) {
            const b = props.bookmarks.find((x) => x.location === currentLoc);
            if (b) props.onRemoveBookmark(b.id);
          } else props.onAddBookmark(currentLoc, `Capítulo ~ ${Math.round(pct)}%`);
        }}
        className={`absolute right-3 z-30 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
          chrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: 'calc(56px + env(safe-area-inset-top))', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
      >
        {isCurrentBookmarked
          ? <BookmarkCheck className="h-4 w-4" style={{ color: theme === 'dark' ? '#fbbf24' : '#d97706' }} />
          : <Bookmark className="h-4 w-4" />}
      </button>

      <div ref={viewerRef} className="w-full h-full" style={{ paddingTop: 12 }} />

      <div className={`absolute inset-x-3 z-30 transition-opacity ${chrome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-background/90 backdrop-blur rounded-full px-3 py-2 flex items-center gap-2 border border-border/40 shadow-lg">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => renditionRef.current?.prev()}><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => renditionRef.current?.next()}><ChevronRight className="h-3.5 w-3.5" /></Button>
          <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <button
            className={`absolute right-[60px] z-30 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              chrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ top: 'calc(56px + env(safe-area-inset-top))', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
            title="Sumário"
          >
            <List className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 overflow-y-auto">
          <SheetHeader><SheetTitle>Sumário</SheetTitle></SheetHeader>
          <div className="mt-4 flex flex-col gap-1">
            {toc.map((it, i) => (
              <button
                key={i}
                onClick={() => renditionRef.current?.display(it.href)}
                className="text-left text-sm py-2 px-3 rounded-md hover:bg-accent"
              >
                {it.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function applyEpubTheme(r: Rendition, theme: Theme, fam: FontFamily, size: number, lh: number, mg: number, justify: boolean) {
  const t = THEME[theme];
  const family = fam === 'serif' ? 'Georgia, "Times New Roman", serif'
              : fam === 'mono'  ? 'ui-monospace, SFMono-Regular, monospace'
              :                    'system-ui, -apple-system, "Segoe UI", sans-serif';
  r.themes.override('color', t.fg);
  r.themes.override('background', t.bg);
  r.themes.override('font-family', family);
  r.themes.override('line-height', String(lh));
  r.themes.override('text-align', justify ? 'justify' : 'left');
  r.themes.override('padding-left', `${mg}px`);
  r.themes.override('padding-right', `${mg}px`);
  r.themes.fontSize(`${size}%`);
}

function TypographySheet(props: {
  theme: Theme; setTheme: (t: Theme) => void;
  mode: Mode; setMode: (m: Mode) => void;
  fontFamily: FontFamily; setFontFamily: (f: FontFamily) => void;
  fontSize: number; setFontSize: (n: number) => void;
  lineHeight: number; setLineHeight: (n: number) => void;
  margin: number; setMargin: (n: number) => void;
  justify: boolean; setJustify: (v: boolean) => void;
  isEpub: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex-col h-auto py-1 gap-0.5"><Type className="h-4 w-4" /><span className="text-[10px]">Aa</span></Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Tipografia & Leitura</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-5">
          <Section title="Tema">
            <div className="grid grid-cols-3 gap-2">
              <Chip active={props.theme === 'light'} onClick={() => props.setTheme('light')} icon={<Sun className="h-4 w-4" />} label="Claro" />
              <Chip active={props.theme === 'sepia'} onClick={() => props.setTheme('sepia')} icon={<Coffee className="h-4 w-4" />} label="Sépia" />
              <Chip active={props.theme === 'dark'} onClick={() => props.setTheme('dark')} icon={<Moon className="h-4 w-4" />} label="Escuro" />
            </div>
          </Section>
          <Section title="Modo">
            <div className="grid grid-cols-2 gap-2">
              <Chip active={props.mode === 'paged'} onClick={() => props.setMode('paged')} icon={<BookOpenIcon className="h-4 w-4" />} label="Página" />
              <Chip active={props.mode === 'scroll'} onClick={() => props.setMode('scroll')} icon={<ScrollText className="h-4 w-4" />} label="Rolagem" />
            </div>
          </Section>
          {props.isEpub && (
            <>
              <Section title="Fonte">
                <div className="grid grid-cols-3 gap-2">
                  <Chip active={props.fontFamily === 'serif'} onClick={() => props.setFontFamily('serif')} label="Serif" />
                  <Chip active={props.fontFamily === 'sans'} onClick={() => props.setFontFamily('sans')} label="Sans" />
                  <Chip active={props.fontFamily === 'mono'} onClick={() => props.setFontFamily('mono')} label="Mono" />
                </div>
              </Section>
              <Section title={`Tamanho (${props.fontSize}%)`}>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => props.setFontSize(Math.max(70, props.fontSize - 10))}><Minus className="h-3 w-3" /></Button>
                  <Slider value={[props.fontSize]} min={70} max={200} step={10} onValueChange={(v) => props.setFontSize(v[0])} />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => props.setFontSize(Math.min(200, props.fontSize + 10))}><Plus className="h-3 w-3" /></Button>
                </div>
              </Section>
              <Section title={`Espaçamento (${props.lineHeight.toFixed(1)})`}>
                <Slider value={[props.lineHeight * 10]} min={12} max={24} step={1} onValueChange={(v) => props.setLineHeight(v[0] / 10)} />
              </Section>
              <Section title="Alinhamento">
                <div className="grid grid-cols-2 gap-2">
                  <Chip active={!props.justify} onClick={() => props.setJustify(false)} icon={<AlignLeft className="h-4 w-4" />} label="Esquerda" />
                  <Chip active={props.justify} onClick={() => props.setJustify(true)} icon={<AlignJustify className="h-4 w-4" />} label="Justificado" />
                </div>
              </Section>
            </>
          )}
          <Section title={`Margem (${props.margin}px)`}>
            <Slider value={[props.margin]} min={4} max={64} step={4} onValueChange={(v) => props.setMargin(v[0])} />
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BookmarksSheet({ bookmarks, onJump }: { bookmarks: PBBookmark[]; onJump: (b: PBBookmark) => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex-col h-auto py-1 gap-0.5 relative">
          <BookMarked className="h-4 w-4" />
          <span className="text-[10px]">Marcadores</span>
          {bookmarks.length > 0 && <span className="absolute top-0 right-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Marcadores ({bookmarks.length})</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-2">
          {bookmarks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum marcador ainda. Toque no ícone de marcador no topo enquanto lê.</p>}
          {bookmarks.map((b) => (
            <button key={b.id} onClick={() => onJump(b)} className="w-full text-left p-3 rounded-lg border border-border/60 hover:bg-accent transition-colors">
              <p className="text-sm font-medium">{b.label || (b.page ? `Página ${b.page}` : 'Marcador')}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(b.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HighlightsSheet({ highlights, notes, onDeleteHighlight }: { highlights: PBHighlight[]; notes: PBNote[]; onDeleteHighlight: (id: string) => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex-col h-auto py-1 gap-0.5 relative">
          <Highlighter className="h-4 w-4" />
          <span className="text-[10px]">Destaques</span>
          {(highlights.length + notes.length) > 0 && <span className="absolute top-0 right-1 h-1.5 w-1.5 rounded-full bg-primary" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Destaques & Notas ({highlights.length})</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-2">
          {highlights.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum destaque ainda. Selecione um trecho do livro para começar.</p>}
          {highlights.map((h) => {
            const noteForH = notes.find((n) => n.highlight_id === h.id);
            return (
              <div key={h.id} className="p-3 rounded-lg border border-border/60">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-3 w-3 rounded-full flex-shrink-0" style={{ background: HIGHLIGHT_COLORS[h.color] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ background: `${HIGHLIGHT_COLORS[h.color]}66`, padding: '2px 4px', borderRadius: 4 }}>{h.text}</p>
                    {noteForH && <p className="mt-2 text-xs text-muted-foreground italic">📝 {noteForH.content}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {h.page ? `Página ${h.page} · ` : ''}{new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => onDeleteHighlight(h.id)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-3 w-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SearchSheet({ query, setQuery, results, onPickResult }: {
  query: string; setQuery: (s: string) => void;
  results: Array<{ page?: number; cfi?: string; snippet: string }>;
  onPickResult: (r: any) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Search className="h-4 w-4" /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader><SheetTitle>Buscar no livro</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite uma palavra ou frase…" autoFocus />
          <p className="text-[11px] text-muted-foreground">{results.length} resultado(s)</p>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={() => onPickResult(r)} className="w-full text-left p-2 rounded-md hover:bg-accent text-xs">
                {r.page && <span className="font-medium text-primary">Pág. {r.page} · </span>}
                <span className="text-muted-foreground">{r.snippet}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}
function Chip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      {icon}{label}
    </button>
  );
}
