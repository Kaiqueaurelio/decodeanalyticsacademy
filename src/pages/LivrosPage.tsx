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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => {
              const prog = progressMap[book.id];
              const pct = prog?.progress_percentage ? Math.round(Number(prog.progress_percentage)) : 0;
              return (
                <Card key={book.id} className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow">
                  <div className="aspect-[2/3] bg-muted relative overflow-hidden">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 text-[10px] uppercase" variant="secondary">{book.file_type}</Badge>
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-1">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{book.title}</h3>
                    {book.author && <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>}
                    {pct > 0 && (
                      <div className="mt-1">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% lido</p>
                      </div>
                    )}
                    <Button size="sm" className="mt-2 h-8 text-xs" onClick={() => navigate(`/livros/${book.id}`)}>
                      {pct > 0 ? 'Continuar' : 'Ler'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
