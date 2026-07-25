import { useRef } from 'react';
import landingBgPoster from '@/assets/landing-bg-poster.jpg';
import { landingBackgroundVideoSources } from '@/data/landing-content';
import { useLandingBackgroundVideo } from '@/hooks/useLandingBackgroundVideo';
import { useAutoplayBackgroundVideo, useVideoReadiness } from './primitives';

/**
 * Full-viewport fixed background: poster image + looping muted video (when the
 * environment allows it) + darkening vignette. Rendered once at the top of the
 * landing page; content lives in a sibling `z-10` layer.
 */
export function LandingBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { sentinelRef, skipVideo, shouldMount } = useLandingBackgroundVideo();
  const { videoReady, videoFailed, markReady, setVideoFailed } = useVideoReadiness();

  const canShowVideo = shouldMount && !skipVideo;
  useAutoplayBackgroundVideo(videoRef, { enabled: canShowVideo && !videoFailed, onReady: markReady });

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
            data-testid="landing-background-video"
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
            onLoadedData={markReady}
            onCanPlay={markReady}
            onError={(event) => {
              // Only flag true failures (unsupported source / decode error).
              // Ignore transient network aborts fired by Chrome during range requests.
              const code = event.currentTarget.error?.code;
              if (code === 3 || code === 4) setVideoFailed(true);
            }}
          >
            <source src={landingBackgroundVideoSources.webm} type="video/webm" />
            <source src={landingBackgroundVideoSources.mp4} type="video/mp4" />
          </video>
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
