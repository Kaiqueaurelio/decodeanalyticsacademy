import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  ArrowLeft, 
  Sun, 
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminNavPanel } from '@/components/admin/AdminNavPanel';
import { useTheme } from '@/hooks/useTheme';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';

interface AdminSidebarProps {
  tab: any;
  setTab: (t: any) => void;
  stats: {
    apostilas: number;
    exercises: number;
    materials: number;
    users: number;
  };
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {theme === 'dark' ? 'Modo Claro' : 'Modo Noturno'}
    </Button>
  );
}

export function AdminSidebar({ 
  tab, 
  setTab, 
  stats, 
  sidebarOpen, 
  setSidebarOpen 
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { openCount: securityOpenCount } = useSecurityAlerts({ enabled: true });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-[min(260px,85vw)] bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-primary p-2.5 hover:ring-2 hover:ring-primary/50 transition-all active:scale-95"
                title="Voltar para a Área do Aluno"
              >
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
                <p className="text-[10px] text-muted-foreground">Decode Analytics Academy</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <AdminNavPanel
          tab={tab}
          onSelect={(id) => { setTab(id); setSidebarOpen(false); }}
          counts={{
            apostilas: stats.apostilas,
            exercises: stats.exercises,
            materials: stats.materials,
            users: stats.users,
            securityAlerts: securityOpenCount,
          }}
        />

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <ThemeToggleButton />
          <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar à Área do Aluno
          </Button>
        </div>
      </aside>
    </>
  );
}
