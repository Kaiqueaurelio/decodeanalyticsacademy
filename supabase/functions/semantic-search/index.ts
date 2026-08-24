import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const auth = await requireUser(req, getCorsHeaders(req));
  if (!auth.ok) return auth.response;

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 1. Generate embedding for the query
    let embedding: number[] | null = null;
    
    if (GEMINI_API_KEY) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: query }] },
          }),
        }
      );
      const data = await resp.json();
      embedding = data?.embedding?.values;
    }

    // Fallback to Lovable AI Gateway if needed (assuming it supports embeddings)
    if (!embedding && LOVABLE_API_KEY) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/text-embedding-004",
          input: query,
        }),
      });
      const data = await resp.json();
      embedding = data?.data?.[0]?.embedding;
    }

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // 2. Search database using the embedding
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: results, error } = await supabase.rpc("match_semantic_content", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ results }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Semantic search error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
