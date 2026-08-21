import { useMemo, useState } from 'react';
import { ClipboardCheck, Search } from 'lucide-react';
import { GABARITOS, normalizeSubjectKey } from '@/data/gabaritos';
import { GabaritoSection } from '@/components/GabaritoSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const GabaritosPage = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>(GABARITOS[0]?.name ?? '');

  const filtered = useMemo(() => {
    const key = normalizeSubjectKey(query);
    if (!key) return GABARITOS;
    return GABARITOS.filter((subject) =>
      normalizeSubjectKey(subject.name).includes(key) || normalizeSubjectKey(subject.code).includes(key),
    );
  }, [query]);

  const active = filtered.find((s) => s.name === selected) ?? filtered[0];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Material de revisão</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Gabaritos por disciplina</h1>
          <p className="text-sm text-muted-foreground">
            Consulte as respostas dos questionários das Unidades I e II de cada matéria cadastrada.
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar disciplina ou código..."
            className="pl-9"
            aria-label="Buscar disciplina"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filtered.map((subject) => (
            <Button
              key={subject.code}
              size="sm"
              variant={active?.code === subject.code ? 'default' : 'outline'}
              onClick={() => setSelected(subject.name)}
              className="text-xs"
            >
              {subject.name}
            </Button>
          ))}
        </div>

        {active ? (
          <GabaritoSection subject={active.name} />
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma disciplina encontrada para essa busca.</p>
        )}
      </div>
    </div>
  );
};

export default GabaritosPage;
