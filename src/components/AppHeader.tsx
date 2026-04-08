import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, LayoutDashboard, Shield, Menu, ArrowRight } from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = (path: string) => { navigate(path); setOpen(false); };

  return (
    <header className="sticky top-0 z-50 glass-strong">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <img src={logoDark} alt="Decode Analytics" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">Decode Analytics</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1.5">
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

        {/* Mobile nav */}
        <div className="sm:hidden">
          {user ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-12">
                <nav className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start" onClick={() => nav('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="justify-start" onClick={() => nav('/admin')}>
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </Button>
                  )}
                  <Button variant="ghost" className="justify-start text-destructive" onClick={() => { signOut(); setOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')} className="gradient-primary text-primary-foreground text-xs px-3 h-8">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
