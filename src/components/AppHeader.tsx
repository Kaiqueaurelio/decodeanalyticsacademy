import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogOut, LayoutDashboard, Shield, Menu, ArrowRight, Sun, Moon, User, Users, Camera, BookOpen, Library, Calculator } from 'lucide-react';
import logoDark from '@/assets/owl-icon.png';
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-2.5 sm:px-4 lg:px-6">
        <Link to={user ? '/dashboard' : '/'} className="group relative flex min-w-0 max-w-[calc(100vw-8.5rem)] flex-shrink items-center gap-2.5 sm:max-w-none sm:gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 sm:h-11 sm:w-11">
            <img 
              src={logoDark} 
              alt="Logo da coruja" 
              className="relative h-full w-full object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.55)] transition-all duration-500 group-hover:scale-105" 
            />
          </div>
          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate font-display text-[14px] font-extrabold tracking-tight text-foreground">
              DECODE <span className="text-primary tracking-tighter">ANALYTICS</span>
            </span>
            <span className="truncate font-mono-label text-[10px] font-medium uppercase tracking-[0.3em] text-primary/80">
              Academy
            </span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" aria-label="Modo claro">
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/calculadora')} className="text-xs h-8 px-3 font-sans normal-case tracking-normal">
                <Calculator className="mr-1.5 h-3.5 w-3.5" /> Calculadora
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

        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-11 w-11 shrink-0 rounded-md" aria-label="Modo claro">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user && <NotificationBell />}
          {user ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-md" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
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
                  <Button variant="ghost" size="sm" className="justify-start text-sm font-sans normal-case tracking-normal" onClick={() => nav('/calculadora')}>
                    <Calculator className="mr-2 h-4 w-4" /> Calculadora de Médias
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
            <Button size="sm" onClick={() => navigate('/login')} className="h-10 min-w-[72px] px-4 text-xs">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
