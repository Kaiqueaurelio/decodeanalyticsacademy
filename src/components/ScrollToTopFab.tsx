import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopFab() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed z-40 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] right-4 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg backdrop-blur-md flex items-center justify-center transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      } hover:brightness-110 active:scale-95`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
