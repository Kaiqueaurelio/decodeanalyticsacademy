const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RA_RE = /^[A-Z0-9]{6,13}$/;

export function normalizeIdentifier(value: string): string {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

export function normalizeRa(value: string): string {
  return normalizeIdentifier(value).replace(/[\s._-]/g, '').toUpperCase();
}

export function isEmailIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value);
  // Se for um dos e-mails administrativos, não tratamos como "e-mail comum" para forçar o fluxo ra-auth
  if (isSpecialIdentifier(normalized)) return false;
  return normalized.includes('@') && !normalized.toLowerCase().endsWith('@ra.unip.local');
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(normalizeIdentifier(value));
}

export function isValidRa(value: string): boolean {
  return RA_RE.test(normalizeRa(value));
}

export function buildRaEmail(value: string): string {
  return `${normalizeRa(value).toLowerCase()}@ra.unip.local`;
}

export function isSpecialIdentifier(value: string): boolean {
  const normalized = normalizeIdentifier(value).toLowerCase();
  return normalized === 'juliana' || normalized === 'decoanalytics@outlook.com.br' || normalized === 'decianalytics@outlook.com.br' || normalized === 'g802144';
}
