import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ZoomIn, ZoomOut } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfReaderProps {
  fileUrl: string;
  initialPage?: number;
  onProgress: (page: number, totalPages: number) => void;
}

export function PdfReader({ fileUrl, initialPage = 1, onProgress }: PdfReaderProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(Math.min(containerRef.current.clientWidth - 32, 900));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (numPages > 0) onProgress(page, numPages);
  }, [page, numPages, onProgress]);

  const [pageInput, setPageInput] = useState('');

  const goTo = (target: number) => {
    if (!numPages) return;
    const next = Math.max(1, Math.min(numPages, target));
    if (next === page) return;
    setDirection(next > page ? 'next' : 'prev');
    setPage(next);
  };
  const goNext = () => goTo(page + 1);
  const goPrev = () => goTo(page - 1);
  const jumpForward = () => goTo(page + 10);
  const jumpBackward = () => goTo(page - 10);
  const goFirst = () => goTo(1);
  const goLast = () => goTo(numPages);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Home') { e.preventDefault(); goFirst(); }
      else if (e.key === 'End') { e.preventDefault(); goLast(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, numPages]);

  const submitPageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (!isNaN(n)) goTo(n);
    setPageInput('');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goPrev();
    else if (x > rect.width * 0.7) goNext();
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full h-full bg-muted/20">
      <div className="absolute top-3 right-3 z-20 flex gap-1">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="flex-1 w-full overflow-auto flex items-start justify-center py-6 cursor-pointer select-none"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={page}
          className="shadow-2xl"
          style={{
            animation: `page-flip-${direction} 0.4s ease-out`,
            transformOrigin: direction === 'next' ? 'left center' : 'right center',
          }}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<div className="p-8 text-sm text-muted-foreground">Carregando livro...</div>}
            error={<div className="p-8 text-sm text-destructive">Não foi possível abrir o PDF.</div>}
          >
            <Page pageNumber={page} width={containerWidth} scale={scale} renderAnnotationLayer={false} renderTextLayer={false} />
          </Document>
        </div>
      </div>

      <div className="w-full border-t border-border bg-background/95 backdrop-blur px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goPrev} disabled={page <= 1} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${numPages ? (page / numPages) * 100 : 0}%` }} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {page} / {numPages || '—'}
        </span>
        <Button variant="ghost" size="icon" onClick={goNext} disabled={page >= numPages} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <style>{`
        @keyframes page-flip-next {
          from { opacity: 0; transform: translateX(40px) rotateY(-15deg); }
          to { opacity: 1; transform: translateX(0) rotateY(0); }
        }
        @keyframes page-flip-prev {
          from { opacity: 0; transform: translateX(-40px) rotateY(15deg); }
          to { opacity: 1; transform: translateX(0) rotateY(0); }
        }
      `}</style>
    </div>
  );
}
