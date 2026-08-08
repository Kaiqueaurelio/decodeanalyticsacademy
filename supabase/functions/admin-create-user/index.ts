import { getCorsHeaders } from "../_shared/cors.ts";
// Edge Function: admin-create-user
// Permite que um administrador cadastre alunos manualmente (por RA ou e-mail).
// Contas criadas aqui já nascem confirmadas — o admin é a fonte de verdade.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });

const RA_RE = /^[A-Z0-9]{6,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: getCorsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Sessão ausente.' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Sessão inválida.' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (roleErr || !isAdmin) return json({ error: 'Acesso restrito a administradores.' }, 403);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'Requisição inválida.' }, 400); }

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
    const name = fullName || (isEmail ? email.split('@')[0] : `Aluno UNIP ${ra}`);

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
      console.error('admin-create-user:', createErr.message);
      return json({ error: createErr.message }, 500);
    }

    const newUserId = created?.user?.id;
    if (newUserId) {
      // O trigger de signup normalmente cria o profile; garantimos os campos extras.
      try {
        await admin.from('profiles').upsert({
          user_id: newUserId,
          email,
          full_name: name,
          content_scope: contentScope,
          is_blocked: false,
        } as any, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('admin-create-user: profile upsert falhou', e);
      }

      try {
        await admin.from('user_roles').insert({
          user_id: newUserId,
          role: makeAdmin ? 'admin' : 'user',
        } as any);
      } catch { /* já existe */ }
    }

    return json({ ok: true, user_id: newUserId, email });
  } catch (e) {
    console.error('admin-create-user erro:', e);
    return json({ error: (e as Error).message }, 500);
  }
});
