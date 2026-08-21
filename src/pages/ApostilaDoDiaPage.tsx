import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ExternalLink, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatApostilaDate, getApostilaPageSavedDate, getLocalDateIso, isMissingApostilaPageSavedDateColumn } from '@/lib/apostila-pages';

type PageRow = {
  id: string;
  apostila_id: string;
  title: string | null;
  position: number | null;
  saved_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type ApostilaRow = {
  id: string;
  title: string;
  category: string;
  published: boolean;
};

export default function ApostilaDoDiaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get('date') || getLocalDateIso();
  const [selectedDate, setSelectedDate] = useState(requestedDate);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(requestedDate);
  }, [requestedDate]);

  useEffect(() => {
    let cancelled = false;

    const findLesson = async () => {
      setLoading(true);
      setNotFound(false);
      setErrorMessage(null);

      let pageResult: { data: PageRow[] | null; error: any } = await (supabase.from('apostila_pages' as any) as any)
        .select('id, apostila_id, title, position, saved_date, updated_at, created_at')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (pageResult.error && isMissingApostilaPageSavedDateColumn(pageResult.error)) {
        pageResult = await (supabase.from('apostila_pages' as any) as any)
          .select('id, apostila_id, title, position, updated_at, created_at')
          .order('position', { ascending: true })
          .order('created_at', { ascending: true });
      }

      if (pageResult.error) {
        if (!cancelled) {
          setErrorMessage('Não foi possível consultar as aulas agora. Tente novamente em instantes.');
          setLoading(false);
        }
        return;
      }

      const pages = (pageResult.data || []).map((page) => ({
        ...page,
        saved_date: getApostilaPageSavedDate(page),
      }));
      const apostilaIds = [...new Set(pages.map((page) => page.apostila_id))];
      let apostilaRows: ApostilaRow[] = [];
      if (apostilaIds.length > 0) {
        const { data, error: apostilaError } = await supabase
          .from('apostilas')
          .select('id, title, category, published')
          .in('id', apostilaIds)
          .eq('published', true);

        if (apostilaError) {
          if (!cancelled) {
            setErrorMessage('Não foi possível validar a publicação da aula. Tente novamente em instantes.');
            setLoading(false);
          }
          return;
        }
        apostilaRows = (data || []) as ApostilaRow[];
      }

      const publishedById = new Map(apostilaRows.map((apostila) => [apostila.id, apostila]));
      const publishedPages = pages.filter((page) => publishedById.has(page.apostila_id));
      const dates = [...new Set(publishedPages.map((page) => page.saved_date).filter(Boolean) as string[])].sort().reverse();
      const match = publishedPages.find((page) => page.saved_date === requestedDate);

      if (!cancelled) {
        setAvailableDates(dates.slice(0, 8));
        if (match) {
          navigate(`/reader/${match.apostila_id}?lesson=${encodeURIComponent(`page:${match.id}`)}`, { replace: true });
          return;
        }
        setNotFound(true);
        setLoading(false);
      }
    };

    void findLesson();
    return () => {
      cancelled = true;
    };
  }, [navigate, requestedDate]);

  const submitDate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDate) return;
    navigate(`/aula-do-dia?date=${encodeURIComponent(selectedDate)}`);
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="h-4 w-4" /> Voltar ao dashboard
        </Button>

        <Card className="border-primary/20 shadow-xl shadow-primary/5">
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Apostila do dia</CardTitle>
            <CardDescription>
              Escolha uma data de aula para abrir diretamente o conteúdo correspondente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={submitDate} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                aria-label="Data da aula"
                className="sm:flex-1"
              />
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" /> Buscar aula
              </Button>
            </form>

            {loading && (
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Procurando a aula de {formatApostilaDate(requestedDate)}…
              </div>
            )}

            {!loading && errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            {!loading && notFound && !errorMessage && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
                <div>
                  <h2 className="font-semibold">Nenhuma aula publicada encontrada</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Não encontramos uma apostila para {formatApostilaDate(requestedDate)}. Escolha outra data ou confira uma das datas disponíveis abaixo.
                  </p>
                </div>
                {availableDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((date) => (
                      <Button key={date} type="button" variant="outline" size="sm" onClick={() => navigate(`/aula-do-dia?date=${date}`)}>
                        {formatApostilaDate(date)}
                      </Button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" className="gap-2 px-0" onClick={() => navigate('/dashboard')}>
                  Ir para minhas disciplinas <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
