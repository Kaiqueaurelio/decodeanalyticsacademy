import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

const GEMINI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  const auth = await requireUser(req, getCorsHeaders(req));
  if (!auth.ok) return auth.response;

  try {
    const { query } = await req.json();
    if (typeof query !== "string" || query.trim().length < 2 || query.trim().length > 1000) {
      return new Response(JSON.stringify({ error: "Query must contain between 2 and 1000 characters" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const normalizedQuery = query.trim();
    const authorization = req.headers.get("Authorization") || req.headers.get("authorization");

    // 1. Generate embedding for the query
    let embedding: number[] | null = null;
    
    if (GEMINI_API_KEY) {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: normalizedQuery }] },
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
          input: normalizedQuery,
        }),
      });
      const data = await resp.json();
      embedding = data?.data?.[0]?.embedding;
    }

    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }

    // 2. Search database using the caller JWT. The RPC reads auth.uid()
    // and applies the same content scope used by the rest of the app.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization || "" } },
    });
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
    return new Response(JSON.stringify({ error: "Semantic search is temporarily unavailable" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
