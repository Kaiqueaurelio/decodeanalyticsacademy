import { Search, ChevronDown, Menu, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { NotificationBell } from '@/components/NotificationBell';
import { AuthStatusIndicator } from '@/components/AuthStatusIndicator';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useState } from 'react';
import { useApostilasList } from '@/hooks/queries/useDashboardData';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SidebarContent } from './StudentSidebar';

export function DashboardTopbar() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: profile } = useUserProfile(user?.id);
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const { data: apostilas = [] } = useApostilasList();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const lower = query.toLowerCase();
    const hit = apostilas.find((a: any) => a.title?.toLowerCase().includes(lower) || a.category?.toLowerCase().includes(lower));
    if (hit) navigate(`/apostila/${hit.id}`);
  };

  const initials = (profile?.full_name || user?.email || 'A').slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? 'Administrador' : 'Aluno';

  return (
    <header className="sticky top-0 z-30 bg-background/88 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-2 px-3 sm:px-6 lg:px-8 h-16">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Abrir menu de navegação"
              aria-haspopup="dialog"
              aria-expanded={navOpen}
            >
              <Menu strokeWidth={2.5} className="h-[18px] w-[18px]" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            aria-label="Menu de navegação"
            className="w-[min(88vw,320px)] sm:w-[320px] max-w-none p-0 border-r border-border flex h-dvh flex-col overflow-hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
              <SheetDescription>Use Tab para navegar e Esc para fechar.</SheetDescription>
            </SheetHeader>
            <SidebarContent mode="full" onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>


        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="lg:hidden h-9 px-2.5 gap-1.5 border-accent/50 text-accent hover:bg-accent/10"
            aria-label="Painel Admin"
          >
            <ShieldCheck strokeWidth={2.5} className="h-[16px] w-[16px]" />
            <span className="hidden min-[390px]:inline text-[11px] font-bold">Admin</span>
          </Button>
        )}

        <form onSubmit={submit} className="flex-1 max-w-2xl relative">
          <Search strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar apostila ou disciplina"
            aria-label="Buscar apostila ou disciplina"
            className="w-full h-10 sm:h-11 pl-10 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-card/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-all"
          />
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl" aria-label="Alternar tema">
            {theme === 'dark' ? <Sun strokeWidth={2.5} className="h-[16px] w-[16px]" /> : <Moon strokeWidth={2.5} className="h-[16px] w-[16px]" />}
          </Button>
          {user && <AuthStatusIndicator />}
          {user && <NotificationBell />}

          <button
            onClick={() => navigate('/profile')}
            className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl bg-card/60 border border-border hover:border-primary/50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs">
              {initials}
            </div>
            <div className="leading-tight text-left">
              <div className="text-xs font-bold truncate max-w-[120px]">
                {profile?.full_name || 'Aluno'}
              </div>
              <div className={`text-[10px] ${isAdmin ? 'text-accent font-semibold' : 'text-muted-foreground'}`}>{roleLabel}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="hidden md:inline-flex h-9 text-xs text-muted-foreground"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
