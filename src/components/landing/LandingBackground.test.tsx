import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingBackground } from './LandingBackground';

// Immediate IO so the video lazy-mounts synchronously.
class ImmediateIO {
  constructor(cb: IntersectionObserverCallback) {
    queueMicrotask(() =>
      cb(
        [{ isIntersecting: true, target: document.createElement('div') } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    );
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [] as IntersectionObserverEntry[];
  }
  root = null;
  rootMargin = '';
  thresholds = [] as number[];
}

function setSearch(qs: string) {
  window.history.replaceState({}, '', `/${qs}`);
}

function setConnection(value: { effectiveType?: string; saveData?: boolean } | undefined) {
  Object.defineProperty(navigator, 'connection', { value, configurable: true });
}

describe('LandingBackground QA test modes', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', ImmediateIO);
    window.sessionStorage.clear();
    setSearch('');
    setConnection(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    setSearch('');
  });

  it('mounts the video on the low tier by default', async () => {
    render(<LandingBackground />);
    await act(async () => {
      await Promise.resolve();
    });
    const video = await screen.findByTestId('landing-background-video');
    expect(video.getAttribute('data-tier')).toBe('low');
  });

  it('?bgtest=slow keeps the video mounted but never upgrades to high', async () => {
    vi.useFakeTimers();
    setSearch('?bgtest=slow');
    render(<LandingBackground />);
    await act(async () => {
      await Promise.resolve();
    });
    const video = screen.getByTestId('landing-background-video') as HTMLVideoElement;
    expect(video.getAttribute('data-tier')).toBe('low');

    // Fire canplay + wait past the 1.5s upgrade window.
    await act(async () => {
      video.dispatchEvent(new Event('canplay'));
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(screen.getByTestId('landing-background-video').getAttribute('data-tier')).toBe('low');
  });

  it('?bgtest=2g skips the video entirely and shows only the poster', async () => {
    setSearch('?bgtest=2g');
    render(<LandingBackground />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId('landing-background-video')).toBeNull();
    expect(screen.getByTestId('landing-background')).toBeInTheDocument();
  });

  it('?bgtest=reduced skips the video (motion-reduced path)', async () => {
    setSearch('?bgtest=reduced');
    render(<LandingBackground />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId('landing-background-video')).toBeNull();
  });
});
