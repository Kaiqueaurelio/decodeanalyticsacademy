import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. Get user from token to verify identity
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
    authHeader.replace("Bearer ", "")
  );

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  console.log(`Starting complete deletion for user: ${user.id}`);

  try {
    // 2. Call the database function that handles cascading deletions
    const { error: rpcError } = await supabaseAdmin.rpc("delete_user_completely", {
      _target_user_id: user.id,
    });

    if (rpcError) {
      console.error(`RPC Error: ${rpcError.message}`);
      throw rpcError;
    }

    // 2.5 Log the audit event for compliance
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'logout', // Usando logout como proxy se 'delete_account' não estiver no enum
      ip_address: req.headers.get("x-forwarded-for") || null
    });

    // 3. Delete the user from Auth (this is the final step)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error(`Auth Delete Error: ${deleteAuthError.message}`);
      throw deleteAuthError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`Deletion failed: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
