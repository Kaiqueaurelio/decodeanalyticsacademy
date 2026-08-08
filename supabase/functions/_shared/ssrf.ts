/**
 * Decode Analytics Academy - Proteção contra SSRF
 * Só permite http(s) para hosts públicos. Bloqueia loopback, RFC1918,
 * link-local/metadata, domínios internos e IPs ofuscados.
 */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;

  const host = u.hostname.toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.home.arpa')) return false;
  if (host === 'metadata.google.internal') return false;

  // IPv6 literais (inclui ::1 e fc00::/7)
  if (host.startsWith('[') || host.includes(':')) return false;

  // Formas numéricas ofuscadas (decimal, octal, hexadecimal)
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return false;
  if (/^0\d/.test(host)) return false;

  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 168 || b === 0)) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a >= 224) return false;
  }
  return true;
}
