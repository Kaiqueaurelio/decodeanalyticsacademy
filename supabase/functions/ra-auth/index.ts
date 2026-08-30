import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

const RA_RE = /^[A-Z0-9]{6,13}$/;
const GENERIC_FAIL = "RA ou senha incorretos.";
const SPECIAL_USER = Deno.env.get("SPECIAL_USER_NAME")?.trim() || "Juliana";
const SPECIAL_PASS = Deno.env.get("SPECIAL_USER_PASSWORD") || "";
const LEGACY_SUPABASE_URL = Deno.env.get("LEGACY_SUPABASE_URL")?.trim()
  || "https://gynguskgysompgcajunc.supabase.co";
const LEGACY_APP_URL = Deno.env.get("LEGACY_APP_URL")?.trim()
  || "https://decodeanalyticsacademy.lovable.app";
let legacyAnonKeyCache = Deno.env.get("LEGACY_SUPABASE_ANON_KEY")?.trim() || "";

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
    let { data, error } = await authClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    // Migração sob demanda: a mudança do Lovable Cloud para este Supabase
    // transferiu conteúdo, mas não as contas do Auth. Se a conta ainda não
    // existe aqui, validamos as mesmas credenciais no projeto anterior e a
    // recriamos localmente com a própria senha informada pelo usuário.
    if (error || !data?.session) {
      const migrated = await migrateLegacyAccount(admin, authClient, ra, password);
      if (migrated?.session) {
        data = migrated;
        error = null;
      }
    }

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

type LegacyProfile = {
  ra?: string | null;
  full_name?: string | null;
  account_type?: string | null;
  content_scope?: string | null;
  is_blocked?: boolean | null;
};

