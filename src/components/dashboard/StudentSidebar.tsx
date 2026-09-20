import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  ClipboardList,
  PenLine,
  FileText,
  Trophy,
  NotebookPen,
  BriefcaseBusiness,
  Newspaper,
  CalendarRange,
  CheckSquare,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import logoOwl from '@/assets/owl-icon.png';
import { PomodoroWidget } from '@/components/gamification/PomodoroWidget';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: Home, label: 'Início' },
      { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Disciplinas' },
      { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades' },
    ],
  },
  {
    label: 'Estudos',
    items: [
      { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
      { to: '/exercicios', icon: PenLine, label: 'Exercícios' },
      { to: '/gabaritos', icon: CheckSquare, label: 'Gabaritos' },
      { to: '/simulado', icon: Trophy, label: 'Simulado' },
      { to: '/plano-de-estudos', icon: NotebookPen, label: 'Plano de estudos' },
    ],
  },
  {
    label: 'Networking',
    items: [
      { to: '/vagas', icon: BriefcaseBusiness, label: 'Vagas e estágios' },
      { to: '/empregabilidade', icon: BriefcaseBusiness, label: 'Inteligência da Empregabilidade' },
      { to: '/noticias', icon: Newspaper, label: 'News Tech' },
      { to: '/eventos', icon: CalendarRange, label: 'Eventos' },
    ],
  },
];

type SidebarContentProps = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
};

function SidebarIconButton({
  label,
  children,
  onClick,
  active = false,
  collapsed,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex min-h-10 items-center gap-3 rounded-xl border px-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
        collapsed ? 'mx-auto w-11 justify-center px-0' : 'w-full'
      } ${
        active
          ? 'border-cyan-300/20 bg-cyan-300/[0.11] text-cyan-100 shadow-[inset_3px_0_0_#67e8f9]'
          : 'border-transparent text-slate-400 hover:border-white/[0.07] hover:bg-white/[0.06] hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export function SidebarContent({ onNavigate, collapsed = false, onToggle }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut, user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const [search, setSearch] = useState('');

  const isActive = (to: string) => {
    const [path, hash] = to.split('#');
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    return location.pathname === path;
  };

  const handleNav = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  const visibleGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return menuGroups;

    return menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(term)),
      }))
      .filter((group) => group.items.length > 0);
  }, [search]);

  const initials = profile?.full_name?.trim()
    ? profile.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : 'DA';

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden border-r border-white/[0.08] bg-[#08111f] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.10),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(3,7,18,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <header className={`relative z-10 border-b border-white/[0.08] ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        <div className={collapsed ? 'flex flex-col items-center gap-3' : 'flex items-center gap-3'}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-300/[0.08] shadow-[0_8px_24px_rgba(34,211,238,0.08)]">
            <img src={logoOwl} alt="Decode Analytics Academy" className="h-7 w-7 object-contain brightness-110" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold tracking-[0.04em] text-white">Decode Academy</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-300/60">Área do aluno</p>
            </div>
          )}

          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? 'Expandir menu de navegação' : 'Recolher menu de navegação'}
              aria-pressed={collapsed}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.04] text-slate-400 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.10] hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${collapsed ? '' : 'ml-auto'}`}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      {!collapsed && (
        <div className="relative z-10 px-3 pb-2 pt-3">
          <label className="sr-only" htmlFor="student-sidebar-search">Buscar no menu</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="student-sidebar-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              placeholder="Buscar no menu"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.045] pl-9 pr-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-300/10"
            />
          </div>
        </div>
      )}

      <nav aria-label="Navegação principal" className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,.25)_transparent]">
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => (
            <section key={group.label} className="mb-6 last:mb-0">
              {!collapsed && (
                <div className="mb-2 flex items-center gap-2 px-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/[0.10] to-transparent" />
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <SidebarIconButton
                      key={item.to}
                      label={item.label}
                      collapsed={collapsed}
                      active={active}
                      onClick={() => handleNav(item.to)}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-cyan-200' : 'text-slate-500 group-hover:text-slate-200'}`} />
                      <span className={collapsed ? 'sr-only' : 'truncate text-sm font-medium'}>{item.label}</span>
                      {active && (
                        <span
                          aria-hidden="true"
                          className={`${collapsed ? 'absolute right-1.5 top-1.5' : 'ml-auto'} h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,.9)]`}
                        />
                      )}
                    </SidebarIconButton>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <p className="px-2 py-8 text-center text-xs text-slate-500">Nenhum item encontrado.</p>
        )}

        {isAdmin && (
          <section className="mt-6 border-t border-white/[0.08] pt-4">
            {!collapsed && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300/60">Administração</p>}
            <SidebarIconButton label="Painel administrativo" collapsed={collapsed} onClick={() => handleNav('/admin')}>
              <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-violet-300" />
              <span className={collapsed ? 'sr-only' : 'truncate text-sm font-medium text-violet-100'}>Painel administrativo</span>
            </SidebarIconButton>
          </section>
        )}
      </nav>

      <div className="relative z-10 border-t border-white/[0.08] bg-slate-950/30">
        <PomodoroWidget collapsed={collapsed} />

        <div className={`border-t border-white/[0.06] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.045] p-2 ${collapsed ? 'flex-col justify-center' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-300/[0.10] text-xs font-bold text-cyan-100">{initials}</div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{profile?.full_name || user?.email || 'Aluno'}</p>
                <p className={`mt-0.5 text-[10px] uppercase tracking-[0.12em] ${isAdmin ? 'font-semibold text-primary' : 'text-slate-500'}`}>
                  {isAdmin ? 'Administrador conectado' : 'Aluno conectado'}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Sair da conta"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      aria-label="Navegação principal"
      data-sidebar-collapsed={collapsed}
      className={`fixed inset-y-0 left-0 z-30 hidden overflow-visible transition-[width] duration-300 ease-out lg:flex ${collapsed ? 'w-[84px]' : 'w-[264px]'}`}
    >
      <SidebarContent collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}
