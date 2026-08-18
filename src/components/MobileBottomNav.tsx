import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Search, Settings2, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type MenuItem = {
  id: 'home' | 'messages' | 'profile' | 'settings' | 'search';
  label: string;
  icon: typeof Home;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'search', label: 'Search', icon: Search },
];

function routeToMenuItem(pathname: string, hash: string): MenuItem['id'] {
  if (pathname.startsWith('/comunidade') || pathname.startsWith('/community')) return 'messages';
  if (pathname.startsWith('/profile') || pathname.startsWith('/perfil')) return 'profile';
  if (pathname.startsWith('/plano-de-estudos') || pathname.startsWith('/horarios')) return 'settings';
  if (pathname === '/dashboard' && hash === '#minhas-disciplinas') return 'search';
  return 'home';
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const barRef = useRef<HTMLDivElement>(null);
  const initialActiveId = routeToMenuItem(location.pathname, location.hash);
  const activeIdRef = useRef<MenuItem['id']>(initialActiveId);
  const [activeId, setActiveId] = useState<MenuItem['id']>(initialActiveId);
  const [isDragging, setIsDragging] = useState(false);

  const setActiveSelection = (id: MenuItem['id']) => {
    activeIdRef.current = id;
    setActiveId(id);
  };

  const hiddenRoutes = ['/', '/login', '/reset-password', '/termos'];
  const activeIndex = Math.max(0, MENU_ITEMS.findIndex((item) => item.id === activeId));
  const activeItem = MENU_ITEMS[activeIndex] ?? MENU_ITEMS[0];
  const ActiveIcon = activeItem.icon;
  const beadPosition = `${((activeIndex + 0.5) / MENU_ITEMS.length) * 100}%`;

  useEffect(() => {
    setActiveSelection(routeToMenuItem(location.pathname, location.hash));
  }, [location.pathname, location.hash]);

  const announceSelection = (item: MenuItem) => {
    setActiveSelection(item.id);
    if (item.id === 'home') {
      navigate('/dashboard');
      return;
    }
    if (item.id === 'messages') {
      navigate('/comunidade');
      return;
    }
    if (item.id === 'profile') {
      navigate('/profile');
      return;
    }
    if (item.id === 'settings') {
      navigate('/plano-de-estudos');
      return;
    }
    navigate('/dashboard#minhas-disciplinas');
    window.setTimeout(() => {
      const searchInput = document.querySelector('input[aria-label="Buscar disciplina ou apostila"]') as HTMLInputElement | null;
      searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput?.focus();
    }, location.pathname === '/dashboard' ? 80 : 220);
  };

  const selectByPointer = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const index = Math.max(0, Math.min(MENU_ITEMS.length - 1, Math.floor((relativeX / rect.width) * MENU_ITEMS.length)));
    setActiveSelection(MENU_ITEMS[index].id);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    selectByPointer(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    selectByPointer(event.clientX);
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const item = MENU_ITEMS[Math.max(0, MENU_ITEMS.findIndex((candidate) => candidate.id === activeIdRef.current))];
    announceSelection(item);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % MENU_ITEMS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = MENU_ITEMS.length - 1;
    if (nextIndex === index) return;
    event.preventDefault();
    const item = MENU_ITEMS[nextIndex];
    setActiveSelection(item.id);
    document.getElementById(`mobile-meniscus-tab-${item.id}`)?.focus();
    announceSelection(item);
  };

  if (!user || hiddenRoutes.includes(location.pathname)) return null;

  return (
    <>
      <div aria-hidden className="h-24 md:hidden" />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 bg-[#0b0f0d]/92 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
        aria-label="Navegação principal mobile"
      >
        <div
          ref={barRef}
          role="tablist"
          aria-label="Meniscus — navegação principal"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          className={cn(
            'relative mx-auto flex h-[76px] w-full max-w-[430px] touch-none items-end justify-between overflow-visible rounded-[38px] border border-white/10 bg-[#242228]/95 px-2 pb-2 pt-4 shadow-[0_-12px_45px_rgba(0,0,0,0.3),0_0_26px_rgba(201,255,45,0.05)]',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-1px] h-[34px] w-[76px] rounded-[50%] bg-[#0b0f0d] shadow-[0_-12px_22px_rgba(201,255,45,0.13)] transition-[left] duration-300 ease-out"
            style={{ left: beadPosition, transform: 'translateX(-50%)' }}
          />
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute -top-[17px] z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#c9ff2d] bg-[#c9ff2d] text-[#11160f] shadow-[0_0_20px_rgba(201,255,45,0.55),0_0_42px_rgba(201,255,45,0.18)] transition-[left] duration-300 ease-out',
              isDragging && 'duration-75'
            )}
            style={{ left: beadPosition, transform: 'translateX(-50%)' }}
          >
            <ActiveIcon className="h-5 w-5" strokeWidth={2.5} />
          </div>

          {MENU_ITEMS.map((item, index) => {
            const active = activeId === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`mobile-meniscus-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                tabIndex={active ? 0 : -1}
                onClick={() => announceSelection(item)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  'relative z-10 flex min-h-[54px] w-1/5 flex-col items-center justify-end gap-1 rounded-2xl px-1 pb-1 text-[9px] font-semibold leading-none outline-none transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-[#c9ff2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f0d]',
                  active ? 'text-[#c9ff2d]' : 'text-white/55 hover:text-white/90'
                )}
              >
                <Icon className={cn('h-[19px] w-[19px] transition-opacity', active ? 'opacity-0' : 'opacity-100')} strokeWidth={active ? 2.6 : 2.1} aria-hidden="true" />
                <span className={cn('transition-all duration-300', active ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mx-auto mt-2 max-w-[430px] text-center font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">Tap a tab — or drag the bead along the bar.</p>
      </nav>
    </>
  );
}
