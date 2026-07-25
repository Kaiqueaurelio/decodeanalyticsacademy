// Shared auth guard for edge functions.
// Validates the caller's Supabase JWT; optionally enforces the `admin` role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export interface AuthOk {
  ok: true;
  userId: string;
}
export interface AuthFail {
  ok: false;
  response: Response;
}

export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
  opts: { requireAdmin?: boolean } = {},
): Promise<AuthOk | AuthFail> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error } = await userClient.auth.getUser();
    if (error || !userData?.user) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        ),
      };
    }
    const userId = userData.user.id;

    if (opts.requireAdmin) {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE || SUPABASE_ANON_KEY);
      const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        return {
          ok: false,
          response: new Response(
            JSON.stringify({ error: "Forbidden: admin only" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          ),
        };
      }
    }

    return { ok: true, userId };
  } catch (e) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
}
