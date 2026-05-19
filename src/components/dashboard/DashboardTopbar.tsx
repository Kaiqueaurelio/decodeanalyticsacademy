import { Search, ChevronDown, Menu, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { useState } from 'react';
import { useApostilasList } from '@/hooks/queries/useDashboardData';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
    const hit = apostilas.find((a: any) => a.title?.toLowerCase().includes(lower));
    if (hit) navigate(`/apostila/${hit.id}`);
  };

  const initials = (profile?.full_name || user?.email || 'A').slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? 'Administrador' : 'Perfil do aluno';

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        {/* Mobile menu */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-border">
            <SidebarContent onNavigate={() => setNavOpen(false)} />
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
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[11px] font-bold">Admin</span>
          </Button>
        )}

        {/* Search */}
        <form onSubmit={submit} className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por disciplinas, atividades, apostilas..."
            className="w-full h-11 pl-11 pr-4 rounded-2xl bg-card/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-card transition-all"
          />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
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
