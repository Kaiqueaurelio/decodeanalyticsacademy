// RA Login — resolves RA to email server-side and signs in.
// Never returns email/PII. Rate-limited per IP.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// In-memory sliding window rate limit (per warm instance).
// 5 tentativas / minuto e 20 / hora por IP.
const attempts = new Map<string, number[]>();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function rateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const arr = (attempts.get(ip) ?? []).filter((t) => now - t < HOUR);
  arr.push(now);
  attempts.set(ip, arr);
  const lastMinute = arr.filter((t) => now - t < MINUTE).length;
  if (lastMinute > 5) return { limited: true, retryAfter: 60 };
  if (arr.length > 20) return { limited: true, retryAfter: 3600 };
  return { limited: false };
}

const RA_RE = /^[A-Z0-9]{6,13}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '0.0.0.0').split(',')[0].trim();
  const rl = rateLimited(ip);
  if (rl.limited) {
    console.warn(`[ra-login] rate-limit hit ip=${ip}`);
    return new Response(JSON.stringify({ success: false, error: 'rate_limited' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) },
    });
  }

  let body: { ra?: unknown; password?: unknown };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const raRaw = typeof body.ra === 'string' ? body.ra.trim().toUpperCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!RA_RE.test(raRaw) || password.length < 6 || password.length > 200) {
    return new Response(JSON.stringify({ success: false }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: email, error: rpcErr } = await admin.rpc('get_email_for_ra', { _ra: raRaw });

  // Determine effective email — real email if cadastrado, senão pseudo-email
  const effectiveEmail = (typeof email === 'string' && email)
    ? email
    : `${raRaw.toLowerCase()}@ra.unip.local`;

  if (rpcErr) console.error('[ra-login] rpc error', rpcErr.message);

  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: authData, error: authErr } = await anon.auth.signInWithPassword({
    email: effectiveEmail, password,
  });

  if (authErr || !authData.session) {
    // Resposta genérica — não vaza se RA existe nem se senha está errada
    return new Response(JSON.stringify({ success: false, error: 'invalid_credentials' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    },
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
