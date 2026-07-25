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
  Activity,
  HelpCircle,
  Trophy,
  RotateCcw,
  LogOut,
  Newspaper,
} from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';

const SIDEBAR_WIDTHS = {
  full: '260px',
  rail: '260px',
  hidden: '72px',
} as const;

type SidebarMode = keyof typeof SIDEBAR_WIDTHS;

// unipOnly = item pensado para alunos UNIP (currículo, turma, materiais da faculdade);
// escondido para usuários com content_scope = 'enem_only'.
type MenuItem = { to: string; icon: any; label: string; unipOnly?: boolean };

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: Home, label: 'Início' },
      { to: '/dashboard#minhas-disciplinas', icon: BookOpen, label: 'Minhas Disciplinas', unipOnly: true },
      { to: '/dashboard#atividades', icon: ClipboardList, label: 'Atividades', unipOnly: true },
    ],
  },
  {
    label: 'Estudos',
    items: [
      { to: '/dashboard#apostilas', icon: FileText, label: 'Apostilas' },
      { to: '/cursos', icon: GraduationCap, label: 'Cursos', unipOnly: true },
      { to: '/exercicios', icon: PenLine, label: 'Exercícios' },
      { to: '/biblioteca', icon: Library, label: 'Biblioteca', unipOnly: true },
      { to: '/livros', icon: SheetIcon, label: 'Livros', unipOnly: true },
      { to: '/flashcards', icon: Sparkles, label: 'Flashcards' },
      { to: '/review', icon: RotateCcw, label: 'Revisão' },
      { to: '/simulado', icon: Trophy, label: 'Simulado' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/noticias', icon: Newspaper, label: 'Notícias Tech', unipOnly: true },
      { to: '/calculadora', icon: Calculator, label: 'Calculadora' },
      { to: '/performance', icon: Activity, label: 'Desempenho' },
      { to: '/tira-duvida', icon: HelpCircle, label: 'Tira-dúvidas' },
      { to: '/comunidade', icon: MessagesSquare, label: 'Comunidade', unipOnly: true },
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
  { to: '/admin/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/admin/relatorios', icon: BarChart3, label: 'Relatórios' },
];

const railItems = [
  { to: '/dashboard#notificacoes', icon: Bell, label: 'Avisos' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
  { to: '/cursos', icon: Package, label: 'Cursos' },
  { to: '/admin', icon: Users, label: 'Usuários', adminOnly: true },
  { to: '/admin/financeiro', icon: TrendingUp, label: 'Finanças', adminOnly: true },
  { to: '/admin/relatorios', icon: BarChart3, label: 'Relatórios', adminOnly: true },
  { to: '/livros', icon: Store, label: 'Loja' },
  { to: '/dashboard#apostilas', icon: GraduationCap, label: 'Academy' },
  { to: '/dashboard#mais', icon: MoreHorizontal, label: 'Mais' },
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
  hideBottomNavDuplicates = false,
}: {
  mode?: Exclude<SidebarMode, 'hidden'>;
  setMode?: (mode: SidebarMode) => void;
  onNavigate?: () => void;
  hideBottomNavDuplicates?: boolean;
}) {
  const location = useLocation();
  const { isAdmin, signOut, user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const isEnemOnly = profile?.content_scope === 'enem_only';
  const { navigate, open } = useSidebarNavigation(onNavigate);
  const visibleRailItems = railItems.filter((item) => !item.adminOnly || isAdmin);
  const railMenuItems = mode === 'full' ? visibleRailItems.slice(0, isAdmin ? 7 : 6) : visibleRailItems;
  // Rotas já presentes na bottom nav mobile — quando aberta como Sheet, evitar duplicar
  const BOTTOM_NAV_ROUTES = new Set([
    '/dashboard',
    '/dashboard#apostilas',
    '/exercicios',
    '/cursos',
    '/biblioteca',
  ]);
  const filteredGroups = menuGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (isEnemOnly && it.unipOnly) return false;
        if (hideBottomNavDuplicates && BOTTOM_NAV_ROUTES.has(it.to)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
  const isFull = true;
  const canToggle = typeof setMode === 'function';
  const showRail = false;

  return (
    <div className="relative h-full flex overflow-hidden bg-gradient-to-b from-background via-background to-card/60 text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 -right-16 h-64 w-64 rounded-full bg-accent/12 blur-3xl" />
      </div>
      {/* Right divider */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent" />

      {isFull && (
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Header / Brand */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
            <button
              type="button"
              onClick={() => open('/dashboard')}
              className="group flex min-w-0 items-center gap-3 text-left transition"
              aria-label="Ir para o dashboard"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-primary/40 transition-all duration-300 group-hover:ring-primary/70 group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
                <img src={logoOwl} alt="Decode Analytics Academy" className="h-8 w-8 object-contain" />
                <span className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/0 via-primary/0 to-accent/20 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[13px] font-extrabold tracking-tight text-foreground">
                  DECODE <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ANALYTICS</span>
                </span>
                <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-primary/80">
                  Academy
                </span>
              </span>
            </button>
            {canToggle && (
              <button
                type="button"
                onClick={() => setMode!('hidden')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                aria-label="Esconder menu lateral"
                title="Esconder menu lateral"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Nav groups */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 [scrollbar-width:thin]">
            {filteredGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 px-3 pb-2">
                  <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
                    {group.label}
                  </span>
                  <span className="h-px flex-[3] bg-gradient-to-l from-border to-transparent" />
                </div>
                <div className="space-y-0.5">
                  {group.items.map((it) => {
                    const active = isRouteActive(location.pathname, location.hash, it.to);
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.to}
                        type="button"
                        onClick={() => open(it.to)}
                        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200
                          ${active
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
                        )}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all
                          ${active
                            ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                            : 'text-muted-foreground/80 group-hover:bg-muted/60 group-hover:text-foreground'}`}
                        >
                          <Icon strokeWidth={active ? 2.4 : 1.9} className="h-[15px] w-[15px]" />
                        </span>
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {isAdmin && (
              <div>
                <div className="flex items-center gap-2 px-3 pb-2">
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.28em] text-accent/80">
                    Administração
                  </span>
                  <span className="h-px flex-[3] bg-gradient-to-l from-accent/40 to-transparent" />
                </div>
                <div className="space-y-0.5">
                  {adminMenuItems.map((it) => {
                    const active = isRouteActive(location.pathname, location.hash, it.to);
                    const Icon = it.icon;
                    return (
                      <button
                        key={`${it.label}-${it.to}`}
                        type="button"
                        onClick={() => open(it.to)}
                        className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all
                          ${active
                            ? 'bg-accent/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
                        )}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all
                          ${active
                            ? 'bg-accent/15 text-accent ring-1 ring-accent/30'
                            : 'text-muted-foreground/80 group-hover:bg-muted/60 group-hover:text-foreground'}`}
                        >
                          <Icon strokeWidth={active ? 2.4 : 1.9} className="h-[15px] w-[15px]" />
                        </span>
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => open('/admin')}
                  className={`mt-2 group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-all
                    ${location.pathname.startsWith('/admin')
                      ? 'bg-gradient-to-r from-accent/20 to-accent/5 text-foreground ring-1 ring-accent/40'
                      : 'text-accent hover:bg-accent/10'}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30">
                    <ShieldCheck strokeWidth={2.4} className="h-[15px] w-[15px]" />
                  </span>
                  <span className="truncate">Painel Admin</span>
                </button>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  onNavigate?.();
                }}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/80 group-hover:bg-destructive/15 group-hover:text-destructive">
                  <LogOut strokeWidth={1.9} className="h-[15px] w-[15px]" />
                </span>
                <span className="truncate">Sair da conta</span>
              </button>
            </div>
          </nav>

          {/* Focus card */}
          <div className="relative m-3 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
            <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative">
              <div className="mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-xs font-bold tracking-tight text-foreground">Mantenha o foco</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Acompanhe metas e atividades pendentes do dia.</p>
              <Button
                size="sm"
                className="mt-3 h-9 w-full rounded-lg bg-gradient-to-r from-primary to-accent text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-all shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)]"
                onClick={() => {
                  scrollToDashboardSection('atividades', navigate);
                  onNavigate?.();
                }}
              >
                Ver metas
              </Button>
            </div>
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
        className="fixed bottom-0 left-0 top-0 z-40 hidden w-[72px] flex-col items-center border-r border-border/60 bg-card/50 backdrop-blur-xl py-4 lg:flex"
        aria-label="Menu lateral recolhido"
      >
        <button
          type="button"
          onClick={() => setMode('full')}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-background ring-1 ring-primary/30 transition hover:ring-primary/70 hover:shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
          aria-label="Expandir menu lateral"
          title="Expandir menu lateral"
        >
          <img src={logoOwl} alt="Decode Analytics Academy" className="h-8 w-8 object-contain" />
        </button>

        <button
          type="button"
          onClick={() => setMode('full')}
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/8 text-primary transition hover:bg-primary/15 hover:border-primary/60"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <div className="mt-5 h-px w-8 bg-border/60" />
        <span className="mt-5 rotate-180 font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-muted-foreground/60 [writing-mode:vertical-rl]">
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
