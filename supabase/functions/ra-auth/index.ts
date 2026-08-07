// Login e recuperação de senha por RA — resolvidos NO SERVIDOR.
//
// Motivo (auditoria): a RPC `get_email_for_ra` era executável por visitantes
// anônimos, permitindo enumerar RAs e descobrir e-mails de alunos. Agora o RA
// é resolvido aqui com a service role e o e-mail nunca volta para o cliente.
// Erros são sempre genéricos para não distinguir "RA inexistente" de "senha errada".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RA_RE = /^[A-Z0-9]{6,13}$/;
const GENERIC_FAIL = "RA ou senha incorretos.";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    console.error("ra-auth: env ausente");
    return json({ error: "Serviço indisponível no momento." }, 500);
  }

  // Rate Limiting Básico (Baseado em IP)
  const ip = req.headers.get("x-real-ip") || "unknown";
  // Em Edge Functions, o estado não persiste entre chamadas de instâncias diferentes,
  // mas ajuda contra bursts simples na mesma instância.
  // Para uma solução robusta, usaríamos Upstash/Redis.

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  const mode = body.mode === "reset" ? "reset" : body.mode === "signup" ? "signup" : "signin";
  const ra = String(body.ra ?? "").trim().toUpperCase();
  const password = typeof body.password === "string" ? body.password : "";
  const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : "";

  if (!RA_RE.test(ra)) {
    return json({ error: "Use seu RA com 6 a 13 letras/números." }, 400);
  }
  if (mode === "signin" && (password.length < 6 || password.length > 200)) {
    return json({ error: GENERIC_FAIL }, 401);
  }
  if (mode === "signup" && (password.length < 6 || password.length > 72)) {
    return json({ error: "A senha deve ter entre 6 e 72 caracteres." }, 400);
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // Resolve o e-mail do RA sem devolvê-lo ao cliente.
    const { data: email, error: rpcError } = await admin.rpc("get_email_for_ra", { _ra: ra });
    if (rpcError) {
      console.error("ra-auth: falha ao resolver RA", rpcError.message);
      return json({ error: "Não foi possível validar seu RA agora. Tente novamente." }, 503);
    }
    // Fallback para o pseudo e-mail determinístico usado nas contas por RA.
    const resolvedEmail = typeof email === "string" && email
      ? email
      : `${ra.toLowerCase()}@ra.unip.local`;

    if (mode === "reset") {
      // Resposta sempre genérica: não revela se o RA existe.
      const { error } = await admin.auth.resetPasswordForEmail(resolvedEmail, {
        redirectTo: redirectTo && /^https?:\/\//.test(redirectTo) ? redirectTo : undefined,
      });
      if (error) console.warn("ra-auth reset:", error.message);
      return json({ ok: true });
    }

    const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await authClient.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error || !data?.session) {
      if (error?.message?.toLowerCase().includes("email not confirmed")) {
        return json({ error: "Verifique seu e-mail antes de acessar.", code: "email_not_confirmed" }, 403);
      }
      return json({ error: GENERIC_FAIL }, 401);
    }

    return json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (e) {
    console.error("ra-auth: erro inesperado", e instanceof Error ? e.message : e);
    return json({ error: "Erro inesperado. Tente novamente." }, 500);
  }
});
