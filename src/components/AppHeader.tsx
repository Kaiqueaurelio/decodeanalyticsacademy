import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, LayoutDashboard, Shield, Menu, ArrowRight, Sun, Moon, User, Users, Camera, BookOpen, Library } from 'lucide-react';
import logoDark from '@/assets/logo-dark.jpeg';
import { useMentionNotifications } from '@/hooks/useMentionNotifications';
import { NotificationBell } from '@/components/NotificationBell';

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { unreadCount } = useMentionNotifications();
  const badge = unreadCount > 9 ? '9+' : String(unreadCount);
  const showAdmin = isAdmin;

  const nav = (path: string) => { navigate(path); setOpen(false); };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl" style={{ borderBottom: '1px solid hsl(0 0% 100% / 0.06)' }}>
      <div className="w-full max-w-screen-xl mx-auto flex h-14 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 min-w-0 flex-shrink">
          <img src={logoDark} alt="Decode Analytics" className="h-7 w-7 rounded object-cover flex-shrink-0" />
          <span className="font-mono-label text-[11px] sm:text-xs font-medium uppercase tracking-widest text-foreground truncate hidden xs:inline">Decode Analytics</span>
          <span className="font-mono-label text-[11px] font-medium uppercase tracking-widest text-foreground inline xs:hidden">Decode</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user && <NotificationBell />}
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" /> Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/biblioteca')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Biblioteca
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/livros')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                <Library className="mr-1.5 h-3.5 w-3.5" /> Livros
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tira-duvida')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                <Camera className="mr-1.5 h-3.5 w-3.5" /> Tira-dúvida
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/comunidade')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal relative bg-primary/10 hover:bg-primary/20 text-primary">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Comunidade
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-mono font-bold text-primary-foreground flex items-center justify-center leading-none">
                    {badge}
                  </span>
                )}
              </Button>
              {showAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="text-xs h-8 px-3 text-muted-foreground font-sans normal-case tracking-normal">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sair
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')} className="h-8 px-4 text-[11px]">
              Entrar <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          )}
        </nav>

        <div className="sm:hidden flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user && <NotificationBell />}
          {user ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[78vw] max-w-xs pt-10 bg-card">
                <nav className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal relative" onClick={() => nav('/comunidade')}>
                    <Users className="mr-2 h-4 w-4" /> Comunidade
                    {unreadCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-4 px-1 rounded-full bg-primary text-[10px] font-mono font-bold text-primary-foreground flex items-center justify-center leading-none">
                        {badge}
                      </span>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/biblioteca')}>
                    <BookOpen className="mr-2 h-4 w-4" /> Biblioteca
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/livros')}>
                    <Library className="mr-2 h-4 w-4" /> Livros
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/tira-duvida')}>
                    <Camera className="mr-2 h-4 w-4" /> Tira-dúvida
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </Button>
                  {showAdmin && (
                    <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/admin')}>
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="justify-start text-sm text-destructive font-sans normal-case tracking-normal" onClick={() => { signOut(); setOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')} className="h-7 px-3 text-[10px]">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
