import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const email = 'decoanalytics@outlook.com.br';
  const ra = 'G802144';
  const userId = '1ea75282-cc92-49a2-92a2-4c54344a6d43';

  const results = [];

  try {
    // 1. Confirm email
    const { error: authErr } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    results.push({ action: "confirm_email", success: !authErr, error: authErr });

    // 2. Clear attempts
    const { error: delErr } = await admin.from('auth_attempts').delete().or(`identifier.eq.${ra},identifier.eq.${email}`);
    results.push({ action: "clear_attempts", success: !delErr, error: delErr });

    // 3. Update profile
    const { error: profErr } = await admin.from('profiles').update({ ra, account_type: 'admin' }).eq('user_id', userId);
    results.push({ action: "update_profile", success: !profErr, error: profErr });

    // 4. Update role
    const { error: roleErr } = await admin.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id, role' });
    results.push({ action: "update_role", success: !roleErr, error: roleErr });

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
