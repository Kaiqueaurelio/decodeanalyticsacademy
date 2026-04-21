import { useRef, useState, useEffect, ReactNode, Children } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileCarouselProps {
  children: ReactNode;
  className?: string;
  desktopClassName?: string;
}

export function MobileCarousel({ children, className = '', desktopClassName = 'space-y-4' }: MobileCarouselProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const childArray = Children.toArray(children);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isMobile) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const childWidth = el.firstElementChild?.getBoundingClientRect().width || 1;
      const index = Math.round(scrollLeft / childWidth);
      setActiveIndex(Math.min(index, childArray.length - 1));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isMobile, childArray.length]);

  if (!isMobile) {
    return <div className={desktopClassName}>{children}</div>;
  }

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 -mx-3 px-3"
      >
        {childArray.map((child, i) => (
          <div key={i} className="min-w-[88%] max-w-[88%] snap-start flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
      {childArray.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {childArray.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
              onClick={() => {
                scrollRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
