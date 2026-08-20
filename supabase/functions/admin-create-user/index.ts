import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireUser } from '../_shared/auth-guard.ts';

// Edge Function: admin-create-user
// Permite que um administrador cadastre alunos manualmente (por RA ou e-mail).
// Contas criadas aqui já nascem confirmadas — o admin é a fonte de verdade.

const RA_RE = /^[A-Z0-9]{6,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const auth = await requireUser(req, corsHeaders, { requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: 'Serviço indisponível no momento.' }, 503);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Requisição inválida.' }, 400);
    }

    const identifier = String(body?.identifier ?? '').trim();
    const password = String(body?.password ?? '');
    const fullName = String(body?.full_name ?? '').trim();
    const contentScope = body?.content_scope === 'enem_only' ? 'enem_only' : 'full';
    const makeAdmin = body?.make_admin === true;

    if (!identifier) return json({ error: 'Informe o RA ou o e-mail do aluno.' }, 400);
    if (password.length < 6 || password.length > 72) {
      return json({ error: 'A senha deve ter entre 6 e 72 caracteres.' }, 400);
    }

    const isEmail = identifier.includes('@');
    const ra = identifier.toUpperCase();
    if (!isEmail && !RA_RE.test(ra)) {
      return json({ error: 'RA inválido: use 6 a 13 letras/números.' }, 400);
    }
    if (isEmail && !EMAIL_RE.test(identifier)) {
      return json({ error: 'E-mail inválido.' }, 400);
    }

    const email = isEmail ? identifier.toLowerCase() : `${ra.toLowerCase()}@ra.unip.local`;
    const name = fullName || (isEmail ? email.split('@')[0] : `Aluno Decode ${ra}`);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: isEmail
        ? { full_name: name, account_type: 'email' }
        : { ra, account_type: 'ra', full_name: name },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return json({ error: 'Já existe uma conta com esse RA/e-mail.' }, 409);
      }
      console.error('admin-create-user createUser failed', { code: createErr.code, message: createErr.message });
      return json({ error: 'Não foi possível criar a conta.' }, 500);
    }

    const newUserId = created?.user?.id;
    if (newUserId) {
      const { error: profileErr } = await admin.from('profiles').upsert({
        user_id: newUserId,
        email,
        full_name: name,
        content_scope: contentScope,
        is_blocked: false,
      } as any, { onConflict: 'user_id' });
      if (profileErr) console.warn('admin-create-user profile upsert failed', { code: profileErr.code });

      const { error: roleErr } = await admin.from('user_roles').upsert({
        user_id: newUserId,
        role: makeAdmin ? 'admin' : 'user',
      } as any, { onConflict: 'user_id,role' });
      if (roleErr) console.warn('admin-create-user role upsert failed', { code: roleErr.code });
    }

    return json({ ok: true, user_id: newUserId, email });
  } catch (error) {
    console.error('admin-create-user failed', error);
    return json({ error: 'Não foi possível concluir a criação da conta.' }, 500);
  }
});
