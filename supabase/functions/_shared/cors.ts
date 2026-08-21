/**
 * Decode Analytics Academy - CORS Configuration
 * v6.9.5
 *
 * Keep this list explicit. A wildcard for every Lovable subdomain would let an
 * unrelated hosted page make credentialed requests to privileged functions.
 */
const ALLOWED_ORIGINS = new Set([
  'https://decodeanalyticsacademy.lovable.app',
  'https://decodeanalyticsacademy.vercel.app',
  'https://id-preview--4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovable.app',
  'https://decodeanalyticsacademy.com.br',
  'https://www.decodeanalyticsacademy.com.br',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
]);

/**
 * Retorna headers CORS baseados na origem da requisição.
 * Origens não cadastradas não recebem Access-Control-Allow-Origin.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}
