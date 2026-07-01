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
  RefreshCw,
  WifiOff,
  Lock,
  Clock,
  ScrollText,
  BookOpen,
  Maximize2,
} from 'lucide-react';
// Resolve worker URL via import.meta to keep it in sync with whichever pdfjs-dist
// version is hoisted by react-pdf — avoids API/Worker version mismatch errors.
const pdfWorker = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfReaderProps {
  fileUrl: string;
  initialPage?: number;
  onProgress: (page: number, totalPages: number) => void;
  onRequestReload?: () => void; // optional: ask parent to refetch a fresh signed URL
}

type ErrorKind = 'cors' | 'auth' | 'expired' | 'notfound' | 'network' | 'corrupt' | 'unknown';

interface DiagnosedError {
  kind: ErrorKind;
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
}

function diagnosePdfError(err: unknown, fileUrl: string): DiagnosedError {
  const raw = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  const name = (err as any)?.name?.toLowerCase?.() || '';
  const status = (err as any)?.status as number | undefined;

  // Signed URL expirada (Supabase storage retorna parametros ?token= e ?expires=)
  const looksSigned = /[?&](token|expires|x-amz-signature|signature)=/i.test(fileUrl);
  if (status === 403 || raw.includes('forbidden') || raw.includes('expired') || (looksSigned && (raw.includes('400') || raw.includes('unauthorized')))) {
    return {
      kind: 'expired',
      title: 'Link do livro expirou',
      description: 'A URL assinada deste arquivo não é mais válida ou expirou.',
      hint: 'Clique em "Recarregar livro" para gerar um novo link de acesso.',
      icon: <Clock className="h-6 w-6 text-amber-500" />,
    };
  }
  if (status === 401 || raw.includes('401') || raw.includes('unauthorized')) {
    return {
      kind: 'auth',
      title: 'Sem autorização para abrir o arquivo',
      description: 'Você não tem permissão para acessar este PDF, ou sua sessão expirou.',
      hint: 'Faça login novamente e tente recarregar.',
      icon: <Lock className="h-6 w-6 text-destructive" />,
    };
  }
  if (status === 404 || raw.includes('404') || raw.includes('not found') || raw.includes('missingpdf')) {
    return {
      kind: 'notfound',
      title: 'Arquivo não encontrado',
      description: 'O PDF não está mais disponível no servidor.',
      hint: 'Avise o administrador para republicar o livro.',
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    };
  }
  if (raw.includes('cors') || raw.includes('cross-origin') || raw.includes('cross origin')) {
    return {
      kind: 'cors',
      title: 'Bloqueio de origem (CORS)',
      description: 'O servidor do PDF não permite acesso a partir deste domínio.',
      hint: 'Recarregue para tentar com uma URL assinada. Se persistir, contate o admin.',
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    };
  }
  if (name.includes('invalidpdf') || raw.includes('invalid pdf') || raw.includes('corrupt')) {
    return {
      kind: 'corrupt',
      title: 'Arquivo PDF inválido',
      description: 'O arquivo está corrompido ou não é um PDF válido.',
      hint: 'Solicite ao administrador que reenvie o livro.',
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    };
  }
  if (raw.includes('failed to fetch') || raw.includes('networkerror') || raw.includes('load failed') || raw.includes('network')) {
    return {
      kind: 'network',
      title: 'Sem conexão com o servidor',
      description: 'Não foi possível baixar o PDF. Verifique sua conexão com a internet.',
      hint: 'Tente novamente em alguns segundos.',
      icon: <WifiOff className="h-6 w-6 text-amber-500" />,
    };
  }
  return {
    kind: 'unknown',
    title: 'Não foi possível abrir o PDF',
    description: raw || 'Ocorreu um erro inesperado ao carregar o arquivo.',
    hint: 'Tente recarregar. Se o problema persistir, contate o administrador.',
    icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
  };
}

type ReaderTheme = 'light' | 'sepia' | 'dark';

const THEME_STYLES: Record<ReaderTheme, { bg: string; pageShadow: string; filter?: string }> = {
  light: { bg: '#f3f1ec', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.25)' },
  sepia: { bg: '#f4ecd8', pageShadow: '0 8px 30px -6px rgba(120,90,40,0.25)' },
  dark:  { bg: '#1a1a1a', pageShadow: '0 8px 30px -6px rgba(0,0,0,0.6)', filter: 'invert(1) hue-rotate(180deg)' },
};

type ViewMode = 'paged' | 'scroll';
type FitMode = 'manual' | 'width' | 'page';
type Margin = 'tight' | 'cozy' | 'wide';

const MARGIN_PX: Record<Margin, { x: number; y: number }> = {
  tight: { x: 4, y: 16 },
  cozy:  { x: 16, y: 36 },
  wide:  { x: 48, y: 60 },
};