async function migrateLegacyAccount(
  admin: any,
  authClient: any,
  identifier: string,
  password: string,
) {
  try {
    const legacyAnonKey = await getLegacyAnonKey();
    if (!legacyAnonKey) return null;
    const legacyAuthResponse = await fetch(`${LEGACY_SUPABASE_URL}/functions/v1/ra-auth`, {
      method: "POST",
      headers: {
        apikey: legacyAnonKey,
        Authorization: `Bearer ${legacyAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode: "signin", ra: identifier, password }),
    });
    if (!legacyAuthResponse.ok) return null;

    const legacyAuth = await legacyAuthResponse.json();
    const legacyAccessToken = legacyAuth?.session?.access_token;
    if (typeof legacyAccessToken !== "string" || !legacyAccessToken) return null;

    const legacyUserResponse = await fetch(`${LEGACY_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: legacyAnonKey,
        Authorization: `Bearer ${legacyAccessToken}`,
      },
    });
    if (!legacyUserResponse.ok) return null;
    const legacyUser = await legacyUserResponse.json();
    if (!legacyUser?.id) return null;

    const profileUrl = new URL(`${LEGACY_SUPABASE_URL}/rest/v1/profiles`);
    profileUrl.searchParams.set("select", "ra,full_name,account_type,content_scope,is_blocked");
    profileUrl.searchParams.set("user_id", `eq.${legacyUser.id}`);
    profileUrl.searchParams.set("limit", "1");
    const legacyProfileResponse = await fetch(profileUrl, {
      headers: {
        apikey: legacyAnonKey,
        Authorization: `Bearer ${legacyAccessToken}`,
      },
    });
    if (!legacyProfileResponse.ok) return null;
    const legacyProfiles = await legacyProfileResponse.json() as LegacyProfile[];
    const legacyProfile = legacyProfiles[0];
    if (legacyProfile?.is_blocked) return null;

    const migratedRa = typeof legacyProfile?.ra === "string"
      ? legacyProfile.ra.replace(/[\s._-]/g, "").toUpperCase()
      : (!identifier.includes("@") ? identifier : null);
    const activeEmail = migratedRa
      ? `${migratedRa.toLowerCase()}@ra.unip.local`
      : String(legacyUser.email || identifier).trim().toLowerCase();
    if (!activeEmail.includes("@")) return null;

    const fullName = String(
      legacyProfile?.full_name
        || legacyUser.user_metadata?.full_name
        || (migratedRa ? `Aluno Decode ${migratedRa}` : activeEmail.split("@")[0]),
    ).trim();
    const contentScope = ["full", "enem_only", "no_enem"].includes(String(legacyProfile?.content_scope))
      ? String(legacyProfile?.content_scope)
      : "full";

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: activeEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        account_type: migratedRa ? "ra" : "email",
        ...(migratedRa ? { ra: migratedRa } : {}),
        ...(
          migratedRa && typeof legacyUser.email === "string" && !legacyUser.email.endsWith("@ra.unip.local")
            ? { contact_email: legacyUser.email }
            : {}
        ),
        migrated_from_legacy: true,
      },
    });

    if (createError || !created?.user?.id) {
      // Uma tentativa concorrente pode ter concluído a migração primeiro.
      const retry = await authClient.auth.signInWithPassword({ email: activeEmail, password });
      return retry.data?.session ? retry.data : null;
    }

    const newUserId = created.user.id;
    const { error: profileError } = await admin.from("profiles").upsert({
      user_id: newUserId,
      email: activeEmail,
      full_name: fullName,
      ra: migratedRa,
      account_type: migratedRa ? "ra" : "email",
      content_scope: contentScope,
      is_blocked: false,
      login_attempts: 0,
      locked_at: null,
      must_change_password: false,
    }, { onConflict: "user_id" });

    if (profileError) {
      console.error("ra-auth legacy profile migration failed", profileError.code ?? "unknown");
      await admin.auth.admin.deleteUser(newUserId);
      return null;
    }

    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: newUserId,
      role: "user",
    }, { onConflict: "user_id,role" });
    if (roleError) {
      console.error("ra-auth legacy role migration failed", roleError.code ?? "unknown");
    }

    await admin.from("audit_logs").insert({
      user_id: newUserId,
      event_type: "legacy_user_migrated",
      resource_id: legacyUser.id,
      metadata: { account_type: migratedRa ? "ra" : "email" },
    });

    const migratedLogin = await authClient.auth.signInWithPassword({
      email: activeEmail,
      password,
    });
    return migratedLogin.data?.session ? migratedLogin.data : null;
  } catch (migrationError) {
    console.error(
      "ra-auth legacy migration unavailable",
      migrationError instanceof Error ? migrationError.name : "UnknownError",
    );
    return null;
  }
}

async function getLegacyAnonKey(): Promise<string | null> {
  if (legacyAnonKeyCache) return legacyAnonKeyCache;

  try {
    const indexResponse = await fetch(LEGACY_APP_URL);
    if (!indexResponse.ok) return null;
    const html = await indexResponse.text();
    const scriptPaths = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|mjs))(?:\?[^"']*)?["']/gi)]
      .map((match) => match[1]);

    for (const scriptPath of scriptPaths) {
      const scriptUrl = new URL(scriptPath, LEGACY_APP_URL);
      const scriptResponse = await fetch(scriptUrl);
      if (!scriptResponse.ok) continue;
      const source = await scriptResponse.text();
      const candidates = source.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || [];
      for (const candidate of candidates) {
        try {
          const encodedPayload = candidate.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
          const payload = JSON.parse(atob(paddedPayload));
          if (payload?.ref === 'gynguskgysompgcajunc' && payload?.role === 'anon') {
            legacyAnonKeyCache = candidate;
            return candidate;
          }
        } catch {
          // Ignora outros JWTs eventualmente presentes no bundle.
        }
      }
    }
  } catch (error) {
    console.error(
      "ra-auth legacy key discovery unavailable",
      error instanceof Error ? error.name : "UnknownError",
    );
  }
  return null;
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
