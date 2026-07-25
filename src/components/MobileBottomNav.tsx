import { useState, type MouseEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BookOpen, GraduationCap, Home, Library, Menu, PenLine, Trophy } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent } from '@/components/dashboard/StudentSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/queries/useUserProfile';
import { cn } from '@/lib/utils';

type NavItem = { to: string; icon: any; label: string };

const fullItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard#apostilas', icon: BookOpen, label: 'Apostilas' },
  { to: '/exercicios', icon: PenLine, label: 'Exercicios' },
  { to: '/cursos', icon: GraduationCap, label: 'Cursos' },
  { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
];

const enemItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard#apostilas', icon: BookOpen, label: 'Apostilas' },
  { to: '/exercicios', icon: PenLine, label: 'Exercicios' },
  { to: '/simulado', icon: Trophy, label: 'Simulado' },
  { to: '/performance', icon: Activity, label: 'Desempenho' },
];


function isItemActive(pathname: string, hash: string, to: string) {
  const [path, targetHash] = to.split('#');
  if (targetHash) return pathname === path && hash === `#${targetHash}`;
  return pathname === path;
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const { data: profile } = useUserProfile(user?.id);
  const isEnemOnly = profile?.content_scope === 'enem_only';
  const mainItems = isEnemOnly ? enemItems : fullItems;

  // Não exibir na landing, login, reset-password e termos (rotas públicas)
  const hiddenRoutes = ['/', '/login', '/reset-password', '/termos'];
  if (!user) return null;
  if (hiddenRoutes.includes(location.pathname)) return null;

  const handleNavigate = (to: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const [path, hash] = to.split('#');
    if (!hash) return;

    event.preventDefault();
    navigate(to);

    window.setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, location.pathname === path ? 40 : 180);
  };

  return (
    <>
      <div aria-hidden className="h-24 md:hidden" />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_45px_-30px_hsl(var(--foreground)/0.35)] backdrop-blur-xl md:hidden"
        aria-label="Navegacao principal mobile"
      >
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
          {mainItems.map((item) => {
            const active = isItemActive(location.pathname, location.hash, item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavigate(item.to)}
                className={cn(
                  'flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold leading-none transition-colors touch-manipulation',
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <item.icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.6 : 2.2} />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            );
          })}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="relative flex min-h-[54px] h-auto flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted/60 hover:text-foreground touch-manipulation"
                aria-label={unreadCount > 0 ? `Abrir menu completo — ${unreadCount} notificações não lidas` : 'Abrir menu completo'}
              >
                <div className="relative">
                  <Menu className="h-[19px] w-[19px]" strokeWidth={2.2} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[92vw] max-w-[360px] p-0 border-r border-border">
              <SidebarContent onNavigate={() => setOpen(false)} hideBottomNavDuplicates />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
