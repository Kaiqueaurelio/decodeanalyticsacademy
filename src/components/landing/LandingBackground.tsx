import { useCallback, useEffect, useRef, useState } from 'react';
import landingBgPoster from '@/assets/landing-bg-poster.jpg';
import { landingBackgroundVideoSources, type LandingVideoTier } from '@/data/landing-content';
import { getLandingBgTestMode, useLandingBackgroundVideo } from '@/hooks/useLandingBackgroundVideo';
import { logVideoTelemetry } from '@/lib/landing-video-telemetry';
import { useVideoReadiness } from './primitives';

/**
 * Full-viewport fixed background: poster image + looping muted video (when the
 * environment allows it) + darkening vignette.
 *
 * Loads a lightweight 480p variant first for fast paint, then upgrades to the
 * full-resolution source when playback is stable and the network permits.
 * Falls back down the tier ladder on decode/network errors; only shows the
 * poster when every tier fails.
 */
export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sentinelRef, skipVideo, shouldMount } = useLandingBackgroundVideo();
  const { videoReady, videoFailed, markReady, setVideoFailed } = useVideoReadiness();

  const [tier, setTier] = useState<LandingVideoTier>('low');
  const [triedHigh, setTriedHigh] = useState(false);
  const loadStartRef = useRef<number | null>(null);
  const stableSinceRef = useRef<number | null>(null);
  const upgradeTimerRef = useRef<number | null>(null);

  const canShowVideo = shouldMount && !skipVideo;
  const currentSrc = tier === 'high' ? landingBackgroundVideoSources.mp4 : landingBackgroundVideoSources.low;

  // (Re)load the video whenever the src changes.
  useEffect(() => {
    if (!canShowVideo) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    loadStartRef.current = performance.now();
    stableSinceRef.current = null;
    try {
      video.load();
    } catch {
      /* noop */
    }
    void video.play()?.catch?.(() => {});
    logVideoTelemetry('loadstart', video, { tier });

    return () => {
      if (upgradeTimerRef.current) {
        window.clearTimeout(upgradeTimerRef.current);
        upgradeTimerRef.current = null;
      }
    };
  }, [canShowVideo, currentSrc, tier]);

  // Auto-resume when the tab becomes visible again.
  useEffect(() => {
    if (!canShowVideo) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void videoRef.current?.play()?.catch?.(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [canShowVideo]);

  const scheduleUpgrade = useCallback(() => {
    if (tier !== 'low' || triedHigh) return;
    if (upgradeTimerRef.current) return;

    if (getLandingBgTestMode() === 'slow') return; // QA override: stay on low tier
    const conn = (navigator as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    const effective = conn?.effectiveType ?? '';
    const okNetwork = !conn || (!conn.saveData && (effective === '' || effective === '4g'));
    if (!okNetwork) return;

    stableSinceRef.current = performance.now();
    upgradeTimerRef.current = window.setTimeout(() => {
      upgradeTimerRef.current = null;
      if (stableSinceRef.current && performance.now() - stableSinceRef.current >= 1400) {
        setTriedHigh(true);
        setTier('high');
        logVideoTelemetry('upgrade→high', videoRef.current, { tier: 'high' });
      }
    }, 1500);
  }, [tier, triedHigh]);

  const handleReady = useCallback(() => {
    markReady();
    const started = loadStartRef.current;
    const loadDurationMs = started != null ? Math.round(performance.now() - started) : undefined;
    logVideoTelemetry('canplay', videoRef.current, { tier, loadDurationMs });
    scheduleUpgrade();
  }, [markReady, scheduleUpgrade, tier]);

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const code = event.currentTarget.error?.code;
      if (code !== 3 && code !== 4) return; // transient network aborts — ignore

      logVideoTelemetry('error', event.currentTarget, { tier });

      if (tier === 'high') {
        // Fall back to the lightweight tier and keep playing.
        setTier('low');
        return;
      }
      // Low tier failed → surface the poster.
      setVideoFailed(true);
    },
    [setVideoFailed, tier],
  );

  const handleStalled = useCallback(() => {
    stableSinceRef.current = null;
    logVideoTelemetry('stalled', videoRef.current, { tier });
  }, [tier]);

  const posterVisible = !videoReady || videoFailed;

  return (
    <>
      {/* Sentinel used by the IntersectionObserver in useLandingBackgroundVideo. */}
      <div ref={sentinelRef} aria-hidden="true" className="absolute left-0 top-0 h-1 w-1 opacity-0" />

      <div
        data-testid="landing-background"
        aria-hidden="true"
        className="landing-background-layer pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{ contain: 'paint' }}
      >
        <img
          src={landingBgPoster}
          alt=""
          aria-hidden="true"
          decoding="async"
          {...({ fetchpriority: 'high' } as Record<string, string>)}
          className={`landing-bg-media absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            posterVisible ? 'opacity-90' : 'opacity-0'
          }`}
        />

        {canShowVideo && (
          <video
            key={tier}
            data-testid="landing-background-video"
            data-tier={tier}
            ref={videoRef}
            className={`landing-bg-media landing-bg-video absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              videoReady && !videoFailed ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={landingBgPoster}
            src={currentSrc}
            onLoadedData={handleReady}
            onCanPlay={handleReady}
            onStalled={handleStalled}
            onWaiting={handleStalled}
            onError={handleError}
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(5,5,8,0.25) 0%, rgba(5,5,8,0.45) 60%, rgba(5,5,8,0.7) 100%), linear-gradient(180deg, rgba(5,5,8,0.35) 0%, rgba(5,5,8,0.25) 40%, rgba(5,5,8,0.6) 100%)',
          }}
        />
      </div>
    </>
  );
}
