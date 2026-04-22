// Edge function: envia uma Web Push notification para todos os subscriptions de um user_id
// (e cria também a notificação in-app na tabela `notifications`).
//
// Requisitos: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...) configurados.
//
// POST body:
// {
//   user_id: string,        // destinatário
//   title: string,
//   body?: string,
//   link?: string,
//   type?: string,
//   inAppOnly?: boolean,    // se true, só cria notification (sem push)
// }
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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, title, body, link, type = "info", inAppOnly = false } =
      await req.json();

    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: "user_id and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Cria notification in-app
    const { data: notif, error: insErr } = await supabase
      .from("notifications")
      .insert({ user_id, title, body, link, type })
      .select()
      .single();

    if (insErr) console.error("[send-push] insert notif failed:", insErr);

    // 2) Envia web push (se não for in-app only)
    let pushed = 0;
    let failed = 0;
    if (!inAppOnly) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user_id);

      if (subs && subs.length) {
        const payload = JSON.stringify({
          title,
          body: body || "",
          link: link || "/dashboard",
          type,
        });

        await Promise.all(
          subs.map(async (s: any) => {
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
              // 410 Gone / 404 → endpoint expirado, remove
              if (err?.statusCode === 410 || err?.statusCode === 404) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", s.endpoint);
              } else {
                console.error("[send-push] push failed:", err?.statusCode, err?.body);
              }
            }
          }),
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, notif_id: notif?.id, pushed, failed }),
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
