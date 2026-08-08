import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

/**
 * Decode Analytics Academy - CORS Configuration
 * v3.82.0
 */
const ALLOWED_ORIGINS = [
  'https://decodeanalyticsacademy.lovable.app',
  'https://id-preview--4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovable.app', // Preview atual
  'http://localhost:8080',
  'http://localhost:5173',
];

/**
 * Retorna os headers CORS baseados na origem da requisição.
 * Se a origem não estiver na allowlist, não retorna Access-Control-Allow-Origin.
 */
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin');
  const headers = { ...corsHeaders };
  
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app'))) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // Default deny for non-matched origins
    delete headers['Access-Control-Allow-Origin'];
  }
  
  return headers;
}
