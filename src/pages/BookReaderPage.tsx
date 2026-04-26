import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Maximize } from 'lucide-react';
import { PdfReader } from '@/modules/library/components/PdfReader';
import { EpubReader } from '@/modules/library/components/EpubReader';
import { useReadingProgress } from '@/modules/library/useReadingProgress';
import type { Book } from '@/modules/library/types';

export default function BookReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { progress, loaded, save } = useReadingProgress(id, (book?.file_type || 'pdf') as 'pdf' | 'epub');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
      setBook(data as Book | null);
      setLoading(false);
    })();
  }, [id]);

  const goFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (loading || !loaded) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-sm text-muted-foreground">Livro não encontrado.</p>
        <Button onClick={() => navigate('/livros')} variant="outline" size="sm">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center gap-2 px-3 sm:px-4 h-12 border-b border-border bg-background/95 backdrop-blur z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/livros')} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{book.title}</h1>
          {book.author && <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={goFullscreen} className="h-8 w-8">
          <Maximize className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-hidden">
        {book.file_type === 'pdf' ? (
          <PdfReader
            fileUrl={book.file_url}
            initialPage={progress?.current_page || 1}
            onProgress={(page, total) => save({ current_page: page, progress_percentage: (page / total) * 100 })}
          />
        ) : (
          <EpubReader
            fileUrl={book.file_url}
            initialLocation={progress?.location}
            onProgress={(location, pct) => save({ location, progress_percentage: pct })}
          />
        )}
      </div>
    </div>
  );
}
