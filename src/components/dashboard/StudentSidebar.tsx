import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  BookOpen,
  ClipboardList,
  PenLine,
  FileText,
  MessagesSquare,
  User,
  Sheet as SheetIcon,
  Library,
  Calculator,
  ShieldCheck,
  GraduationCap,
  MoreHorizontal,
  Bell,
  LayoutDashboard,
  Package,
  Users,
  TrendingUp,
  Globe,
  BarChart3,
  Store,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsLeft,
  Sparkles,
  Timer,
  Activity,
  HelpCircle,
  Trophy,
  RotateCcw,
  Megaphone,
  LogOut,
  Settings,
} from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const SIDEBAR_WIDTHS = {
  full: '356px',
  rail: '104px',
  hidden: '72px',
} as const;

type SidebarMode = keyof typeof SIDEBAR_WIDTHS;

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: Home, label: 'Início' },
      { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Minhas Disciplinas' },
      { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades' },
    ],
  },
  {
    label: 'Estudos',
    items: [
      { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
      { to: '/cursos', icon: GraduationCap, label: 'Cursos' },
      { to: '/exercicios', icon: PenLine, label: 'Exercícios' },
      { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
      { to: '/livros', icon: SheetIcon, label: 'Livros' },
      { to: '/flashcards', icon: Sparkles, label: 'Flashcards' },
      { to: '/review', icon: RotateCcw, label: 'Revisão' },
      { to: '/simulado', icon: Trophy, label: 'Simulado' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
      { to: '/performance', icon: Activity, label: 'Desempenho' },
      { to: '/tira-duvida', icon: HelpCircle, label: 'Tira-dúvidas' },
      { to: '/comunidade', icon: MessagesSquare, label: 'Comunidade' },
    ],
  },
  {
    label: 'Conta',
    items: [
      { to: '/profile', icon: User, label: 'Meu Perfil' },
    ],
  },
];


const adminMenuItems = [
  { to: '/admin', icon: Users, label: 'Usuários' },
  { to: '/admin', icon: TrendingUp, label: 'Financeiro' },
  { to: '/admin', icon: BarChart3, label: 'Relatórios' },
  { to: '/dashboard', icon: Globe, label: 'Site' },
];

const railItems = [
  { to: '/dashboard', icon: Bell, label: 'Notificações' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cursos', icon: Package, label: 'Cursos' },
  { to: '/admin', icon: Users, label: 'Usuários', adminOnly: true },
  { to: '/admin', icon: TrendingUp, label: 'Financeiro', adminOnly: true },
  { to: '/dashboard', icon: Globe, label: 'Site' },
  { to: '/admin', icon: BarChart3, label: 'Relatórios', adminOnly: true },
  { to: '/livros', icon: Store, label: 'Store' },
  { to: '/cursos', icon: GraduationCap, label: 'Academy' },
  { to: '/dashboard', icon: MoreHorizontal, label: 'Mais' },
  { to: '/comunidade', icon: LifeBuoy, label: 'Suporte' },
];

function setDashboardHash(id: string) {
  window.history.replaceState(null, '', `/dashboard#${id}`);
}

function findDashboardSection(id: string) {
  return document.getElementById(id) || document.querySelector(`[data-sidebar-section="${id}"]`);
}

function scrollToDashboardSection(id: string, navigate: ReturnType<typeof useNavigate>) {
  const scroll = () => {
    const el = findDashboardSection(id);
    if (!el) return false;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setDashboardHash(id);
    return true;
  };

  const retryScroll = () => {
    requestAnimationFrame(() => {
      if (scroll()) return;
      window.setTimeout(scroll, 120);
      window.setTimeout(scroll, 320);
      window.setTimeout(scroll, 700);
    });
  };

  if (window.location.pathname !== '/dashboard') {
    navigate(`/dashboard#${id}`);
    retryScroll();
    return;
  }

  if (!scroll()) retryScroll();
}

function isRouteActive(currentPath: string, currentHash: string, to: string) {
  const [path, hash] = to.split('#');
  if (hash) return currentPath === path && currentHash === `#${hash}`;
  if (to === '/dashboard') return currentPath === '/dashboard' && !currentHash;
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function useSidebarNavigation(onNavigate?: () => void) {
  const navigate = useNavigate();

  const open = (to: string) => {
    const [path, hash] = to.split('#');
    if (path === '/dashboard' && hash) {
      scrollToDashboardSection(hash, navigate);
    } else {
      navigate(to);
    }
    onNavigate?.();
  };

  return { navigate, open };
}

function getInitialSidebarMode(): SidebarMode {
  if (typeof window === 'undefined') return 'full';
  const saved = window.localStorage.getItem('decode_student_sidebar_mode');
  return saved === 'rail' || saved === 'hidden' || saved === 'full' ? saved : 'full';
}

export function SidebarContent({
  mode = 'full',
  setMode,
  onNavigate,
}: {
  mode?: Exclude<SidebarMode, 'hidden'>;
  setMode?: (mode: SidebarMode) => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  const { navigate, open } = useSidebarNavigation(onNavigate);
  const visibleRailItems = mode === 'rail' ? railItems.filter((item) => !item.adminOnly || isAdmin) : [];
  const isFull = mode === 'full';
  const canToggle = typeof setMode === 'function';
  // Mobile drawer = sem rail decorativo, com header próprio incluindo logo
  const showRail = canToggle;

  return (
    <div className="h-full flex overflow-hidden bg-background text-foreground shadow-2xl">
      {showRail && (
        <div className="flex w-[104px] shrink-0 flex-col items-center border-r border-border bg-card/60 py-3">
          <button
            type="button"
            onClick={() => open('/dashboard')}
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-[0_0_22px_hsl(var(--primary)/0.25)] ring-1 ring-primary/30 transition hover:ring-primary/60"
            aria-label="Ir para o dashboard"
          >
            <img src={logoOwl} alt="Decode Analytics Academy" className="h-10 w-10 object-contain" />
          </button>

          {canToggle && (
            <button
              type="button"
              onClick={() => setMode!(isFull ? 'rail' : 'full')}
              className="mb-3 flex h-9 w-[84px] items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 text-[10px] font-black uppercase tracking-wide text-primary transition hover:bg-primary/20"
              aria-label={isFull ? 'Recolher menu principal' : 'Expandir menu principal'}
              title={isFull ? 'Recolher menu principal' : 'Expandir menu principal'}
            >
              {isFull ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              {isFull ? 'Menor' : 'Abrir'}
            </button>
          )}

          {isFull ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-between pb-5 pt-3">
              <div className="h-px w-10 bg-border" />
              <span className="rotate-180 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground [writing-mode:vertical-rl]">
                Menu
              </span>
              <div className="h-px w-10 bg-border" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-stretch gap-1 overflow-y-auto px-2 pb-3">
              {visibleRailItems.map((item) => {
                const active = isRouteActive(location.pathname, location.hash, item.to);
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.label}-${item.to}`}
                    type="button"
                    onClick={() => open(item.to)}
                    className={`group relative flex min-h-12 w-[88px] flex-col items-center justify-center gap-1 rounded-md border px-1.5 text-center text-[10px] font-bold leading-tight transition
                      ${active ? 'border-primary bg-primary/15 text-foreground' : 'border-transparent text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground'}`}
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                    <span className="w-full truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isFull && (
        <div className="flex min-w-0 flex-1 flex-col bg-card/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <button type="button" onClick={() => open('/dashboard')} className="flex min-w-0 items-center gap-3 text-left transition hover:opacity-85">
              {!showRail && (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-primary/40 shadow-[0_0_18px_hsl(var(--primary)/0.25)]">
                  <img src={logoOwl} alt="Decode Analytics Academy" className="h-8 w-8 object-contain" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-display text-[13px] font-extrabold tracking-tight text-foreground">
                  DECODE <span className="text-primary">ANALYTICS</span>
                </span>
                <span className="block font-mono text-[9px] font-medium uppercase tracking-[0.3em] text-primary">
                  Academy
                </span>
              </span>
            </button>
            {canToggle && (
              <button
                type="button"
                onClick={() => setMode!('hidden')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/40 text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="Esconder menu lateral"
                title="Esconder menu lateral"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((it) => {
                    const active = isRouteActive(location.pathname, location.hash, it.to);
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.to}
                        type="button"
                        onClick={() => open(it.to)}
                        className={`group flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm font-semibold transition-all
                          ${active
                            ? 'border-primary/60 bg-primary/15 text-foreground shadow-[inset_3px_0_0_hsl(var(--primary))]'
                            : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'}`}
                      >
                        <Icon strokeWidth={active ? 2.6 : 2.1} className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary' : ''}`} />
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {isAdmin && (
              <div>
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  Administração
                </div>
                <div className="space-y-1">
                  {adminMenuItems.map((it) => {
                    const active = isRouteActive(location.pathname, location.hash, it.to);
                    const Icon = it.icon;
                    return (
                      <button
                        key={`${it.label}-${it.to}`}
                        type="button"
                        onClick={() => open(it.to)}
                        className={`group flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm font-semibold transition-all
                          ${active
                            ? 'border-accent/60 bg-accent/15 text-foreground shadow-[inset_3px_0_0_hsl(var(--accent))]'
                            : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground'}`}
                      >
                        <Icon strokeWidth={active ? 2.6 : 2.1} className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-accent' : ''}`} />
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => open('/admin')}
                  className={`mt-2 group flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-sm font-bold transition-all
                    ${location.pathname.startsWith('/admin')
                      ? 'border-accent bg-accent/20 text-foreground shadow-[inset_3px_0_0_hsl(var(--accent))]'
                      : 'border-accent/35 text-accent hover:border-accent/70 hover:bg-accent/10'}`}
                >
                  <ShieldCheck strokeWidth={2.5} className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">Painel Admin</span>
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  onNavigate?.();
                }}
                className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3.5 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut strokeWidth={2.1} className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">Sair da conta</span>
              </button>
            </div>
          </nav>

          <div className="m-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <h4 className="text-xs font-bold text-foreground">Mantenha o foco</h4>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Acompanhe suas metas e atividades pendentes.</p>
            <Button
              size="sm"
              className="mt-2 h-8 w-full rounded-md bg-primary text-[11px] font-black uppercase text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                scrollToDashboardSection('atividades', navigate);
                onNavigate?.();
              }}
            >
              Ver metas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentSidebar() {
  const [mode, setModeState] = useState<SidebarMode>(getInitialSidebarMode);

  const setMode = (nextMode: SidebarMode) => {
    setModeState(nextMode);
    window.localStorage.setItem('decode_student_sidebar_mode', nextMode);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--student-sidebar-width', SIDEBAR_WIDTHS[mode]);
    return () => {
      document.documentElement.style.removeProperty('--student-sidebar-width');
    };
  }, [mode]);

  if (mode === 'hidden') {
    return (
      <aside
        className="fixed bottom-0 left-0 top-0 z-40 hidden w-[72px] flex-col items-center border-r border-border bg-card/60 py-4 shadow-2xl lg:flex"
        aria-label="Menu lateral recolhido"
      >
        <button
          type="button"
          onClick={() => setMode('full')}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-background ring-1 ring-primary/30 shadow-[0_0_22px_hsl(var(--primary)/0.22)] transition hover:ring-primary/60"
          aria-label="Expandir menu lateral"
          title="Expandir menu lateral"
        >
          <img src={logoOwl} alt="Decode Analytics Academy" className="h-9 w-9 object-contain" />
        </button>

        <button
          type="button"
          onClick={() => setMode('full')}
          className="mt-4 flex h-11 w-11 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition hover:bg-primary/20"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>

        <div className="mt-5 h-px w-10 bg-border" />
        <span className="mt-5 rotate-180 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground [writing-mode:vertical-rl]">
          Menu
        </span>
      </aside>
    );
  }

  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-border transition-[width] duration-300 ease-out lg:flex"
      style={{ width: SIDEBAR_WIDTHS[mode] }}
    >
      <SidebarContent mode={mode} setMode={setMode} />
    </aside>
  );
}
