import { useCallback, useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { Reveal } from '@/components/Reveal';

/** Wraps children in the shared IntersectionObserver-based Reveal animation. */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Delay in seconds. */
  delay?: number;
}) {
  return (
    <Reveal from="bottom" distance={48} delay={delay * 1000} className={className}>
      {children}
    </Reveal>
  );
}

/** Parallax translate on Y based on scroll progress through the viewport. */
export function ParallaxBlock({
  children,
  speed = 0.3,
  className = '',
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/** Large blurred color orb used as ambient background lighting. */
export function GlowOrb({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} style={style} />;
}

/** Faint cyan grid overlay used behind hero sections. */
export function CyberGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

/** Bootstraps playback on the background video (mute, load, play, resume on visibility). */
export function useAutoplayBackgroundVideo(
  ref: React.RefObject<HTMLVideoElement>,
  { enabled, onReady }: { enabled: boolean; onReady: () => void },
) {
  useEffect(() => {
    if (!enabled) return;
    const video = ref.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    try {
      video.load();
    } catch {
      /* noop */
    }

    const start = () => {
      onReady();
      void video.play().catch(() => {});
    };
    start();
    video.addEventListener('canplay', start);
    video.addEventListener('loadeddata', start);
    const onVisible = () => {
      if (document.visibilityState === 'visible') start();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      video.removeEventListener('canplay', start);
      video.removeEventListener('loadeddata', start);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, onReady, ref]);
}

/** Convenience state helper for `videoReady` / `videoFailed`. */
export function useVideoReadiness() {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const markReady = useCallback(() => {
    setVideoReady(true);
    setVideoFailed(false);
  }, []);
  return { videoReady, videoFailed, markReady, setVideoFailed };
}
