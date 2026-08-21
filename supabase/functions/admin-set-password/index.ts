import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

type JsonRecord = Record<string, unknown>;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonResponse(body: JsonRecord, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, {
      ...corsHeaders,
      Allow: "POST, OPTIONS",
    });
  }

  const auth = await requireUser(req, corsHeaders, { requireAdmin: true });
  if (!auth.ok) return auth.response;

  let body: JsonRecord;
  try {
    const parsed: unknown = await req.json();
    body = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as JsonRecord
      : {};
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400, corsHeaders);
  }

  const targetUserId = typeof body.target_user_id === "string" ? body.target_user_id.trim() : "";
  const newPassword = typeof body.new_password === "string" ? body.new_password : "";
  if (!UUID_RE.test(targetUserId) || newPassword.length < 8 || newPassword.length > 72) {
    return jsonResponse({ error: "Dados de senha inválidos" }, 400, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Admin password update is not configured");
    return jsonResponse({ error: "Operação indisponível" }, 503, corsHeaders);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });
    if (updateError) throw new Error("Password update failed");

    const { error: profileError } = await admin
      .from("profiles")
      .update({ login_attempts: 0, is_blocked: false, locked_at: null })
      .eq("user_id", targetUserId);
    if (profileError) {
      console.error("Admin password profile reset failed", profileError.code ?? "unknown");
    }

    const { error: auditError } = await admin.from("audit_logs").insert({
      user_id: auth.userId,
      event_type: "admin_password_reset",
      resource_id: targetUserId,
      metadata: { target_user_id: targetUserId },
    });
    if (auditError) {
      console.error("Admin password audit failed", auditError.code ?? "unknown");
    }

    return jsonResponse({ ok: true }, 200, corsHeaders);
  } catch (error) {
    console.error(
      "Admin password update failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return jsonResponse({ error: "Não foi possível atualizar a senha." }, 500, corsHeaders);
  }
});
