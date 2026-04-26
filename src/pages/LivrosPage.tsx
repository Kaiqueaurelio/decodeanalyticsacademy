import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import type { Book, ReadingProgress } from '@/modules/library/types';

export default function LivrosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: bs } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      setBooks((bs || []) as Book[]);
      if (user) {
        const { data: prog } = await supabase.from('reading_progress').select('*').eq('user_id', user.id);
        const map: Record<string, ReadingProgress> = {};
        (prog || []).forEach((p: any) => { map[p.book_id] = p; });
        setProgressMap(map);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Biblioteca Digital
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Leia livros completos com experiência de leitor real.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : books.length === 0 ? (
          <Card className="p-10 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum livro disponível ainda.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {books.map((book) => {
              const prog = progressMap[book.id];
              const pct = prog?.progress_percentage ? Math.round(Number(prog.progress_percentage)) : 0;
              return (
                <button
                  key={book.id}
                  onClick={() => navigate(`/livros/${book.id}`)}
                  className="group flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                >
                  <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-muted shadow-[0_4px_12px_-2px_hsl(var(--foreground)/0.18)] group-hover:shadow-[0_10px_24px_-4px_hsl(var(--foreground)/0.28)] transition-all duration-300 group-hover:-translate-y-1">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5">
                        <BookOpen className="h-10 w-10 text-primary/50" />
                      </div>
                    )}
                    <Badge
                      className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-wide px-1.5 py-0 h-4 font-medium backdrop-blur-sm bg-background/80 text-foreground border-0"
                      variant="secondary"
                    >
                      {book.file_type}
                    </Badge>
                    {pct > 0 && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-background/40">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 px-0.5 flex flex-col gap-0.5">
                    <h3 className="font-medium text-[13px] leading-snug line-clamp-2 text-foreground">{book.title}</h3>
                    {book.author && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{book.author}</p>
                    )}
                    {pct > 0 && (
                      <p className="text-[10px] text-primary font-medium mt-0.5">{pct}% lido</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
