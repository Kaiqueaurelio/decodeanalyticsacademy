import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, PenLine, FileText, MessagesSquare, User, Sheet as SheetIcon, Library, Calculator, ShieldCheck, GraduationCap, MoreHorizontal, Bell, LayoutDashboard, Package, Users, TrendingUp, Globe, BarChart3, Store, LifeBuoy } from 'lucide-react';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

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

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { navigate, open } = useSidebarNavigation(onNavigate);
  const visibleRailItems = railItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="h-full flex overflow-hidden bg-[#2a0040] text-white shadow-2xl">
      <div className="flex w-[76px] shrink-0 flex-col items-center bg-[#660079] py-3">
        <button
          type="button"
          onClick={() => open('/dashboard')}
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#250039] shadow-[0_0_22px_rgba(236,0,255,0.38)] transition hover:bg-[#360052]"
          aria-label="Ir para o dashboard"
        >
          <img src={logoOwl} alt="Decode Analytics Academy" className="h-10 w-10 object-contain" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col items-stretch gap-1 overflow-y-auto px-1.5 pb-3">
          {visibleRailItems.map((item) => {
            const active = isRouteActive(location.pathname, location.hash, item.to);
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.to}`}
                type="button"
                onClick={() => open(item.to)}
                className={`group relative flex h-10 w-[64px] items-center gap-2 rounded-none px-2 text-left text-[11px] font-semibold transition
                  ${active ? 'bg-[#8a0098] text-white ring-2 ring-[#ff22ff]' : 'text-white/85 hover:bg-[#7b008b] hover:text-white'}`}
                title={item.label}
                aria-label={item.label}
              >
                {item.label === 'Notificações' && (
                  <span className="absolute left-5 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">1</span>
                )}
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} />
                <span className="hidden truncate xl:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-[#3b0056]">
        <button
          type="button"
          onClick={() => open('/dashboard')}
          className="border-b border-white/10 px-5 py-5 text-left transition hover:bg-white/5"
        >
          <div className="font-display text-[13px] font-extrabold tracking-tight text-white">
            DECODE <span className="text-[#dfff1f]">ANALYTICS</span>
          </div>
          <div className="font-mono-label text-[9px] font-medium uppercase tracking-[0.3em] text-[#dfff1f]">
            Academy
          </div>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
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
                      className={`group flex w-full items-center gap-3 rounded-none border-2 px-4 py-3 text-left text-sm font-semibold transition-all
                        ${active
                          ? 'border-[#ff22ff] bg-[#5e006f] text-white shadow-[inset_4px_0_0_#ff22ff]'
                          : 'border-transparent text-white/82 hover:border-[#ff22ff] hover:bg-[#520064] hover:text-white'}`}
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
              className={`group flex w-full items-center gap-3 rounded-none border-2 px-4 py-3 text-left text-sm font-bold transition-all
                ${location.pathname.startsWith('/admin')
                  ? 'border-[#54f7d2] bg-[#004c56] text-white shadow-[inset_4px_0_0_#54f7d2]'
                  : 'border-transparent text-[#9af5df] hover:border-[#54f7d2] hover:bg-[#17405a]'}`}
            >
              <ShieldCheck strokeWidth={2.5} className="h-[19px] w-[19px] shrink-0" />
              <span className="truncate">Painel Admin</span>
            </button>
          )}
        </nav>

        <div className="m-4 border border-[#dfff1f]/50 bg-[#20012f] p-4">
          <div className="relative">
            <h4 className="font-bold text-sm text-white">Mantenha o foco</h4>
            <p className="text-[11px] text-white/68 leading-snug mb-3">Pequenas metas diárias, grandes conquistas.</p>
            <Button
              size="sm"
              className="w-full h-9 rounded-none bg-[#dfff1f] text-[11px] font-black uppercase text-black hover:bg-[#edff55]"
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
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[324px] z-40 flex-col border-r border-[#ff22ff]/35">
      <SidebarContent />
    </aside>
  );
}
