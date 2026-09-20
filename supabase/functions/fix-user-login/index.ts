import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

/**
 * One-off maintenance endpoint retained for backwards-compatible deployment.
 * It is disabled by default and cannot be invoked without an authenticated admin.
 */
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireUser(req, corsHeaders, { requireAdmin: true });
  if (!auth.ok) return auth.response;

  if (Deno.env.get("ENABLE_FIX_USER_LOGIN") !== "true") {
    return new Response(JSON.stringify({ error: "Endpoint de manutenção desabilitado." }), {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Serviço indisponível no momento." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const email = Deno.env.get("FIX_USER_LOGIN_EMAIL")?.trim() || "";
  const ra = Deno.env.get("FIX_USER_LOGIN_RA")?.trim() || "";
  if (!email || !ra) {
    return new Response(JSON.stringify({ error: "Dados de manutenção não configurados." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = "1ea75282-cc92-49a2-92a2-4c54344a6d43";
  const results: Array<{ action: string; success: boolean; error?: { code?: string; message: string } | null }> = [];

  try {
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    results.push({
      action: "confirm_email",
      success: !authErr,
      error: authErr ? { code: authErr.code, message: authErr.message } : null,
    });

    const { error: delErr } = await admin.from("auth_attempts").delete().or(`identifier.eq.${ra},identifier.eq.${email}`);
    results.push({
      action: "clear_attempts",
      success: !delErr,
      error: delErr ? { code: delErr.code, message: delErr.message } : null,
    });

    const { error: profErr } = await admin.from("profiles").update({ ra, account_type: "admin" }).eq("user_id", userId);
    results.push({
      action: "update_profile",
      success: !profErr,
      error: profErr ? { code: profErr.code, message: profErr.message } : null,
    });

    const { error: roleErr } = await admin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id, role" });
    results.push({
      action: "update_role",
      success: !roleErr,
      error: roleErr ? { code: roleErr.code, message: roleErr.message } : null,
    });

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fix-user-login failed", error);
    return new Response(JSON.stringify({ ok: false, error: "Falha na manutenção de login." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
