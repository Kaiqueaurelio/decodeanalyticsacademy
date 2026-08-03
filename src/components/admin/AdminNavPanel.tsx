import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { filterAdminNav, type AdminTabId } from '@/config/adminNav';

export type AdminNavCounts = Partial<Record<'apostilas' | 'exercises' | 'materials' | 'users' | 'securityAlerts', number>>;

interface AdminNavPanelProps {
  tab: AdminTabId;
  onSelect: (tab: AdminTabId) => void;
  counts: AdminNavCounts;
  /** Conteúdo extra exibido ao final da lista (ex.: atalho para a biblioteca). */
  footerSlot?: React.ReactNode;
  autoFocusSearch?: boolean;
}

/**
 * Lista de navegação do admin, agrupada por área e com busca.
 * Usada tanto na sidebar (desktop) quanto no menu deslizante (celular),
 * garantindo a mesma organização nos dois formatos.
 */
export function AdminNavPanel({ tab, onSelect, counts, footerSlot, autoFocusSearch }: AdminNavPanelProps) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => filterAdminNav(query), [query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus={autoFocusSearch}
            placeholder="Buscar seção..."
            aria-label="Buscar seção do painel"
            className="h-10 bg-muted/50 pl-9 pr-9 text-sm"
          />
          {query && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-4 px-3 pb-4" aria-label="Seções do painel administrativo">
          {groups.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Nenhuma seção encontrada.
            </p>
          )}
          {groups.map(group => (
            <div key={group.id} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map(item => {
                const active = tab === item.id;
                const count = item.countKey ? counts[item.countKey] : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-primary/15 to-accent/5 text-primary ring-1 ring-primary/20 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      active 
                        ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                        : 'bg-background border-border group-hover:border-muted-foreground/30'
                    }`}>
                      <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    </div>
                    <span className="min-w-0 flex-1 py-0.5">
                      <span className={`block truncate text-sm font-bold tracking-tight ${active ? 'text-primary' : 'text-foreground/90'}`}>
                        {item.label}
                      </span>
                      <span className="block truncate text-[10px] font-medium text-muted-foreground/80 mt-0.5">
                        {item.desc}
                      </span>
                    </span>
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                    )}
                    {count !== undefined && count > 0 && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black tracking-tighter ${
                        active ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {footerSlot}
        </nav>
      </ScrollArea>
    </div>
  );
}
