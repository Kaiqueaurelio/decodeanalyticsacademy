import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RA_PATTERN = /^[A-Z0-9]{6,13}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRa(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function safeResetRedirect(req: Request, rawRedirectTo: unknown) {
  const origin = req.headers.get("origin");
  if (!origin) return undefined;

  try {
    const redirect = new URL(String(rawRedirectTo ?? ""));
    if (redirect.origin === origin && redirect.pathname === "/reset-password") {
      return redirect.toString();
    }
  } catch {
    // fallback below
  }

  return `${origin}/reset-password`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) {
      return json({ error: "Backend indisponível no momento" }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Dados inválidos" }, 400);
    }

    const action = body.action === "reset" ? "reset" : "login";
    const ra = normalizeRa(body.ra);

    if (!RA_PATTERN.test(ra)) {
      return json({ error: "RA inválido" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("user_id, email, is_blocked")
      .ilike("ra", ra)
      .maybeSingle();

    if (profileError) {
      console.error("ra-auth profile lookup failed", { code: profileError.code });
      return json({ error: "Não foi possível validar o RA agora" }, 500);
    }

    if (!profile) {
      return action === "reset"
        ? json({ ok: true })
        : json({ error: "RA ou senha incorretos" }, 401);
    }

    if (profile.is_blocked) {
      return json({ error: "Conta bloqueada pelo administrador" }, 403);
    }

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.user_id);
    const email = userResult?.user?.email || profile.email;

    if (userError || !email || /@ra\.unip\.local$/i.test(email)) {
      return action === "reset"
        ? json({ ok: true })
        : json({ error: "RA ou senha incorretos" }, 401);
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "reset") {
      const { error } = await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: safeResetRedirect(req, body.redirectTo),
      });

      if (error) {
        console.error("ra-auth reset failed", { status: error.status });
        return json({ error: "Não foi possível enviar a recuperação agora" }, 500);
      }

      return json({ ok: true });
    }

    const password = String(body.password ?? "");
    if (password.length < 6 || password.length > 72) {
      return json({ error: "RA ou senha incorretos" }, 401);
    }

    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data.session?.access_token || !data.session?.refresh_token) {
      return json({ error: "RA ou senha incorretos" }, 401);
    }

    return json({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type,
      },
    });
  } catch (error) {
    console.error("ra-auth unexpected error", error instanceof Error ? error.message : "unknown");
    return json({ error: "Falha ao processar acesso por RA" }, 500);
  }
});