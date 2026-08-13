import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const RA_RE = /^[A-Z0-9]{6,13}$/;
const GENERIC_FAIL = "RA ou senha incorretos.";
const SPECIAL_USER = "Juliana";
const SPECIAL_PASS = "Ju@2026";

const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, corsHeaders);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    console.error("ra-auth: env ausente");
    return json({ error: "Serviço indisponível no momento." }, 500, corsHeaders);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400, corsHeaders);
  }

  const ra = String(body.ra ?? "").trim().toUpperCase();
  const rawRa = String(body.ra ?? "").trim();
  const ip = req.headers.get("x-real-ip") || "unknown";
  const password = typeof body.password === "string" ? body.password : "";
  const mode = body.mode === "reset" ? "reset" : body.mode === "signup" ? "signup" : "signin";

  // Check for the special user Juliana
  if ((rawRa === SPECIAL_USER || ra === SPECIAL_USER.toUpperCase()) && mode === "signin") {
    if (password === SPECIAL_PASS) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
      const julianaEmail = "juliana@decode.local";
      
      // Ensure user exists
      const { data: userData, error: userError } = await admin.auth.admin.getUserByEmail(julianaEmail);
      let user = userData?.user;

      if (!user) {
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: julianaEmail,
          password: SPECIAL_PASS,
          email_confirm: true,
          user_metadata: { full_name: "Juliana", account_type: "special", content_scope: "no_enem" }
        });
        if (createErr) {
          console.error("Failed to create Juliana:", createErr);
          return json({ error: "Erro ao inicializar acesso especial." }, 500, corsHeaders);
        }
        user = newUser.user;
      }

      // Ensure profile exists and has correct scope
      await admin.from('profiles').upsert({
        user_id: user.id,
        email: julianaEmail,
        full_name: "Juliana",
        content_scope: "no_enem",
        account_type: "special"
      }, { onConflict: 'user_id' });

      const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data, error } = await authClient.auth.signInWithPassword({
        email: julianaEmail,
        password: SPECIAL_PASS,
      });

      if (error || !data?.session) {
        return json({ error: GENERIC_FAIL }, 401, corsHeaders);
      }

      return json({
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      }, 200, corsHeaders);
    } else {
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // 1. Rate Limiting Persistent (Audit 2026-08)
    const { data: lockout } = await admin.from('auth_attempts')
      .select('*')
      .or(`identifier.eq.${ra},ip_address.eq.${ip}`)
      .gt('locked_until', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (lockout) {
      return json({ 
        error: "Muitas tentativas. Sua conta ou IP estão temporariamente bloqueados por segurança." 
      }, 429, corsHeaders);
    }

    const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : "";

    if (!RA_RE.test(ra)) {
      return json({ error: "Use seu RA com 6 a 13 letras/números." }, 400, corsHeaders);
    }
    
    if (mode === "signin" && (password.length < 6 || password.length > 200)) {
      await registerAttempt(admin, ra, ip, false);
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }

    // Resolve o e-mail do RA sem devolvê-lo ao cliente.
    const { data: email, error: rpcError } = await admin.rpc("get_email_for_ra", { _ra: ra });
    if (rpcError) {
      console.error("ra-auth: falha ao resolver RA", rpcError.message);
      return json({ error: "Não foi possível validar seu RA agora. Tente novamente." }, 503, corsHeaders);
    }
    
    const resolvedEmail = typeof email === "string" && email
      ? email
      : `${ra.toLowerCase()}@ra.unip.local`;

    if (mode === "reset") {
      const { error } = await admin.auth.resetPasswordForEmail(resolvedEmail, {
        redirectTo: redirectTo && /^https?:\/\//.test(redirectTo) ? redirectTo : undefined,
      });
      return json({ ok: true }, 200, corsHeaders);
    }

    // Cadastro por RA: conta criada já confirmada
    if (mode === "signup") {
      const raEmail = `${ra.toLowerCase()}@ra.unip.local`;
      const { error: createErr } = await admin.auth.admin.createUser({
        email: raEmail,
        password,
        email_confirm: true,
        user_metadata: { ra, account_type: "ra", full_name: `Aluno UNIP ${ra}` },
      });
      if (createErr) {
        const msg = createErr.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          return json({ error: "Este RA já está cadastrado. Faça login.", code: "already_registered" }, 409, corsHeaders);
        }
        console.error("ra-auth signup:", createErr.message);
        return json({ error: "Não foi possível criar sua conta agora." }, 500, corsHeaders);
      }

      const signupClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data: sData, error: sErr } = await signupClient.auth.signInWithPassword({ email: raEmail, password });
      
      if (!sErr && sData?.session) {
        await registerAttempt(admin, ra, ip, true);
        // Force sync profiles table just in case metadata exists but profile doesn't
        await admin.from('profiles').upsert({
          user_id: sData.user?.id,
          ra: ra,
          email: raEmail,
          full_name: `Aluno UNIP ${ra}`
        }, { onConflict: 'user_id' });
      } else {
        await registerAttempt(admin, ra, ip, false);
      }

      return json({
        created: true,
        session: sData?.session
          ? { access_token: sData.session.access_token, refresh_token: sData.session.refresh_token }
          : null,
      }, 200, corsHeaders);
    }


    const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error || !data?.session) {
      await registerAttempt(admin, ra, ip, false);
      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        return json({ error: "Verifique seu e-mail antes de acessar.", code: "email_not_confirmed" }, 403, corsHeaders);
      }
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }

    await registerAttempt(admin, ra, ip, true);

    return json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    }, 200, corsHeaders);
  } catch (e) {
    console.error("ra-auth: erro inesperado", e instanceof Error ? e.message : e);
    return json({ error: "Erro inesperado. Tente novamente." }, 500, corsHeaders);
  }
});

async function registerAttempt(admin: any, ra: string, ip: string, success: boolean) {
  try {
    if (success) {
      await admin.from('auth_attempts').delete().eq('identifier', ra);
      await admin.from('auth_attempts').delete().eq('ip_address', ip);
      return;
    }

    const { data: current } = await admin.from('auth_attempts')
      .select('*')
      .or(`identifier.eq.${ra},ip_address.eq.${ip}`)
      .maybeSingle();

    const attempts = (current?.attempts || 0) + 1;
    let lockedUntil = null;
    
    if (attempts >= 5) {
      const lockMinutes = Math.min(60, Math.pow(2, attempts - 5) * 5);
      lockedUntil = new Date(Date.now() + lockMinutes * 60000).toISOString();
    }

    if (current) {
      await admin.from('auth_attempts').update({
        attempts,
        last_attempt: new Date().toISOString(),
        locked_until: lockedUntil
      }).eq('id', current.id);
    } else {
      await admin.from('auth_attempts').insert({
        identifier: ra,
        ip_address: ip,
        attempts,
        last_attempt: new Date().toISOString(),
        locked_until: lockedUntil
      });
    }
  } catch (e) {
    console.error("registerAttempt error", e);
  }
}