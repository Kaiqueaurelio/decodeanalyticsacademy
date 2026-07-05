import { useState, type MouseEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Home, Library, Menu, PenLine } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent } from '@/components/dashboard/StudentSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const mainItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard#apostilas', icon: BookOpen, label: 'Apostilas' },
  { to: '/exercicios', icon: PenLine, label: 'Exercicios' },
  { to: '/cursos', icon: GraduationCap, label: 'Cursos' },
  { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
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
                className="flex min-h-[54px] h-auto flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted/60 hover:text-foreground touch-manipulation"
                aria-label="Abrir menu completo"
              >
                <Menu className="h-[19px] w-[19px]" strokeWidth={2.2} />
                <span>Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[92vw] max-w-[360px] p-0 border-r border-border">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
