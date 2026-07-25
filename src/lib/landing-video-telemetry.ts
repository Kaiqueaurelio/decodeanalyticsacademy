/**
 * Dev-only diagnostics for the landing-page background video.
 * No network, no persistence — just a console trail + a live snapshot on
 * `window.__landingBgDiag` so mobile remote-debug sessions can inspect it.
 */
import type { LandingVideoTier } from '@/data/landing-content';

export interface LandingVideoDiag {
  event: string;
  tier: LandingVideoTier;
  readyState?: number;
  networkState?: number;
  errorCode?: number;
  errorMessage?: string;
  currentSrc?: string;
  loadDurationMs?: number;
  effectiveType?: string;
  saveData?: boolean;
  at: number;
}

declare global {
  interface Window {
    __landingBgDiag?: LandingVideoDiag;
  }
}

const isDev = import.meta.env.DEV;

export function logVideoTelemetry(
  event: string,
  video: HTMLVideoElement | null,
  extra: { tier: LandingVideoTier; loadDurationMs?: number },
) {
  if (!isDev || typeof window === 'undefined') return;

  const conn = (navigator as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  const snapshot: LandingVideoDiag = {
    event,
    tier: extra.tier,
    readyState: video?.readyState,
    networkState: video?.networkState,
    errorCode: video?.error?.code,
    errorMessage: video?.error?.message,
    currentSrc: video?.currentSrc,
    loadDurationMs: extra.loadDurationMs,
    effectiveType: conn?.effectiveType,
    saveData: conn?.saveData,
    at: Math.round(performance.now()),
  };

  window.__landingBgDiag = snapshot;
  // eslint-disable-next-line no-console
  console.debug('[landing-bg]', event, snapshot);
}
