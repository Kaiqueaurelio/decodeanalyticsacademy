import { useEffect } from 'react';
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
  ChevronsLeft,
  Layers,
  Target,
  Activity,
  HelpCircle,
  Trophy,
  NotebookPen,
  RotateCcw,
  LogOut,
  Newspaper,
  CheckSquare,
  HeartHandshake,
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
// hideForEnem = ferramenta extra que não pertence ao foco ENEM (calculadora de médias, etc);
// ambos são escondidos para usuários com content_scope = 'enem_only'.
type MenuItem = { to: string; icon: any; label: string; unipOnly?: boolean; hideForEnem?: boolean };

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
      { to: '/flashcards', icon: Layers, label: 'Flashcards', hideForEnem: true },
      { to: '/review', icon: RotateCcw, label: 'Revisão' },
      { to: '/simulado', icon: Trophy, label: 'Simulado' },
      { to: '/plano-de-estudos', icon: NotebookPen, label: 'Plano de Estudos' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/noticias', icon: Newspaper, label: 'Notícias Tech', unipOnly: true },
      { to: '/calculadora', icon: Calculator, label: 'Calculadora', hideForEnem: true },
      { to: '/performance', icon: Activity, label: 'Desempenho' },
      { to: '/tira-duvida', icon: HelpCircle, label: 'Tira-dúvidas', hideForEnem: true },
      { to: '/comunidade', icon: MessagesSquare, label: 'Comunidade', unipOnly: true },
    ],
  },
  {
    label: 'Conta',
    items: [
      { to: '/profile', icon: User, label: 'Meu Perfil' },
      { to: '/apoie', icon: Heart, label: 'Apoie a Missão ☕' },
    ],
  },

];


const adminMenuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Resumo' },
  { to: '/admin?tab=apostilas', icon: BookOpen, label: 'Apostilas' },
  { to: '/admin?tab=tasks', icon: CheckSquare, label: 'Minhas Tarefas' },
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
    
    // Pequeno delay para garantir que a navegação iniciou antes de fechar o sheet
    // Isso ajuda a evitar "trancamento" visual se o dispositivo for lento
    requestAnimationFrame(() => {
      onNavigate?.();
    });
  };

  return { navigate, open };
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
        if (isEnemOnly && (it.unipOnly || it.hideForEnem)) return false;
        if (hideBottomNavDuplicates && BOTTOM_NAV_ROUTES.has(it.to)) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
  const isFull = true;
  const canToggle = typeof setMode === 'function';
  const showRail = false;

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-gradient-to-b from-background via-background to-card/60 text-foreground">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 -right-16 h-64 w-64 rounded-full bg-accent/12 blur-3xl" />
      </div>
      {/* Right divider */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent" />

      {isFull && (
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
                  DECODE ANALYTICS ACADEMY
                </span>
                <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Academy By Kaique Aurelio
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
          <nav className="flex-1 min-h-0 space-y-6 overflow-y-auto overscroll-contain px-3 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] [scrollbar-width:thin] scrollbar-none">
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
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
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
                  
                  {group.label === 'Principal' && (
                    <div className="mt-4 px-3 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 space-y-2 mx-1 shadow-inner shadow-primary/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary drop-shadow-sm">Estágio Pro</span>
                        <span className="text-[10px] font-black text-foreground">LVL 99</span>
                      </div>
                      <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden border border-border/10">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent w-[100%] rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.5)] transition-all duration-1000" 
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] text-muted-foreground font-mono uppercase tracking-tighter">
                        <span>MAX XP</span>
                        <span>Mestre da Decode</span>
                      </div>
                    </div>
                  )}
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
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
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
                  className={`mt-2 group flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
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
                className="group flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/80 group-hover:bg-destructive/15 group-hover:text-destructive">
                  <LogOut strokeWidth={1.9} className="h-[15px] w-[15px]" />
                </span>
                <span className="truncate">Sair da conta</span>
              </button>
            </div>

            {/* Focus card — dentro da área rolável para que o menu seja idêntico
                no sidebar fixo e no drawer (sem cortar itens em telas menores) */}
            <div className="relative rounded-lg border border-border bg-card p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" strokeWidth={2} aria-hidden="true" />
                <h4 className="text-xs font-bold tracking-tight text-foreground">Mantenha o foco</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">Acompanhe metas e atividades pendentes do dia.</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 h-9 w-full rounded-md text-[11px] font-semibold"
                onClick={() => {
                  scrollToDashboardSection('atividades', navigate);
                  onNavigate?.();
                }}
              >
                Ver metas
              </Button>
            </div>
          </nav>
        </div>
      )}

    </div>
  );
}

/**
 * Menu unificado: em qualquer largura de tela o menu é o mesmo drawer
 * (aberto pelo botão do topo ou pela barra inferior no celular).
 * Não existe mais uma sidebar fixa diferente no desktop.
 */
export function StudentSidebar() {
  useEffect(() => {
    document.documentElement.style.setProperty('--student-sidebar-width', '0px');
    return () => {
      document.documentElement.style.removeProperty('--student-sidebar-width');
    };
  }, []);

  return null;
}
