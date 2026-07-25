import { useEffect, useRef, useState } from 'react';

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

export type LandingBgTestMode = 'slow' | '2g' | 'reduced' | null;

const TEST_STORAGE_KEY = 'landing-bg-test';

/**
 * Reads `?bgtest=slow|2g|reduced|off` from the URL (or sessionStorage) so QA
 * can force a specific network / motion path without DevTools throttling.
 * Zero cost when no flag is present.
 */
export function getLandingBgTestMode(): LandingBgTestMode {
  if (typeof window === 'undefined') return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('bgtest');
    if (fromUrl === 'off') {
      window.sessionStorage.removeItem(TEST_STORAGE_KEY);
      return null;
    }
    if (fromUrl === 'slow' || fromUrl === '2g' || fromUrl === 'reduced') {
      window.sessionStorage.setItem(TEST_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.sessionStorage.getItem(TEST_STORAGE_KEY);
    if (stored === 'slow' || stored === '2g' || stored === 'reduced') return stored;
  } catch {
    /* sessionStorage may be blocked — safe to ignore */
  }
  return null;
}

/**
 * Reactive descriptor for the landing-page background video.
 * - Picks a resolution tier from the viewport width and network quality.
 * - Skips the video for `save-data`, `2g` connections and `prefers-reduced-motion`.
 * - Lazy-mounts the `<video>` when a sentinel element enters the viewport.
 * - Honors the `?bgtest=…` QA override.
 */
export function useLandingBackgroundVideo() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [skipVideo, setSkipVideo] = useState(false);
  const [shouldMount, setShouldMount] = useState(false);

  // Viewport + connection observer.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const smallScreen = window.matchMedia('(max-width: 640px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const conn = (navigator as { connection?: NetworkInformation }).connection;

    const update = () => {
      const testMode = getLandingBgTestMode();
      if (testMode === '2g' || testMode === 'reduced') {
        setSkipVideo(true);
        return;
      }
      // `slow` keeps the video mounted but caps quality (handled downstream).
      const saveData = !!conn?.saveData;
      const effective = conn?.effectiveType ?? '';
      const slow = /(^|-)2g$/.test(effective);
      setSkipVideo(saveData || slow || reduced.matches);
    };

    update();
    smallScreen.addEventListener?.('change', update);
    reduced.addEventListener?.('change', update);
    conn?.addEventListener?.('change', update);
    return () => {
      smallScreen.removeEventListener?.('change', update);
      reduced.removeEventListener?.('change', update);
      conn?.removeEventListener?.('change', update);
    };
  }, []);

  // Lazy-mount the <video> when the top of the page is (about to be) visible.
  useEffect(() => {
    if (skipVideo) {
      setShouldMount(false);
      return;
    }
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const id = window.setTimeout(() => setShouldMount(true), 800);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [skipVideo]);

  return { sentinelRef, skipVideo, shouldMount };
}
