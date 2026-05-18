import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, PenLine, FileText, Calendar, MessagesSquare, User, Trophy, Sheet as SheetIcon, Library, Calculator } from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { to: '/dashboard', icon: Home, label: 'Início' },
  { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Minhas Disciplinas' },
  { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades' },
  { to: '/exercicios', icon: PenLine, label: 'Exercícios' },
  { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
  { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
  { to: '/livros', icon: SheetIcon, label: 'Livros' },
  { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
  { to: '/comunidade', icon: MessagesSquare, label: 'Mensagens' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function StudentSidebar() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 z-40 flex-col border-r border-border bg-card/60 backdrop-blur-xl">
      {/* Brand */}
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/dashboard'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`
            }
          >
            <it.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{it.label}</span>
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border border-accent/30
              ${isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-accent hover:bg-accent/10'}`
            }
          >
            <Trophy className="h-4 w-4 shrink-0" />
            <span className="truncate">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Foco card */}
      <div className="m-4 rounded-2xl p-4 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/30 relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative">
          <h4 className="font-bold text-sm mb-1">Mantenha o foco</h4>
          <p className="text-[11px] text-muted-foreground leading-snug mb-3">
            Pequenas metas diárias, grandes conquistas.
          </p>
          <Button
            size="sm"
            className="w-full h-8 text-[11px] font-bold"
            onClick={() => navigate('/dashboard#atividades')}
          >
            Ver minhas metas
          </Button>
        </div>
      </div>
    </aside>
  );
}
