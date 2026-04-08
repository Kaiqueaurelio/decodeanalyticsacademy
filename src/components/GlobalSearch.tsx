import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, BookOpen, FileText, X } from 'lucide-react';

type Result = { id: string; title: string; type: 'apostila' | 'material'; category?: string };

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const [ap, mat] = await Promise.all([
        supabase.from('apostilas').select('id, title, category').eq('published', true).ilike('title', `%${query}%`).limit(5),
        supabase.from('materials').select('id, title').ilike('title', `%${query}%`).limit(5),
      ]);
      const r: Result[] = [
        ...(ap.data || []).map(a => ({ id: a.id, title: a.title, type: 'apostila' as const, category: a.category })),
        ...(mat.data || []).map(m => ({ id: m.id, title: m.title, type: 'material' as const })),
      ];
      setResults(r);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const go = (r: Result) => {
    setOpen(false); setQuery('');
    if (r.type === 'apostila') navigate(`/apostila/${r.id}`);
    else navigate('/materials');
  };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar apostilas, materiais..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-8 pr-8 h-8 text-xs"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
          {results.map(r => (
            <button key={r.id + r.type} onClick={() => go(r)}
              className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-accent smooth-all">
              {r.type === 'apostila' ? <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className="truncate flex-1">{r.title}</span>
              {r.category && <span className="text-[10px] text-muted-foreground">{r.category}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
