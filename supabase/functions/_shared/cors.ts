/**
 * Decode Analytics Academy - CORS Configuration
 * v6.9.4
 */
const ALLOWED_ORIGINS = [
  'https://decodeanalyticsacademy.lovable.app',
  'https://decodeanalyticsacademy.vercel.app',
  'https://id-preview--4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovable.app',
  'https://decodeanalyticsacademy.com.br',
  'https://www.decodeanalyticsacademy.com.br',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
];

const ALLOWED_PREVIEW_SUFFIXES = [
  '.lovable.app',
  '.lovableproject.com',
  '.lovableproject-dev.com',
];

/**
 * Retorna os headers CORS baseados na origem da requisição.
 * Se a origem não estiver na allowlist, não retorna Access-Control-Allow-Origin.
 */
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  let hostname = '';
  try {
    hostname = origin ? new URL(origin).hostname.toLowerCase() : '';
  } catch {
    hostname = '';
  }

  const isAllowedPreview = ALLOWED_PREVIEW_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (origin && (ALLOWED_ORIGINS.includes(origin) || isAllowedPreview || isLocal)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
