import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") || "mailto:contato@decodeanalytics.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false as const, userId: null };

  const authClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { ok: false as const, userId: null };

  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  return { ok: Boolean(role), userId: data.user.id } as const;
}

async function collectTargetUserIds(input: any): Promise<string[]> {
  if (Array.isArray(input.user_ids) && input.user_ids.length) {
    return [...new Set(input.user_ids.filter((id: unknown) => typeof id === "string"))];
  }
  if (typeof input.user_id === "string" && input.user_id) return [input.user_id];
  if (input.allUsers || input.broadcast) {
    const { data, error } = await admin
      .from("profiles")
      .select("user_id")
      .eq("is_blocked", false);
    if (error) throw error;
    return [...new Set((data || []).map((row: any) => row.user_id).filter(Boolean))];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const guard = await requireAdmin(req);
    if (!guard.ok) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = await req.json();
    const {
      title,
      body,
      link,
      type = "admin_broadcast",
      inAppOnly = false,
    } = input;

    if (!title) {
      return new Response(JSON.stringify({ error: "title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = await collectTargetUserIds(input);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = userIds.map((user_id) => ({
      user_id,
      title,
      body: body || null,
      link: link || "/dashboard",
      type,
    }));

    const { error: insErr } = await admin.from("notifications").insert(notifications);
    if (insErr) throw insErr;

    let pushed = 0;
    let failed = 0;
    let subscriptions = 0;

    if (!inAppOnly) {
      const { data: subs, error: subErr } = await admin
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);
      if (subErr) throw subErr;
      subscriptions = subs?.length || 0;

      const payload = JSON.stringify({
        title,
        body: body || "",
        link: link || "/dashboard",
        type,
        tag: input.tag || "decode-admin-broadcast",
      });

      await Promise.all(
        (subs || []).map(async (s: any) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: s.endpoint,
                keys: { p256dh: s.p256dh, auth: s.auth },
              },
              payload,
            );
            pushed++;
          } catch (err: any) {
            failed++;
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            } else {
              console.error("[send-push] push failed:", err?.statusCode, err?.body);
            }
          }
        }),
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recipients: userIds.length,
        notifications: notifications.length,
        subscriptions,
        pushed,
        failed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[send-push] error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
