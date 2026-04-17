import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, BookOpen, FolderOpen, Library, Users, User, Shield,
  Sun, Moon, LogOut, Search,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type ApostilaRow = { id: string; title: string; category: string };

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [apostilas, setApostilas] = useState<ApostilaRow[]>([]);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Toggle com Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Busca de apostilas (debounce)
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) { setApostilas([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('apostilas')
        .select('id, title, category')
        .eq('published', true)
        .ilike('title', `%${query}%`)
        .limit(8);
      setApostilas(data || []);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const go = (path: string) => { setOpen(false); setQuery(''); navigate(path); };

  const navItems = useMemo(() => ([
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FolderOpen, label: 'Materiais', path: '/materials' },
    { icon: Library, label: 'Biblioteca', path: '/biblioteca' },
    { icon: Users, label: 'Comunidade', path: '/comunidade' },
    { icon: User, label: 'Perfil', path: '/profile' },
    { icon: Shield, label: 'Admin', path: '/admin' },
  ]), []);

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar apostilas ou navegar… (⌘K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>

        {apostilas.length > 0 && (
          <>
            <CommandGroup heading="Apostilas">
              {apostilas.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`apostila-${a.id}-${a.title}`}
                  onSelect={() => go(`/apostila/${a.id}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                  <span className="flex-1 truncate">{a.title}</span>
                  <span className="ml-2 text-[10px] uppercase text-muted-foreground">{a.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navegar">
          {navItems.map(({ icon: Icon, label, path }) => (
            <CommandItem key={path} onSelect={() => go(path)}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => { toggleTheme(); setOpen(false); }}>
            {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Alternar tema ({theme === 'dark' ? 'claro' : 'escuro'})
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); signOut(); }}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="border-t border-border/50 px-3 py-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Busca rápida</span>
        <span>⌘K para abrir/fechar</span>
      </div>
    </CommandDialog>
  );
}
