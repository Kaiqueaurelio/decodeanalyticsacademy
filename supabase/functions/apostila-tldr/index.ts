// Edge function: gera TL;DR (resumo curto) + mapa mental Mermaid de uma apostila.
// Cacheia em apostila_summaries (campos: summary_md, mindmap_mermaid).
// Usa Lovable AI Gateway (gemini-3-flash-preview) com tool calling para JSON estruturado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  apostila_id: string;
  force?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body: Body = await req.json();
    if (!body.apostila_id) {
      return new Response(JSON.stringify({ error: "apostila_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Cache hit?
    if (!body.force) {
      const { data: cached } = await admin
        .from("apostila_summaries")
        .select("summary_md, mindmap_mermaid, generated_at")
        .eq("apostila_id", body.apostila_id)
        .maybeSingle();
      if (cached?.summary_md && cached?.mindmap_mermaid) {
        return new Response(
          JSON.stringify({
            summary_md: cached.summary_md,
            mindmap_mermaid: cached.mindmap_mermaid,
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Fetch apostila
    const { data: ap, error: apErr } = await admin
      .from("apostilas")
      .select("title, category, content")
      .eq("id", body.apostila_id)
      .maybeSingle();
    if (apErr || !ap) {
      return new Response(JSON.stringify({ error: "Apostila not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate to ~12k chars to control cost/latency
    const content = (ap.content || "").slice(0, 12000);

    const systemPrompt = `Você é um tutor que ajuda alunos universitários de tecnologia (Ciência da Computação, Sistemas de Informação, Engenharia da Computação) a revisar conteúdo rapidamente. Use português do Brasil, linguagem clara e objetiva.`;

    const userPrompt = `Analise esta apostila de "${ap.category}" intitulada "${ap.title}" e gere:

1. UM RESUMO em formato Markdown contendo:
   - 5 bullets dos conceitos-chave (cada um com 1-2 frases)
   - Uma seção "🎯 O que mais cai em prova" com 3 itens
   - Uma seção "💡 Analogia simples" com 1 parágrafo curto que explique o tema central de forma intuitiva

2. UM MAPA MENTAL em sintaxe Mermaid (use o tipo \`mindmap\`), com o tema central e 4-6 ramos principais, cada um com 2-4 sub-itens. Apenas texto puro nos nós (sem aspas, sem caracteres especiais).

CONTEÚDO DA APOSTILA:
${content}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "save_apostila_summary",
              description: "Salva o resumo TL;DR e o mapa mental Mermaid",
              parameters: {
                type: "object",
                properties: {
                  summary_md: {
                    type: "string",
                    description: "Resumo em Markdown com bullets, prova e analogia",
                  },
                  mindmap_mermaid: {
                    type: "string",
                    description: "Mapa mental em sintaxe Mermaid mindmap",
                  },
                },
                required: ["summary_md", "mindmap_mermaid"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_apostila_summary" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione fundos em Configurações." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao gerar resumo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(aiJson).slice(0, 500));
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);
    const summary_md: string = args.summary_md;
    let mindmap_mermaid: string = args.mindmap_mermaid;

    // Normalize Mermaid: must start with "mindmap"
    if (!mindmap_mermaid.trim().startsWith("mindmap")) {
      mindmap_mermaid = `mindmap\n${mindmap_mermaid}`;
    }

    // Upsert cache
    const { error: upsertErr } = await admin
      .from("apostila_summaries")
      .upsert(
        {
          apostila_id: body.apostila_id,
          summary_md,
          mindmap_mermaid,
          generated_by: userId,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "apostila_id" },
      );
    if (upsertErr) console.error("Upsert error:", upsertErr);

    return new Response(
      JSON.stringify({ summary_md, mindmap_mermaid, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("apostila-tldr error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
