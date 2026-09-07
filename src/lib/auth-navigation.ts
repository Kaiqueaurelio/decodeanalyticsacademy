const AUTH_ENTRY_PATHS = new Set([
  '/login',
  '/reset-password',
  '/esqueci-senha',
  '/oauth/callback',
]);

/** Remove camadas acidentais de `/login?next=...` e mantém só rotas internas. */
export function normalizePostLoginDestination(value: string | null | undefined): string | null {
  let candidate = value?.trim() || null;

  for (let depth = 0; candidate && depth < 6; depth += 1) {
    if (!candidate.startsWith('/') || candidate.startsWith('//')) return null;

    const parsed = new URL(candidate, 'https://decode.local');
    if (parsed.origin !== 'https://decode.local') return null;

    if (parsed.pathname === '/login') {
      candidate = parsed.searchParams.get('next');
      continue;
    }

    if (AUTH_ENTRY_PATHS.has(parsed.pathname)) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  return null;
}

export function buildLoginRedirect(currentLocation: string): string {
  const destination = normalizePostLoginDestination(currentLocation);
  return destination ? `/login?next=${encodeURIComponent(destination)}` : '/login';
}
