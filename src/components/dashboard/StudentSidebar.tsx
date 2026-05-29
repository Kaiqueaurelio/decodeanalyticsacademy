import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, PenLine, FileText, Calendar, MessagesSquare, User, Trophy, Sheet as SheetIcon, Library, Calculator, ShieldCheck } from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Minhas Disciplinas' },
  { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades' },
  { to: '/exercicios', icon: PenLine, label: 'Exercicios' },
  { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
  { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
  { to: '/livros', icon: SheetIcon, label: 'Livros' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/comunidade', icon: MessagesSquare, label: 'Mensagens' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

function scrollToDashboardSection(id: string, navigate: ReturnType<typeof useNavigate>) {
  const go = () => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/dashboard#${id}`);
      return true;
    }
    return false;
  };

  if (window.location.pathname !== '/dashboard') {
    navigate(`/dashboard#${id}`);
    window.setTimeout(go, 180);
    return;
  }

  if (!go()) {
    window.setTimeout(go, 80);
  }
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="h-full flex flex-col bg-card/60 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/60">
        <img src={logoOwl} alt="" className="h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
        <div className="leading-tight">
          <div className="font-display text-[13px] font-extrabold tracking-tight">
            DECODE <span className="text-primary">ANALYTICS</span>
          </div>
          <div className="font-mono-label text-[9px] font-medium uppercase tracking-[0.3em] text-primary/80">
            Academy
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-primary/12 text-foreground'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-all ${
                    isActive ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)]' : 'bg-transparent group-hover:bg-border'
                  }`}
                />
                <it.icon
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                <span className="truncate tracking-tight">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl text-sm font-bold transition-all mt-3 border border-accent/30
              ${isActive ? 'bg-accent/15 text-accent' : 'text-accent/90 hover:bg-accent/10'}`
            }
          >
            <ShieldCheck strokeWidth={2.5} className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate tracking-tight">Painel Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="m-4 rounded-2xl p-4 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/30 relative overflow-hidden dashboard-focus-card">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative">
          <h4 className="font-bold text-sm mb-1">Mantenha o foco</h4>
          <p className="text-[11px] text-muted-foreground leading-snug mb-3">
            Pequenas metas diarias, grandes conquistas.
          </p>
          <Button
            size="sm"
            className="w-full h-8 text-[11px] font-bold"
            onClick={() => {
              scrollToDashboardSection('atividades', navigate);
              onNavigate?.();
            }}
          >
            Ver minhas metas
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StudentSidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 z-40 flex-col border-r border-border">
      <SidebarContent />
    </aside>
  );
}
