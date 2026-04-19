// Generates embeddings for apostilas missing them. Admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { force } = await req.json().catch(() => ({ force: false }));

    let query = admin.from("apostilas").select("id, title, category, content").eq("published", true);
    if (!force) query = query.is("embedding", null);
    const { data: apostilas, error } = await query.limit(100);
    if (error) throw error;

    let processed = 0;
    let failed = 0;
    for (const a of apostilas ?? []) {
      try {
        const text = `${a.title}\n${a.category}\n${(a.content ?? "").slice(0, 6000)}`;
        const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "google/text-embedding-004", input: text }),
        });
        if (!embedRes.ok) {
          console.error("embed fail", a.id, embedRes.status, await embedRes.text());
          failed++;
          continue;
        }
        const json = await embedRes.json();
        const vector = json.data?.[0]?.embedding;
        if (!vector) { failed++; continue; }
        const { error: upErr } = await admin.from("apostilas").update({ embedding: vector as any }).eq("id", a.id);
        if (upErr) { console.error("update fail", upErr); failed++; continue; }
        processed++;
      } catch (e) {
        console.error("loop err", e);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed, total: apostilas?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
