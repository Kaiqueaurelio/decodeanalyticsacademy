import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSubjectColor } from '@/lib/subject-colors';
import { canonicalSubjectKey, guessSemesterFromCategory, subjectKey } from '@/lib/subject-semester-map';

interface ApostilaRow {
  id: string;
  title: string;
  category: string | null;
  cover_url: string | null;
  semester: number | null;
  source_type: string | null;
  content: string | null;
}

function keepMostComplete(rows: ApostilaRow[]) {
  const unique = new Map<string, ApostilaRow>();
  for (const row of rows) {
    const title = subjectKey(row.title);
    const key = `${title}::${canonicalSubjectKey(row.category)}`;
    const current = unique.get(key);
    if (!current || (row.content || '').length > (current.content || '').length) unique.set(key, row);
  }
  return [...unique.values()];
}

export default function SubjectPage() {
  const { category = '' } = useParams();
  const decodedCategory = decodeURIComponent(category);
  const navigate = useNavigate();
  const [rows, setRows] = useState<ApostilaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const targetKey = subjectKey(decodedCategory);
      const targetSemester = guessSemesterFromCategory(decodedCategory);

      // Buscamos todas para garantir que a lógica de "targetSemester" funcione mesmo se o 
      // semester no banco estiver nulo, usando a normalização local.
      const { data } = await supabase
        .from('apostilas')
        .select('id, title, category, cover_url, semester, source_type, content')
        .eq('published', true)
        .order('title', { ascending: true });

      if (!alive) return;

      const normalizedRows = ((data as ApostilaRow[]) || [])
        .map((row) => ({
          ...row,
          semester: row.semester ?? guessSemesterFromCategory(row.category) ?? null,
        }))
        .filter((row) => {
          const rowKey = subjectKey(row.category || '');
          // 1. Se o slug da categoria bater exatamente (normalizado)
          if (rowKey === targetKey) return true;
          // 2. Se a categoria contiver o termo (ex: "Processamento" em "Processamento de Imagem")
          // mas APENAS se estiverem no mesmo semestre (para evitar poluição entre matérias)
          if (targetSemester && row.semester === targetSemester && rowKey.includes(targetKey)) return true;
          // 3. Fallback se a categoria for nula mas o título contiver o termo (casos extremos de erro de cadastro)
          if (!rowKey && row.title.toLowerCase().includes(targetKey)) return true;
          return false;
        });

      setRows(keepMostComplete(normalizedRows));
      const { data: counts } = await supabase.rpc('get_exercise_counts');
      if (!alive) return;
      setExerciseCounts((counts as Record<string, number>) || {});
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [decodedCategory]);

  const color = getSubjectColor(decodedCategory);
  const cover = useMemo(() => rows.find((r) => r.cover_url)?.cover_url || null, [rows]);
  const filteredRows = useMemo(() => {
    const q = subjectKey(query);
    if (!q) return rows;
    return rows.filter((row) => subjectKey(`${row.title} ${row.category || ''}`).includes(q));
  }, [rows, query]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-2 sm:px-4 pb-16">
        <div className="pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
        </div>

        <header
          className="relative mt-3 overflow-hidden rounded-3xl border border-border/60 h-40 sm:h-52"
          style={{
            backgroundImage: cover
              ? `linear-gradient(135deg, ${color}66 0%, #0b1220dd 100%), url("${cover}")`
              : `linear-gradient(135deg, ${color}dd 0%, ${color}44 55%, #0b1220 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-x-5 bottom-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              Materia
            </p>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              {decodedCategory}
            </h1>
            <p className="mt-1 text-xs text-white/80">
              {loading
                ? 'Carregando...'
                : `${rows.length} ${rows.length === 1 ? 'apostila disponivel' : 'apostilas disponiveis'}`}
            </p>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          {!loading && rows.length > 1 && (
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value.slice(0, 80))}
                placeholder="Buscar nesta materia..."
                className="h-9 pl-9 text-xs"
              />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-[2/3] sm:aspect-[3/4] rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              Nenhuma apostila publicada nesta materia ainda.
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
              Nenhuma apostila encontrada para essa busca.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredRows.map((a) => {
                const exCount = exerciseCounts[a.id] || 0;
                const words = (a.content || '').split(/\s+/).filter(Boolean).length;
                const readMin = Math.max(2, Math.round(words / 220));
                return (
                  <Link
                    key={a.id}
                    to={`/apostila/${a.id}`}
                    className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div
                      className="relative aspect-[2/3] sm:aspect-[3/4] w-full"
                      style={{
                        backgroundImage: a.cover_url
                          ? `url("${a.cover_url}")`
                          : `linear-gradient(135deg, ${color}dd 0%, ${color}44 60%, #0b1220 100%)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!a.cover_url && (
                        <FileText className="absolute right-3 top-3 h-4 w-4 text-white/70" strokeWidth={1.6} />
                      )}
                      <span
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5"
                        style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 p-3">
                      <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {a.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{readMin} min de leitura</span>
                        {exCount > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="tabular-nums">{exCount} exercicios</span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-primary/90">
                          Ler Material
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary/70 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
