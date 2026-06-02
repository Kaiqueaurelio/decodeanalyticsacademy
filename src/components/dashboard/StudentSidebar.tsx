import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, PenLine, FileText, MessagesSquare, User, Sheet as SheetIcon, Library, Calculator, ShieldCheck, GraduationCap, MoreHorizontal } from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: Home, label: 'Inicio' },
      { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Minhas Disciplinas' },
      { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades' },
    ],
  },
  {
    label: 'Estudos',
    items: [
      { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
      { to: '/cursos', icon: GraduationCap, label: 'Cursos' },
      { to: '/exercicios', icon: PenLine, label: 'Exercicios' },
      { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
      { to: '/livros', icon: SheetIcon, label: 'Livros' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
      { to: '/comunidade', icon: MessagesSquare, label: 'Mensagens' },
      { to: '/profile', icon: User, label: 'Perfil' },
    ],
  },
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

  if (!go()) window.setTimeout(go, 80);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="h-full flex bg-card/80 backdrop-blur-xl">
      <div className="flex w-[74px] flex-col items-center border-r border-border/60 bg-background/55 py-4">
        <img src={logoOwl} alt="" className="mb-5 h-10 w-10 object-contain drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
        <div className="flex flex-1 flex-col items-center gap-2">
          {[Home, BookOpen, GraduationCap, Library, MoreHorizontal].map((Icon, index) => (
            <span key={index} className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground">
              <Icon className="h-5 w-5" />
            </span>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-5 py-5 border-b border-border/60">
          <div className="font-display text-[13px] font-extrabold tracking-tight">
            DECODE <span className="text-primary">ANALYTICS</span>
          </div>
          <div className="font-mono-label text-[9px] font-medium uppercase tracking-[0.3em] text-primary/80">
            Academy
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === '/dashboard'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all
                      ${isActive
                        ? 'border-primary bg-primary/12 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]'
                        : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/35 hover:text-foreground'}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <it.icon strokeWidth={isActive ? 2.5 : 2} className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-primary' : ''}`} />
                        <span className="truncate tracking-tight">{it.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all
                ${isActive ? 'border-accent bg-accent/15 text-accent' : 'border-accent/35 text-accent/90 hover:bg-accent/10'}`
              }
            >
              <ShieldCheck strokeWidth={2.5} className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate tracking-tight">Painel Admin</span>
            </NavLink>
          )}
        </nav>

        <div className="m-4 rounded-xl p-4 bg-primary/10 border border-primary/30 relative overflow-hidden">
          <div className="relative">
            <h4 className="font-bold text-sm mb-1">Mantenha o foco</h4>
            <p className="text-[11px] text-muted-foreground leading-snug mb-3">Pequenas metas diarias, grandes conquistas.</p>
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
    </div>
  );
}

export function StudentSidebar() {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 z-40 flex-col border-r border-border">
      <SidebarContent />
    </aside>
  );
}
