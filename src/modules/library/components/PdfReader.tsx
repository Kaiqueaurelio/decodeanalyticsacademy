import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings2,
  Sun,
  Moon,
  Coffee,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
// Use the worker file shipped with the installed pdfjs-dist (matches the version exactly)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfReaderProps {
  fileUrl: string;
  initialPage?: number;
  onProgress: (page: number, totalPages: number) => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';

const THEME_STYLES: Record<ReaderTheme, { bg: string; pageShadow: string; filter?: string }> = {
  light: { bg: '#f3f1ec', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.25)' },
  sepia: { bg: '#f4ecd8', pageShadow: '0 8px 30px -6px rgba(120,90,40,0.25)' },
  dark:  { bg: '#1a1a1a', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.6)', filter: 'invert(1) hue-rotate(180deg)' },
};

export function PdfReader({ fileUrl, initialPage = 1, onProgress }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(1);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [chromeVisible, setChromeVisible] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [containerWidth, setContainerWidth] = useState(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartT = useRef<number>(0);
  const hideTimer = useRef<number | null>(null);

  // Memoize file option to prevent react-pdf from reloading the document on every render
  const fileOption = useMemo(() => ({ url: fileUrl, withCredentials: false }), [fileUrl]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setContainerWidth(Math.min(w - 24, 920));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (numPages > 0) onProgress(page, numPages);
  }, [page, numPages, onProgress]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), 2800);
  }, []);

  useEffect(() => {
    scheduleHide();
    return () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); };
  }, [scheduleHide]);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const goTo = useCallback((target: number) => {
    if (!numPages) return;
    const next = Math.max(1, Math.min(numPages, target));
    setPage(next);
    showChrome();
  }, [numPages, showChrome]);

  const goNext = useCallback(() => goTo(page + 1), [goTo, page]);
  const goPrev = useCallback(() => goTo(page - 1), [goTo, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(1); }
      else if (e.key === 'End') { e.preventDefault(); goTo(numPages); }
      else if (e.key === '+' || e.key === '=') { setScale((s) => Math.min(2.5, s + 0.1)); }
      else if (e.key === '-' || e.key === '_') { setScale((s) => Math.max(0.5, s - 0.1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, goTo, numPages]);

  const submitPageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (!isNaN(n)) goTo(n);
    setPageInput('');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartT.current = Date.now();
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dt = Date.now() - touchStartT.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (dt < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // tap → toggle chrome
      setChromeVisible((v) => !v);
      if (!chromeVisible) scheduleHide();
      return;
    }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w * 0.28) goPrev();
    else if (x > w * 0.72) goNext();
    else setChromeVisible((v) => !v);
  };

  const themeStyle = THEME_STYLES[theme];
  const pct = numPages ? (page / numPages) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: themeStyle.bg, transition: 'background-color 200ms ease' }}
      onMouseMove={showChrome}
    >
      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-end gap-1.5 px-3 py-2 transition-all duration-300 ${
          chromeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.85), transparent)',
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
          title="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs tabular-nums w-10 text-center opacity-70">{Math.round(scale * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
          title="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="Configurações">
              <Settings2 className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader><SheetTitle>Configurações de leitura</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tema</p>
                <div className="grid grid-cols-3 gap-2">
                  <ThemeChip active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun className="h-4 w-4" />} label="Claro" />
                  <ThemeChip active={theme === 'sepia'} onClick={() => setTheme('sepia')} icon={<Coffee className="h-4 w-4" />} label="Sépia" />
                  <ThemeChip active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon className="h-4 w-4" />} label="Escuro" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zoom</p>
                  <span className="text-xs tabular-nums">{Math.round(scale * 100)}%</span>
                </div>
                <Slider value={[scale * 100]} min={50} max={250} step={10} onValueChange={(v) => setScale(v[0] / 100)} />
              </div>
              <div className="text-[11px] text-muted-foreground space-y-1 pt-2 border-t border-border">
                <p>Atalhos:</p>
                <p>← → ou Espaço — virar página</p>
                <p>+ / −  — zoom</p>
                <p>Home / End — primeira / última página</p>
                <p>Toque no centro — mostrar/ocultar controles</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Page area */}
      <div
        className="absolute inset-0 overflow-auto flex items-start justify-center py-10 px-3 select-none cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={page}
          className="rounded-sm overflow-hidden"
          style={{
            boxShadow: themeStyle.pageShadow,
            filter: themeStyle.filter,
            animation: 'pdf-page-in 280ms ease-out',
            backgroundColor: '#ffffff',
          }}
        >
          <Document
            file={fileOption}
            onLoadSuccess={({ numPages: n }) => { setNumPages(n); setLoadError(null); }}
            onLoadError={(err) => { setLoadError(err?.message || 'Falha ao carregar o PDF.'); }}
            loading={
              <div className="flex flex-col items-center justify-center gap-3 p-16 min-w-[260px] min-h-[360px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Carregando livro…</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center gap-3 p-10 min-w-[260px] min-h-[360px] text-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-sm font-medium">Não foi possível abrir o PDF</p>
                <p className="text-xs text-muted-foreground max-w-xs">{loadError || 'Verifique sua conexão ou tente novamente.'}</p>
              </div>
            }
          >
            <Page
              pageNumber={page}
              width={containerWidth}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={
                <div className="flex items-center justify-center" style={{ width: containerWidth, height: containerWidth * 1.4 }}>
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Side tap hints — desktop only, very subtle */}
      <button
        aria-label="Página anterior"
        onClick={goPrev}
        className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full transition-opacity ${
          chromeVisible ? 'opacity-80' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Próxima página"
        onClick={goNext}
        className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full transition-opacity ${
          chromeVisible ? 'opacity-80' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
        disabled={page >= numPages}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Bottom scrubber */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 px-4 pt-6 pb-3 transition-all duration-300 ${
          chromeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)'
            : 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)',
        }}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <Slider
            value={[page]}
            min={1}
            max={Math.max(1, numPages)}
            step={1}
            onValueChange={(v) => goTo(v[0])}
          />
          <div className="flex items-center justify-between text-[11px] tabular-nums" style={{ color: theme === 'dark' ? '#d4d4d4' : '#525252' }}>
            <form onSubmit={submitPageInput} className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={numPages || undefined}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder={String(page)}
                className="h-6 w-14 text-[11px] px-2 tabular-nums bg-background/60 border-border/50"
                aria-label="Ir para página"
              />
              <span>de {numPages || '—'}</span>
            </form>
            <span>{Math.round(pct)}% lido</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pdf-page-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ThemeChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-xs transition-all ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
