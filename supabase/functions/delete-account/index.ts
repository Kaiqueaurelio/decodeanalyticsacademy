import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

type JsonRecord = Record<string, unknown>;

function jsonResponse(
  body: JsonRecord,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
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

  const auth = await requireUser(req, corsHeaders);
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

  if (body.confirmation !== "EXCLUIR") {
    return jsonResponse({ error: "Confirmation required" }, 400, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Account deletion is not configured");
    return jsonResponse({ error: "Account deletion unavailable" }, 503, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { error: rpcError } = await supabaseAdmin.rpc("delete_user_completely", {
      _target_user_id: auth.userId,
    });
    if (rpcError) throw new Error("Account data deletion failed");

    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      user_id: auth.userId,
      event_type: "delete_account",
      resource_id: auth.userId,
      metadata: { initiated_via: "self_service" },
    });
    if (auditError) {
      console.error("Account deletion audit failed", auditError.code ?? "unknown");
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(auth.userId);
    if (deleteAuthError) throw new Error("Account deletion failed");

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (error) {
    console.error(
      "Account deletion failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return jsonResponse({ error: "Não foi possível excluir a conta. Tente novamente." }, 500, corsHeaders);
  }
});
