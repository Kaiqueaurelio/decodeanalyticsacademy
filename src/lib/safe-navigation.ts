const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function getSafeNavigationUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const url = new URL(rawUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function openSafeExternalUrl(rawUrl: string | null | undefined): boolean {
  const safeUrl = getSafeNavigationUrl(rawUrl);
  if (!safeUrl || typeof window === 'undefined') return false;

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
}