const STORAGE_KEY = 'pdf-reader-prefs-v1';

export function PdfReader({ fileUrl, initialPage = 1, onProgress, onRequestReload }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(1);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [viewMode, setViewMode] = useState<ViewMode>('paged');
  const [fitMode, setFitMode] = useState<FitMode>('width');
  const [margin, setMargin] = useState<Margin>('cozy');
  const [pageAspect, setPageAspect] = useState<number>(1.4); // height/width, A4 ≈ 1.414
  const [chromeVisible, setChromeVisible] = useState(true);
  const [loadError, setLoadError] = useState<DiagnosedError | null>(null);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(800);
  const [previewPage, setPreviewPage] = useState<number | null>(null);
  const [previewX, setPreviewX] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartT = useRef<number>(0);
  const hideTimer = useRef<number | null>(null);
  const previewHideTimer = useRef<number | null>(null);
  const scrollPageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const programmaticScroll = useRef(false);

  // Load saved preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.theme) setTheme(p.theme);
      if (p.viewMode) setViewMode(p.viewMode);
      if (p.fitMode) setFitMode(p.fitMode);
      if (p.margin) setMargin(p.margin);
      if (typeof p.scale === 'number' && p.scale > 0) setScale(p.scale);
    } catch { /* noop */ }
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, viewMode, fitMode, margin, scale }));
    } catch { /* noop */ }
  }, [theme, viewMode, fitMode, margin, scale]);

  // Memoize file option to prevent react-pdf from reloading the document on every render.
  // retryNonce is included so "Tentar novamente" forces a fresh load.
  const fileOption = useMemo(
    () => ({ url: fileUrl, withCredentials: false }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileUrl, retryNonce],
  );

  // Watchdog: if loading takes too long without success/error, surface a hint + retry option.
  useEffect(() => {
    setLoadingTooLong(false);
    if (numPages > 0 || loadError) return;
    const t = window.setTimeout(() => setLoadingTooLong(true), 12000);
    return () => window.clearTimeout(t);
  }, [fileUrl, retryNonce, numPages, loadError]);

  const handleRetry = useCallback(async () => {
    setLoadError(null);
    setLoadingTooLong(false);
    setNumPages(0);
    if (onRequestReload) {
      try { await onRequestReload(); } catch { /* noop */ }
    }
    setRetryNonce((n) => n + 1);
  }, [onRequestReload]);

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

  // Compute the effective render width based on fit mode + margins.
  // - 'width' fills the container minus horizontal margin (Google Play Books default).
  // - 'page' fits the entire page within the visible viewport (height-bound).
  // - 'manual' uses scale slider on top of width-based base.
  const marginPx = MARGIN_PX[margin];
  const effectiveWidth = useMemo(() => {
    const baseWidth = Math.max(240, containerWidth - marginPx.x * 2);
    if (fitMode === 'width') return Math.min(baseWidth, 1100);
    if (fitMode === 'page') {
      // Account for vertical chrome (top bar ~48 + bottom scrubber ~96) only in paged mode
      const verticalChrome = viewMode === 'paged' ? 144 : marginPx.y * 2;
      const availableHeight = Math.max(320, containerHeight - verticalChrome);
      const widthFromHeight = availableHeight / pageAspect;
      return Math.min(widthFromHeight, baseWidth, 1100);
    }
    // manual: width × scale (clamped)
    return Math.min(Math.max(240, baseWidth * scale), 1600);
  }, [containerWidth, containerHeight, fitMode, marginPx.x, marginPx.y, pageAspect, scale, viewMode]);

  useEffect(() => {
    if (numPages > 0) onProgress(page, numPages);
  }, [page, numPages, onProgress]);

  // Scroll mode: scroll to the requested page when `page` changes from outside (scrubber, keys)
  useEffect(() => {
    if (viewMode !== 'scroll') return;
    const el = scrollPageRefs.current.get(page);
    const scroller = pageAreaRef.current;
    if (!el || !scroller) return;
    programmaticScroll.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => { programmaticScroll.current = false; }, 700);
  }, [page, viewMode]);

  // Scroll mode: observe which page is most visible and update `page`
  useEffect(() => {
    if (viewMode !== 'scroll' || !pageAreaRef.current || numPages === 0) return;
    const scroller = pageAreaRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScroll.current) return;
        let bestPage = page;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            const p = Number((entry.target as HTMLElement).dataset.page);
            if (p) bestPage = p;
          }
        }
        if (bestRatio > 0.4 && bestPage !== page) setPage(bestPage);
      },
      { root: scroller, threshold: [0.25, 0.5, 0.75] },
    );
    scrollPageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, numPages]);

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
          onClick={() = aria-label="Diminuir zoom"> setScale((s) => Math.max(0.5, s - 0.1))}
          title="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs tabular-nums w-10 text-center opacity-70">{Math.round(scale * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() = aria-label="Aumentar zoom"> setScale((s) => Math.min(2.5, s + 0.1))}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Modo de leitura</p>
                <div className="grid grid-cols-2 gap-2">
                  <ThemeChip active={viewMode === 'paged'} onClick={() => setViewMode('paged')} icon={<BookOpen className="h-4 w-4" />} label="Página" />
                  <ThemeChip active={viewMode === 'scroll'} onClick={() => setViewMode('scroll')} icon={<ScrollText className="h-4 w-4" />} label="Rolagem" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ajuste automático</p>
                <div className="grid grid-cols-3 gap-2">
                  <ThemeChip active={fitMode === 'width'} onClick={() => setFitMode('width')} icon={<Maximize2 className="h-4 w-4" />} label="Largura" />
                  <ThemeChip active={fitMode === 'page'} onClick={() => setFitMode('page')} icon={<BookOpen className="h-4 w-4" />} label="Página" />
                  <ThemeChip active={fitMode === 'manual'} onClick={() => setFitMode('manual')} icon={<ZoomIn className="h-4 w-4" />} label="Manual" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Margens</p>
                <div className="grid grid-cols-3 gap-2">
                  <ThemeChip active={margin === 'tight'} onClick={() => setMargin('tight')} icon={<span className="text-[10px] font-bold">S</span>} label="Pequena" />
                  <ThemeChip active={margin === 'cozy'} onClick={() => setMargin('cozy')} icon={<span className="text-[10px] font-bold">M</span>} label="Média" />
                  <ThemeChip active={margin === 'wide'} onClick={() => setMargin('wide')} icon={<span className="text-[10px] font-bold">L</span>} label="Grande" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Zoom {fitMode !== 'manual' && <span className="opacity-60 normal-case">(manual)</span>}</p>
                  <span className="text-xs tabular-nums">{Math.round(scale * 100)}%</span>
                </div>
                <Slider
                  value={[scale * 100]}
                  min={50}
                  max={250}
                  step={10}
                  onValueChange={(v) => { setScale(v[0] / 100); setFitMode('manual'); }}
                />
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
        ref={pageAreaRef}
        className={`absolute inset-0 overflow-auto select-none ${viewMode === 'paged' ? 'flex items-start justify-center cursor-pointer' : 'cursor-default'}`}
        style={{ paddingLeft: marginPx.x, paddingRight: marginPx.x, paddingTop: marginPx.y, paddingBottom: marginPx.y + (viewMode === 'paged' ? 40 : 0) }}
        onClick={viewMode === 'paged' ? handleClick : undefined}
        onTouchStart={viewMode === 'paged' ? handleTouchStart : undefined}
        onTouchEnd={viewMode === 'paged' ? handleTouchEnd : undefined}
      >
        <Document
          file={fileOption}
          onLoadSuccess={({ numPages: n }) => { setNumPages(n); setLoadError(null); setLoadingTooLong(false); }}
          onLoadError={(err) => { setLoadError(diagnosePdfError(err, fileUrl)); }}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 p-12 min-w-[280px] min-h-[360px] text-center mx-auto">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Carregando livro…</p>
              {loadingTooLong && (
                <div className="mt-4 space-y-3 max-w-xs">
                  <p className="text-xs text-muted-foreground">
                    Está demorando mais que o esperado. O link pode ter expirado ou a conexão está lenta.
                  </p>
                  <Button size="sm" variant="outline" onClick={handleRetry} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 p-10 min-w-[300px] min-h-[360px] text-center max-w-sm mx-auto">
              {loadError?.icon ?? <AlertTriangle className="h-6 w-6 text-destructive" />}
              <p className="text-sm font-semibold text-foreground">{loadError?.title ?? 'Não foi possível abrir o PDF'}</p>
              <p className="text-xs text-muted-foreground">{loadError?.description ?? 'Verifique sua conexão ou tente novamente.'}</p>
              <p className="text-[11px] text-muted-foreground/80 italic">{loadError?.hint}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleRetry} className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  {loadError?.kind === 'expired' ? 'Recarregar livro' : 'Tentar novamente'}
                </Button>
              </div>
            </div>
          }
        >
          {viewMode === 'paged' ? (
            <div
              key={page}
              className="rounded-sm overflow-hidden mx-auto"
              style={{
                boxShadow: themeStyle.pageShadow,
                filter: themeStyle.filter,
                animation: 'pdf-page-in 280ms ease-out',
                backgroundColor: '#ffffff',
                width: 'fit-content',
              }}
            >
              <Page
                pageNumber={page}
                width={effectiveWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={(p) => {
                  // Use first-rendered page to learn the aspect ratio for fit-page mode
                  const w = p.width || p.originalWidth;
                  const h = p.height || p.originalHeight;
                  if (w && h) setPageAspect(h / w);
                }}
                loading={
                  <div className="flex items-center justify-center" style={{ width: effectiveWidth, height: effectiveWidth * pageAspect }}>
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                }
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <div
                  key={p}
                  ref={(el) => {
                    if (el) scrollPageRefs.current.set(p, el);
                    else scrollPageRefs.current.delete(p);
                  }}
                  data-page={p}
                  className="rounded-sm overflow-hidden"
                  style={{
                    boxShadow: themeStyle.pageShadow,
                    filter: themeStyle.filter,
                    backgroundColor: '#ffffff',
                    width: 'fit-content',
                  }}
                >
                  <Page
                    pageNumber={p}
                    width={effectiveWidth}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onLoadSuccess={p === 1 ? (pp) => {
                      const w = pp.width || pp.originalWidth;
                      const h = pp.height || pp.originalHeight;
                      if (w && h) setPageAspect(h / w);
                    } : undefined}
                    loading={
                      <div className="flex items-center justify-center" style={{ width: effectiveWidth, height: effectiveWidth * pageAspect }}>
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </Document>
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
          {/* Scrubber + thumbnail preview */}
          <div
            ref={scrubberRef}
            className="relative"
            onPointerMove={(e) => {
              if (!numPages || !scrubberRef.current) return;
              const rect = scrubberRef.current.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const target = Math.max(1, Math.min(numPages, Math.round(ratio * (numPages - 1)) + 1));
              setPreviewPage(target);
              setPreviewX(e.clientX - rect.left);
              if (previewHideTimer.current) { window.clearTimeout(previewHideTimer.current); previewHideTimer.current = null; }
            }}
            onPointerLeave={() => {
              if (previewHideTimer.current) window.clearTimeout(previewHideTimer.current);
              previewHideTimer.current = window.setTimeout(() => setPreviewPage(null), 180);
            }}
            onPointerDown={(e) => {
              if (!numPages || !scrubberRef.current) return;
              const rect = scrubberRef.current.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const target = Math.max(1, Math.min(numPages, Math.round(ratio * (numPages - 1)) + 1));
              setPreviewPage(target);
              setPreviewX(e.clientX - rect.left);
            }}
          >
            {/* Thumbnail bubble */}
            {previewPage !== null && numPages > 0 && (
              <ThumbnailBubble
                fileOption={fileOption}
                page={previewPage}
                x={previewX}
                theme={theme}
              />
            )}
            <Slider
              value={[page]}
              min={1}
              max={Math.max(1, numPages)}
              step={1}
              onValueChange={(v) => { goTo(v[0]); setPreviewPage(v[0]); }}
              onValueCommit={() => {
                if (previewHideTimer.current) window.clearTimeout(previewHideTimer.current);
                previewHideTimer.current = window.setTimeout(() => setPreviewPage(null), 600);
              }}
            />
          </div>
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

const THUMB_WIDTH = 110; // px
const THUMB_HEIGHT = 150; // ~A4 ratio

function ThumbnailBubble({
  fileOption,
  page,
  x,
  theme,
}: {
  fileOption: { url: string; withCredentials: boolean };
  page: number;
  x: number;
  theme: ReaderTheme;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [parentW, setParentW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;
    const update = () => setParentW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clamp horizontally so bubble stays inside the scrubber bounds
  const half = THUMB_WIDTH / 2;
  const left = parentW > 0
    ? Math.max(half + 4, Math.min(parentW - half - 4, x))
    : x;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute z-40 -translate-x-1/2 transition-opacity duration-150"
      style={{
        left,
        bottom: 'calc(100% + 12px)',
        opacity: 1,
      }}
    >
      <div
        className="rounded-md overflow-hidden border shadow-xl flex items-center justify-center"
        style={{
          width: THUMB_WIDTH,
          height: THUMB_HEIGHT,
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : undefined,
        }}
      >
        <Document
          file={fileOption}
          loading={<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          error={<span className="text-[10px] text-muted-foreground px-2 text-center">—</span>}
        >
          <Page
            pageNumber={page}
            width={THUMB_WIDTH}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          />
        </Document>
      </div>
      {/* Page number caption */}
      <div
        className="mx-auto mt-1.5 px-2 py-0.5 rounded text-[11px] tabular-nums font-medium text-center"
        style={{
          width: 'fit-content',
          backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
          color: theme === 'dark' ? '#f5f5f5' : '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Página {page}
      </div>
      {/* Tail */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -4,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid ${theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)'}`,
        }}
      />
    </div>
  );
}
