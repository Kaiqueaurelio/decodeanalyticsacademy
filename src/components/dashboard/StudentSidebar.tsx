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
} from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const SIDEBAR_WIDTHS = {
  full: '356px',
  rail: '104px',
  hidden: '0px',
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
  mode,
  setMode,
  onNavigate,
}: {
  mode: Exclude<SidebarMode, 'hidden'>;
  setMode: (mode: SidebarMode) => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { navigate, open } = useSidebarNavigation(onNavigate);
  const visibleRailItems = railItems.filter((item) => !item.adminOnly || isAdmin);
  const isFull = mode === 'full';

  return (
    <div className="h-full flex overflow-hidden bg-[#240035] text-white shadow-2xl">
      <div className="flex w-[104px] shrink-0 flex-col items-center bg-[#7a0086] py-3">
        <button
          type="button"
          onClick={() => open('/dashboard')}
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#250039] shadow-[0_0_22px_rgba(223,255,31,0.28)] transition hover:bg-[#360052]"
          aria-label="Ir para o dashboard"
        >
          <img src={logoOwl} alt="Decode Analytics Academy" className="h-10 w-10 object-contain" />
        </button>

        <button
          type="button"
          onClick={() => setMode(isFull ? 'rail' : 'full')}
          className="mb-3 flex h-9 w-[84px] items-center justify-center gap-2 border border-[#ff22ff]/70 bg-[#5b006a] text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-[#6d007f]"
          aria-label={isFull ? 'Recolher menu principal' : 'Expandir menu principal'}
          title={isFull ? 'Recolher menu principal' : 'Expandir menu principal'}
        >
          {isFull ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          {isFull ? 'Menor' : 'Abrir'}
        </button>

        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-1 overflow-y-auto px-2 pb-3">
          {visibleRailItems.map((item) => {
            const active = isRouteActive(location.pathname, location.hash, item.to);
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.to}`}
                type="button"
                onClick={() => open(item.to)}
                className={`group relative flex min-h-12 w-[88px] flex-col items-center justify-center gap-1 border px-1.5 text-center text-[10px] font-bold leading-tight transition
                  ${active ? 'border-[#ff22ff] bg-[#8a0098] text-white shadow-[inset_3px_0_0_#ff22ff]' : 'border-transparent text-white/88 hover:border-[#ff22ff]/80 hover:bg-[#8a0098] hover:text-white'}`}
                title={item.label}
                aria-label={item.label}
              >
                {item.label === 'Notificações' && (
                  <span className="absolute left-8 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">1</span>
                )}
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                <span className="w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isFull && (
        <div className="flex min-w-0 flex-1 flex-col bg-[#3b0056]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <button type="button" onClick={() => open('/dashboard')} className="min-w-0 text-left transition hover:opacity-85">
              <div className="font-display text-[13px] font-extrabold tracking-tight text-white">
                DECODE <span className="text-[#dfff1f]">ANALYTICS</span>
              </div>
              <div className="font-mono-label text-[9px] font-medium uppercase tracking-[0.3em] text-[#dfff1f]">
                Academy
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('hidden')}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#dfff1f]/55 text-[#dfff1f] transition hover:bg-[#dfff1f] hover:text-black"
              aria-label="Esconder menu lateral"
              title="Esconder menu lateral"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                  {group.label}
                </div>
                <div className="space-y-1.5">
                  {group.items.map((it) => {
                    const active = isRouteActive(location.pathname, location.hash, it.to);
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.to}
                        type="button"
                        onClick={() => open(it.to)}
                        className={`group flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-sm font-semibold transition-all
                          ${active
                            ? 'border-[#ff22ff] bg-[#5e006f] text-white shadow-[inset_4px_0_0_#ff22ff]'
                            : 'border-transparent text-white/84 hover:border-[#ff22ff] hover:bg-[#520064] hover:text-white'}`}
                      >
                        <Icon strokeWidth={active ? 2.6 : 2.1} className="h-[19px] w-[19px] shrink-0" />
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {isAdmin && (
              <button
                type="button"
                onClick={() => open('/admin')}
                className={`group flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-sm font-bold transition-all
                  ${location.pathname.startsWith('/admin')
                    ? 'border-[#54f7d2] bg-[#004c56] text-white shadow-[inset_4px_0_0_#54f7d2]'
                    : 'border-transparent text-[#9af5df] hover:border-[#54f7d2] hover:bg-[#17405a]'}`}
              >
                <ShieldCheck strokeWidth={2.5} className="h-[19px] w-[19px] shrink-0" />
                <span className="truncate">Painel Admin</span>
              </button>
            )}
          </nav>

          <div className="m-4 border border-[#dfff1f]/55 bg-[#20012f] p-4">
            <div className="relative">
              <h4 className="text-sm font-bold text-white">Mantenha o foco</h4>
              <p className="mb-3 text-[11px] leading-snug text-white/68">Pequenas metas diárias, grandes conquistas.</p>
              <Button
                size="sm"
                className="h-9 w-full rounded-none bg-[#dfff1f] text-[11px] font-black uppercase text-black hover:bg-[#edff55]"
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
      <button
        type="button"
        onClick={() => setMode('full')}
        className="fixed left-3 top-24 z-50 hidden h-11 items-center gap-2 border border-[#ff22ff]/70 bg-[#3b0056] px-3 text-xs font-black uppercase tracking-wide text-white shadow-2xl shadow-black/30 transition hover:bg-[#5e006f] lg:flex"
        aria-label="Expandir menu lateral"
        title="Expandir menu lateral"
      >
        <PanelLeftOpen className="h-4 w-4 text-[#dfff1f]" />
        Menu
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-[#ff22ff]/35 transition-[width] duration-300 ease-out lg:flex"
      style={{ width: SIDEBAR_WIDTHS[mode] }}
    >
      <SidebarContent mode={mode} setMode={setMode} />
    </aside>
  );
}
