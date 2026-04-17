import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gera (ou retorna do cache) Resumo Express + Mapa Mental Mermaid
 * a partir do conteúdo da apostila.
 * Body: { apostila_id: string, force?: boolean }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { apostila_id, force } = await req.json();
    if (!apostila_id) {
      return new Response(JSON.stringify({ error: "apostila_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Cache hit?
    if (!force) {
      const { data: cached } = await admin
        .from("apostila_summaries")
        .select("summary_md, mindmap_mermaid")
        .eq("apostila_id", apostila_id)
        .maybeSingle();
      if (cached?.summary_md && cached?.mindmap_mermaid) {
        return new Response(JSON.stringify({ ...cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: ap } = await admin
      .from("apostilas")
      .select("title, content, category")
      .eq("id", apostila_id)
      .maybeSingle();

    if (!ap?.content) {
      return new Response(JSON.stringify({ error: "Apostila sem conteúdo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncated = ap.content.slice(0, 25000);

    const systemPrompt = `Você é um professor universitário que cria resumos didáticos enxutos.
Para a apostila enviada, gere DOIS artefatos:

1) summary_md: resumo em Markdown (~400-500 palavras), formato "1 página de cola da prova". Estrutura:
   - Título e 1 frase de contexto
   - 4-6 seções com ## títulos curtos
   - Bullets curtos com os pontos-chave (não copie parágrafos inteiros)
   - 1 seção final "## 🎯 Pegadinhas comuns" com 3-5 bullets
   Use português do Brasil. Sem emojis exceto no título "## 🎯 Pegadinhas comuns".

2) mindmap_mermaid: diagrama Mermaid do tipo "mindmap" representando a hierarquia dos conceitos.
   Comece com: mindmap
   root((Tema central))
   Não use parênteses dentro dos nós. Use no máximo 4 níveis e 25 nós.
   Mantenha textos curtos (1-4 palavras por nó).`;

    const userPrompt = `Título: ${ap.title}\nCategoria: ${ap.category}\n\nConteúdo:\n${truncated}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        tools: [{
          type: "function",
          function: {
            name: "return_summary",
            description: "Return summary and mindmap",
            parameters: {
              type: "object",
              properties: {
                summary_md: { type: "string", description: "Resumo em Markdown" },
                mindmap_mermaid: { type: "string", description: "Diagrama Mermaid do tipo mindmap" },
              },
              required: ["summary_md", "mindmap_mermaid"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_summary" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de IA. Tente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar resumo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error("Sem tool_call", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "IA não estruturou resposta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const parsed = JSON.parse(args);

    // Sanitiza Mermaid (remove fences)
    let mindmap = String(parsed.mindmap_mermaid || "").trim()
      .replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();
    if (!/^mindmap/i.test(mindmap)) mindmap = "mindmap\n  root((Tema))\n" + mindmap;

    const summary_md = String(parsed.summary_md || "").trim();

    // Upsert
    await admin.from("apostila_summaries").upsert({
      apostila_id,
      summary_md,
      mindmap_mermaid: mindmap,
      generated_at: new Date().toISOString(),
      generated_by: userData.user.id,
    }, { onConflict: "apostila_id" });

    return new Response(JSON.stringify({ summary_md, mindmap_mermaid: mindmap, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("apostila-summary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
