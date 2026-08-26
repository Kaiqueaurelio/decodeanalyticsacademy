import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const RA_RE = /^[A-Z0-9]{6,13}$/;
const GENERIC_FAIL = "RA ou senha incorretos.";
const SPECIAL_USER = Deno.env.get("SPECIAL_USER_NAME")?.trim() || "Juliana";
const SPECIAL_PASS = Deno.env.get("SPECIAL_USER_PASSWORD") || "";

const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  // Hardening: Verify JWT for specific maintenance actions if needed, 
  // but for login we only allow POST with strict validation
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

  const rawRa = String(body.ra ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const ra = rawRa.includes('@') ? rawRa.toLowerCase() : rawRa.replace(/[\s._-]/g, "").toUpperCase();
  const ip = req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const password = typeof body.password === "string" ? body.password : "";
  const mode = body.mode === "reset" ? "reset" : body.mode === "signup" ? "signup" : "signin";
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  if (mode === "signin") {
    const { data: rateLimit, error: rateLimitError } = await admin.rpc("auth_rate_limit_check", {
      _identifier: ra,
      _ip_address: ip,
    });
    if (rateLimitError) {
      // A autenticação não pode ficar indisponível apenas porque a RPC opcional
      // de rate limiting ainda não foi aplicada no projeto remoto. Registramos
      // o erro para diagnóstico e seguimos com o bloqueio de credenciais no
      // Supabase Auth; quando a RPC existir, o bloqueio persistente continua ativo.
      console.error("ra-auth rate limit check:", rateLimitError.message);
    }
    if (!rateLimitError && rateLimit?.allowed === false) {
      const retryAfter = Number(rateLimit.retry_after_seconds || 60);
      return new Response(JSON.stringify({
        error: "Muitas tentativas. Sua conta ou IP estão temporariamente bloqueados por segurança.",
        retry_after_seconds: retryAfter,
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }
  }

  // Check for the special user Juliana
  if (SPECIAL_PASS && (rawRa === SPECIAL_USER || ra === SPECIAL_USER.toUpperCase()) && mode === "signin") {
    if (password === SPECIAL_PASS) {
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
        await recordLoginAttempt(admin, ra, ip, false);
        return json({ error: GENERIC_FAIL }, 401, corsHeaders);
      }

      await recordLoginAttempt(admin, ra, ip, true);
      return json({
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      }, 200, corsHeaders);
    } else {
      await recordLoginAttempt(admin, ra, ip, false);
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }
  }

  try {
    const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : "";

    if (!RA_RE.test(ra)) {
      // Identificadores conhecidos que não seguem o padrão RA padrão (ex: G802144 ou e-mail decoanalytics)
      const isKnownSpecial = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(ra) || 
                            /^[A-Z0-9]{2,50}$/i.test(ra) ||
                            ra.toLowerCase() === "juliana";
      
      if (!isKnownSpecial) {
        console.warn(`[ra-auth] Identificador não compatível com regex RA: ${ra}`);
        if (mode === "signin") await recordLoginAttempt(admin, ra || "invalid", ip, false);
        return json({ error: "Identificador inválido (use RA ou e-mail)." }, 400, corsHeaders);
      }
    }


    
    if (mode === "signin" && (password.length < 6 || password.length > 200)) {
      await recordLoginAttempt(admin, ra, ip, false);
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }

    // Resolve o e-mail do RA sem devolvê-lo ao cliente.
    // Try both RPC and direct query to profiles for robustness
    let resolvedEmail: string | null = null;
    
    // Prioridade 1: Busca por RA exato no perfil
    const { data: profileByRa } = await admin.from('profiles').select('email').eq('ra', ra).maybeSingle();
    if (profileByRa?.email) {
      resolvedEmail = profileByRa.email;
    } else {
      // Prioridade 2: Se 'ra' já for um e-mail válido, usa ele diretamente
      if (/@/.test(ra)) {
        resolvedEmail = ra.toLowerCase();
      } else {
        // Prioridade 3: RPC de resolução legado
        const { data: rpcEmail, error: rpcError } = await admin.rpc("get_email_for_ra", { _ra: ra });
        if (!rpcError && typeof rpcEmail === "string") {
          resolvedEmail = rpcEmail;
        }
      }
    }
    
    if (!resolvedEmail) {
      resolvedEmail = `${ra.toLowerCase()}@ra.unip.local`;
    }

    if (mode === "reset") {
      const safeRedirectTo = getAllowedRedirect(redirectTo);
      const { error } = await admin.auth.resetPasswordForEmail(resolvedEmail, {
        redirectTo: safeRedirectTo || undefined,
      });
      if (error) {
        const errorText = error.message?.toLowerCase() ?? '';
        if (errorText.includes('rate limit') || errorText.includes('too many')) {
          return json({
            error: 'O limite de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.',
            code: 'email_rate_limit_exceeded',
            retry_after_seconds: 60,
          }, 429, { ...corsHeaders, 'Retry-After': '60' });
        }
        console.error('ra-auth reset:', error.message);
        return json({ error: 'Não foi possível enviar o link de recuperação agora.' }, 503, corsHeaders);
      }
      return json({ ok: true }, 200, corsHeaders);
    }

    // Cadastro por RA: conta criada já confirmada
    if (mode === "signup") {
      const raEmail = `${ra.toLowerCase()}@ra.unip.local`;
      const { error: createErr } = await admin.auth.admin.createUser({
        email: raEmail,
        password,
        email_confirm: true,
        user_metadata: { ra, account_type: "ra", full_name: `Aluno Decode ${ra}` },
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
        await recordLoginAttempt(admin, ra, ip, true);
        // Force sync profiles table just in case metadata exists but profile doesn't
        await admin.from('profiles').upsert({
          user_id: sData.user?.id,
          ra: ra,
          email: raEmail,
          full_name: `Aluno Decode ${ra}`
        }, { onConflict: 'user_id' });
      } else {
        await recordLoginAttempt(admin, ra, ip, false);
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
      await recordLoginAttempt(admin, ra, ip, false);
      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        return json({ error: "Verifique seu e-mail antes de acessar.", code: "email_not_confirmed" }, 403, corsHeaders);
      }
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }

    await recordLoginAttempt(admin, ra, ip, true);

    // AUTO-PROMOÇÃO ADMIN: Se for o usuário principal, garante acesso total
    if (resolvedEmail?.toLowerCase() === 'decoanalytics@outlook.com.br') {
      try {
        const userId = data.user.id;
        
        // 1. Garante Role Admin
        await admin.from('user_roles').upsert({ 
          user_id: userId, 
          role: 'admin' 
        }, { onConflict: 'user_id,role' });

        // 2. Garante Account Type Admin
        await admin.from('profiles').upsert({
          user_id: userId,
          email: resolvedEmail,
          account_type: 'admin'
        }, { onConflict: 'user_id' });
        
        console.log(`[ra-auth] Admin auto-promoted: ${resolvedEmail}`);
      } catch (adminErr) {
        console.error("[ra-auth] Failed to auto-promote admin:", adminErr);
      }
    }

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

function getAllowedRedirect(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const allowedHosts = new Set([
      "decodeanalyticsacademy.lovable.app",
      "decodeanalyticsacademy.vercel.app",
      "localhost",
      "127.0.0.1",
    ]);
    if (!allowedHosts.has(url.hostname)) return null;
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function recordLoginAttempt(admin: any, ra: string, ip: string, success: boolean) {
  try {
    const { error } = await admin.rpc("auth_rate_limit_record", {
      _identifier: ra,
      _ip_address: ip,
      _success: success,
    });
    if (error) console.error("ra-auth rate limit record:", error.message);

    if (!success) {
      const { error: auditError } = await admin.from('audit_logs').insert({
        event_type: 'login_failed',
        metadata: { ra, ip, timestamp: new Date().toISOString() },
      });
      if (auditError) console.error("ra-auth audit log:", auditError.message);
    }
  } catch (e) {
    console.error("recordLoginAttempt error", e);
  }
}