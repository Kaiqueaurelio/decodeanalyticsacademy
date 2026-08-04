import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`Starting complete deletion for user: ${user.id}`);

  try {
    // 2. Call the database function that handles cascading deletions
    // We already have a function `delete_user_completely` in the DB schema
    const { error: rpcError } = await supabaseAdmin.rpc("delete_user_completely", {
      _target_user_id: user.id,
    });

    if (rpcError) {
      console.error(`RPC Error: ${rpcError.message}`);
      throw rpcError;
    }

    // 3. Delete the user from Auth (this is the final step)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error(`Auth Delete Error: ${deleteAuthError.message}`);
      throw deleteAuthError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(`Deletion failed: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
