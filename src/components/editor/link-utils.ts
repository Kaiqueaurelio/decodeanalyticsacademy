/**
 * Validação de URL para o editor (links).
 * Aceita http(s), mailto, tel e caminhos absolutos do app (/algo).
 */
export function isValidUrl(raw: string): boolean {
  if (!raw) return false;
  const v = raw.trim();
  if (v.startsWith('/')) return true;
  if (/^(mailto:|tel:)/i.test(v)) return v.length > (v.startsWith('mailto:') ? 7 : 4);
  try {
    const u = new URL(v.includes('://') ? v : `https://${v}`);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (v.startsWith('/') || /^(mailto:|tel:|https?:)/i.test(v)) return v;
  return `https://${v}`;
}
