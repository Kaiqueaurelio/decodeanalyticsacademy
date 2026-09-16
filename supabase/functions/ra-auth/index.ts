import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const RA_RE = /^[A-Z0-9]{6,13}$/;
const GENERIC_FAIL = "RA ou senha incorretos.";
const ACTIVE_PROJECT_PUBLIC_KEY = "sb_publishable_Zh6H3y8GJ2J_wkRVXxyTng_eylbCAVM";
const ACTIVE_PROJECT_URL = "https://wxkkpjpqyrygglbuogsd.supabase.co";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, corsHeaders);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = ACTIVE_PROJECT_PUBLIC_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("ra-auth: env ausente");
    return json({ error: "Serviço indisponível no momento." }, 500, corsHeaders);
  }
  if (SUPABASE_URL !== ACTIVE_PROJECT_URL) {
    console.error("ra-auth: runtime Supabase inesperado");
    return json({ error: "Serviço de autenticação indisponível." }, 503, corsHeaders);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ error: "Requisição inválida." }, 400, corsHeaders); }

  const raw = String(body.ra ?? "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  const identifier = raw.includes("@")
    ? raw.toLowerCase()
    : raw.replace(/[\s._-]/g, "").toUpperCase();
  const password = typeof body.password === "string" ? body.password : "";
  const mode = body.mode === "reset" ? "reset" : body.mode === "signup" ? "signup" : "signin";
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  if (mode === "signin") {
    try {
      const { data, error } = await admin.rpc("auth_rate_limit_check", {
        _identifier: identifier,
        _ip_address: ip,
      });
      if (!error && data?.allowed === false) {
        const retry = Number(data.retry_after_seconds || 60);
        return json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.", retry_after_seconds: retry }, 429, {
          ...corsHeaders,
          "Retry-After": String(retry),
        });
      }
      if (error) console.error("ra-auth rate limit check:", error.message);
    } catch (e) { console.error("ra-auth rate limit unavailable", e); }
  }

  try {
    if (!identifier || password.length < 6 || password.length > 200) {
      if (mode === "signin") await recordLoginAttempt(admin, identifier || "invalid", ip, false);
      return json({ error: GENERIC_FAIL }, 401, corsHeaders);
    }

    let resolvedEmail: string | null = null;
    let resolvedUserId: string | null = null;

    if (identifier.includes("@")) {
      const { data: byEmail, error: profileError } = await admin
        .from("profiles")
        .select("user_id,email,ra")
        .ilike("email", identifier)
        .maybeSingle();
      if (profileError) {
        console.error("ra-auth profile email lookup:", profileError.message);
        return json({ error: "Não foi possível consultar sua conta agora. Tente novamente." }, 503, corsHeaders);
      }
      if (byEmail?.user_id) {
        resolvedUserId = byEmail.user_id;
        const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(byEmail.user_id);
        if (authUserError) {
          console.error("ra-auth auth user lookup:", authUserError.message);
          return json({ error: "Não foi possível confirmar sua conta agora. Tente novamente." }, 503, corsHeaders);
        }
        resolvedEmail = authUser?.user?.email || null;
        if (!resolvedEmail) {
          console.error("ra-auth auth user lookup returned no email", { user_id: resolvedUserId });
          return json({ error: "Não foi possível confirmar sua conta agora. Tente novamente." }, 503, corsHeaders);
        }
      }
      if (!resolvedEmail) resolvedEmail = identifier;
    } else {
      if (!RA_RE.test(identifier) && !/^[A-Z0-9]{2,50}$/i.test(identifier)) {
        return json({ error: "Identificador inválido (use RA ou e-mail)." }, 400, corsHeaders);
      }
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("user_id,email,ra")
        .eq("ra", identifier)
        .maybeSingle();
      if (profileError) {
        console.error("ra-auth profile RA lookup:", profileError.message);
        return json({ error: "Não foi possível consultar sua conta agora. Tente novamente." }, 503, corsHeaders);
      }
      if (profile?.user_id) {
        resolvedUserId = profile.user_id;
        const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.user_id);
        if (authUserError) {
          console.error("ra-auth auth user lookup:", authUserError.message);
          return json({ error: "Não foi possível confirmar sua conta agora. Tente novamente." }, 503, corsHeaders);
        }
        resolvedEmail = authUser?.user?.email || null;
        if (!resolvedEmail) {
          console.error("ra-auth auth user lookup returned no email", { user_id: resolvedUserId });
          return json({ error: "Não foi possível confirmar sua conta agora. Tente novamente." }, 503, corsHeaders);
        }
      }
      if (!resolvedEmail) resolvedEmail = `${identifier.toLowerCase()}@ra.unip.local`;
    }

    if (mode === "reset") {
      const redirectTo = String(body.redirectTo ?? "");
      const { error } = await admin.auth.resetPasswordForEmail(resolvedEmail, {
        redirectTo: getAllowedRedirect(redirectTo) || undefined,
      });
      if (error) {
        console.error("ra-auth reset:", error.message);
        return json({ error: "Não foi possível enviar o link de recuperação agora." }, 503, corsHeaders);
      }
      return json({ ok: true }, 200, corsHeaders);
    }

    if (mode === "signup") {
      if (identifier.includes("@")) return json({ error: "Para cadastro, informe seu RA." }, 400, corsHeaders);
      const email = `${identifier.toLowerCase()}@ra.unip.local`;
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { ra: identifier, account_type: "ra", full_name: `Aluno Decode ${identifier}` },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
          return json({ error: "Este RA já está cadastrado. Faça login.", code: "already_registered" }, 409, corsHeaders);
        }
        console.error("ra-auth signup:", error.message);
        return json({ error: "Não foi possível criar sua conta agora." }, 500, corsHeaders);
      }
      await admin.from("profiles").upsert({
        user_id: created.user.id,
        ra: identifier,
        email,
        full_name: `Aluno Decode ${identifier}`,
      }, { onConflict: "user_id" });

      const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data: sessionData, error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError || !sessionData?.session) {
        console.error("ra-auth signup signin:", signInError?.message || "session missing");
        return json({ created: true, session: null }, 500, corsHeaders);
      }
      await recordLoginAttempt(admin, identifier, ip, true);
      return json({
        created: true,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
        },
      }, 200, corsHeaders);
    }

    const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error || !data?.session) {
      console.error("ra-auth signin rejected", {
        identifier_type: identifier.includes("@") ? "email" : "ra",
        has_resolved_user: !!resolvedUserId,
        error_code: error?.code || "unknown",
        error_status: error?.status || 0,
      });
      await recordLoginAttempt(admin, identifier, ip, false);
      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        return json({ error: "Verifique seu e-mail antes de acessar.", code: "email_not_confirmed" }, 403, corsHeaders);
      }
      return json({ error: GENERIC_FAIL, code: "invalid_credentials" }, 401, corsHeaders);
    }

    await recordLoginAttempt(admin, identifier, ip, true);
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

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function getAllowedRedirect(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const allowed = new Set([
      "decodeanalyticsacademy.lovable.app",
      "decodeanalyticsacademy.vercel.app",
      "localhost",
      "127.0.0.1",
    ]);
    if (!allowed.has(url.hostname)) return null;
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}

async function recordLoginAttempt(admin: any, identifier: string, ip: string, success: boolean) {
  try {
    const { error } = await admin.rpc("auth_rate_limit_record", {
      _identifier: identifier,
      _ip_address: ip,
      _success: success,
    });
    if (error) console.error("ra-auth rate limit record:", error.message);
    if (!success) {
      const { error: auditError } = await admin.from("audit_logs").insert({
        event_type: "login_failed",
        metadata: { identifier, ip, timestamp: new Date().toISOString() },
      });
      if (auditError) console.error("ra-auth audit log:", auditError.message);
    }
  } catch (e) { console.error("recordLoginAttempt error", e); }
}
