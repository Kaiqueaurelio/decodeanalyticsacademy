import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, ClipboardList, PenLine, FileText, GraduationCap, Library, 
  Layers, RotateCcw, Trophy, NotebookPen, BriefcaseBusiness, Newspaper, 
  Calculator, CalendarRange, Activity, HelpCircle, MessagesSquare, User, 
  Heart, LogOut, LayoutDashboard, CheckSquare, ShieldCheck, ChevronsLeft,
  Search, Terminal, Cpu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import logoOwl from '@/assets/owl-icon.png';
import { Button } from '@/components/ui/button';
import { GlitchText } from './GlitchText';

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
      { to: '/exercicios', icon: PenLine, label: 'Exercícios' },
      { to: '/simulado', icon: Trophy, label: 'Simulado' },
      { to: '/plano-de-estudos', icon: NotebookPen, label: 'Plano' },
    ],
  },
  {
    label: 'Networking',
    items: [
      { to: '/vagas', icon: BriefcaseBusiness, label: 'Vagas & Estágios' },
      { to: '/noticias', icon: Newspaper, label: 'News Tech' },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, signOut, user } = useAuth();
  const { data: profile } = useUserProfile(user?.id);

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
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      
      {/* Header */}
      <div className="p-6 relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />
            <img src={logoOwl} alt="Logo" className="w-7 h-7 relative z-10 brightness-110" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-white">DECODE ACADEMY</span>
            <span className="text-[8px] text-cyan-500/60 tracking-[0.2em] uppercase">Auth: Authorized</span>
          </div>
        </div>
      </div>

      {/* Search Protocol */}
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

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 relative z-10 scrollbar-none">
        {menuGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold text-cyan-500/40 uppercase tracking-[0.3em]">{group.label}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
            </div>
            {group.items.map((item) => {
              const active = isActive(item.to);
              return (
                <button
                  key={item.to}
                  onClick={() => handleNav(item.to)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative overflow-hidden ${
                    active ? 'cyber-button-active text-cyan-400' : 'text-gray-500 hover:text-cyan-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-cyan-400' : 'text-gray-600'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                  {active && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute right-2 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {isAdmin && (
          <div className="pt-4 space-y-1">
            <div className="px-3 flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold text-purple-500/40 uppercase tracking-[0.3em]">System Admin</span>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
            </div>
            <button
              onClick={() => handleNav('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-purple-400 hover:bg-purple-500/5 transition-all group border border-purple-500/10"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Terminal Root</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-black/40 relative z-10">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            {profile?.full_name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white truncate uppercase tracking-tighter">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-[8px] text-cyan-500/60 font-mono uppercase tracking-[0.1em]">Access Level: 4</p>
          </div>
          <button onClick={() => signOut()} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentSidebar() {
  return null; // A sidebar é agora controlada pelo Topbar/Sheet no DashboardPage
}
