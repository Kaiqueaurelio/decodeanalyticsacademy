import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Home, BookOpen, ClipboardList, PenLine, FileText, GraduationCap, Library, 
  Layers, RotateCcw, Trophy, NotebookPen, BriefcaseBusiness, Newspaper, 
  Calculator, CalendarRange, Activity, HelpCircle, MessagesSquare, User, 
  Heart, LogOut, LayoutDashboard, CheckSquare, ShieldCheck, ChevronsLeft,
  Search, Terminal, Cpu, ChevronsRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { GlitchText } from '@/components/login/GlitchText';
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
      { to: '/plano-de-estudos', icon: NotebookPen, label: 'Plano' },
    ],
  },
  {
    label: 'Networking',
    items: [
      { to: '/vagas', icon: BriefcaseBusiness, label: 'Vagas & Estágios' },
      { to: '/noticias', icon: Newspaper, label: 'News Tech' },
      { to: '/eventos', icon: CalendarRange, label: 'Eventos' },
    ],
  },
];

export function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut, user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);
  const prefersReducedMotion = useReducedMotion();

  const isActive = (to: string) => {
    const [path, hash] = to.split('#');
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    return location.pathname === path;
  };

  const handleNav = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] text-white border-r border-white/5 relative overflow-hidden font-mono">
      {/* Background Cyber Effects */}
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-cyan-500/30" />
      
      {/* Header */}
      <div className="p-4 relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-sm transition-[padding] duration-300">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center relative group overflow-hidden">
            <img src={logoOwl} alt="Logo" className="w-6 h-6 relative z-10 brightness-110" />
          </div>
          <div className={collapsed ? 'hidden' : 'flex flex-col'}>
            <span className="text-xs font-black tracking-tighter text-white">DECODE ACADEMY</span>
            <span className="text-[7px] text-cyan-500/50 tracking-[0.2em] uppercase font-mono">STATUS: AUTHORIZED</span>
          </div>
        </div>
      </div>

      {/* Search Protocol */}
      {!collapsed && (
        <div className="px-4 py-4 relative z-10">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-500/40" />
            <input
              type="text"
              placeholder="[BUSCAR DISCIPLINA]"
              className="w-full bg-black/40 border border-white/5 rounded-md py-2 pl-9 pr-3 text-[10px] text-cyan-100 placeholder:text-cyan-500/20 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all uppercase tracking-widest"
            />
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-6 relative z-10 scrollbar-none">
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, height: 'auto' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={prefersReducedMotion ? undefined : { duration: 0.18 }}
                  className="px-3 flex items-center gap-2 mb-2 overflow-hidden"
                >
                  <span className="text-[9px] font-bold text-cyan-500/40 uppercase tracking-[0.3em]">{group.label}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
            {group.items.map((item) => {
              const active = isActive(item.to);
              return (
                <motion.button
                  key={item.to}
                  type="button"
                  onClick={() => handleNav(item.to)}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  whileHover={prefersReducedMotion ? undefined : { x: 2 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={prefersReducedMotion ? undefined : { duration: 0.15 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-[color,background-color,transform,box-shadow] duration-200 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${collapsed ? 'justify-center' : ''} ${
                    active ? 'cyber-button-active text-cyan-400' : 'text-gray-500 hover:text-cyan-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-cyan-400' : 'text-gray-600'}`} />
                  <span className={collapsed ? 'sr-only' : 'text-[11px] font-bold uppercase tracking-wider'}>{item.label}</span>
                  {active && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute right-2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]" 
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}

        {isAdmin && (
          <div className="pt-4 space-y-1">
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, height: 'auto' }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={prefersReducedMotion ? undefined : { duration: 0.18 }}
                  className="px-3 flex items-center gap-2 mb-2 overflow-hidden"
                >
                  <span className="text-[9px] font-bold text-purple-500/40 uppercase tracking-[0.3em]">System Admin</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => handleNav('/admin')}
              title={collapsed ? 'Terminal Root' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-purple-400 hover:bg-purple-500/5 transition-[color,background-color,transform,box-shadow] duration-200 group border border-purple-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.98] ${collapsed ? 'justify-center' : ''}`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className={collapsed ? 'sr-only' : 'text-[11px] font-bold uppercase tracking-wider text-purple-300'}>Terminal Root</span>
            </button>
          </div>
        )}
      </nav>

      {/* Pomodoro Timer */}
      <PomodoroWidget collapsed={collapsed} />

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-black/40 relative z-10">
        <div className={`flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[10px] font-black text-cyan-400">
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className={collapsed ? 'hidden' : 'flex-1 min-w-0'}>
            <p className="text-[10px] font-bold text-white truncate uppercase tracking-tighter">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-[8px] text-cyan-500/60 font-mono uppercase tracking-[0.1em]">Access Level: 4</p>
          </div>
          <button onClick={() => signOut()} title="Sair" aria-label="Sair" className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
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
      className={`fixed inset-y-0 left-0 z-30 hidden lg:flex overflow-visible transition-[width] duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-72'}`}
    >
      <SidebarContent collapsed={collapsed} />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onToggle}
        aria-label={collapsed ? 'Expandir menu de navegação' : 'Recolher menu de navegação'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-20 z-40 hidden h-8 w-8 rounded-full border-primary/40 bg-background/95 shadow-lg shadow-primary/10 transition-[transform,box-shadow,background-color] duration-200 motion-safe:hover:scale-105 motion-safe:hover:shadow-primary/20 motion-safe:active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/50 lg:inline-flex"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </Button>
    </aside>
  );
}
