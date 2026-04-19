// Generates embeddings for apostilas missing them. Admin-only.
// Suporta dual provider: Google AI Studio direto ou Lovable AI Gateway (fallback).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function embedGoogle(apiKey: string, text: string): Promise<number[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  if (!res.ok) {
    console.warn("google-embed", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const json = await res.json();
  return json?.embedding?.values ?? null;
}

async function embedLovable(apiKey: string, text: string): Promise<number[] | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/text-embedding-004", input: text }),
  });
  if (!res.ok) {
    console.warn("lovable-embed", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const json = await res.json();
  return json?.data?.[0]?.embedding ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Provider preference
    let preferGoogle = false;
    try {
      const { data: setting } = await admin.from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
      const v: any = setting?.value;
      preferGoogle = v === "google" || v?.provider === "google" || v?.preferGoogle === true;
    } catch (e) {
      console.warn("app_settings read err", e);
    }

    if (!preferGoogle && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Nenhum provedor de IA configurado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (preferGoogle && !GOOGLE_AI_API_KEY && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Google preferido mas sem chave configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let query = admin.from("apostilas").select("id, title, category, content").eq("published", true);
    if (!force) query = query.is("embedding", null);
    const { data: apostilas, error } = await query.limit(100);
    if (error) throw error;

    let processed = 0;
    let failed = 0;
    let providerUsed: "google-direct" | "lovable-ai" | "mixed" | "none" = "none";

    for (const a of apostilas ?? []) {
      try {
        const text = `${a.title}\n${a.category}\n${(a.content ?? "").slice(0, 6000)}`;
        let vector: number[] | null = null;
        let used: "google-direct" | "lovable-ai" | null = null;

        if (preferGoogle && GOOGLE_AI_API_KEY) {
          vector = await embedGoogle(GOOGLE_AI_API_KEY, text);
          if (vector) used = "google-direct";
        }
        if (!vector && LOVABLE_API_KEY) {
          vector = await embedLovable(LOVABLE_API_KEY, text);
          if (vector) used = "lovable-ai";
        }
        if (!vector) { failed++; continue; }

        if (used) {
          if (providerUsed === "none") providerUsed = used;
          else if (providerUsed !== used) providerUsed = "mixed";
        }

        const { error: upErr } = await admin.from("apostilas").update({ embedding: vector as any }).eq("id", a.id);
        if (upErr) { console.error("update fail", upErr); failed++; continue; }
        processed++;
      } catch (e) {
        console.error("loop err", e);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed, total: apostilas?.length ?? 0, provider: providerUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": providerUsed },
    });
  } catch (e) {
    console.error("fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
