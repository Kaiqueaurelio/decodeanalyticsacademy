import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Shield } from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3">
          <img src={logoDark} alt="Decode Analytics" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold tracking-tight text-foreground">Decode Analytics</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="mr-1.5 h-4 w-4" /> Dashboard
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="mr-1.5 h-4 w-4" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sair
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')} className="gradient-primary text-primary-foreground">
              Entrar
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
