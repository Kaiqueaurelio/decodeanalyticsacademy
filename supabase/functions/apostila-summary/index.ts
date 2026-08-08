import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const getCorsHeaders(req) = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Gera (ou retorna do cache) Resumo Express + Mapa Mental Mermaid
 * a partir do conteúdo da apostila.
 * Body: { apostila_id: string, force?: boolean }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const { apostila_id, force } = await req.json();
    if (!apostila_id) {
      return new Response(JSON.stringify({ error: "apostila_id obrigatório" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Lê preferência preferGoogle
    const { data: settingRow } = await admin
      .from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
    const preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;

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

    // ===== Google direto =====
    const callGoogle = async (): Promise<{ summary_md: string; mindmap_mermaid: string } | null> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt + "\n\nResponda SOMENTE em JSON puro: { \"summary_md\": \"...\", \"mindmap_mermaid\": \"...\" }" }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 4000, responseMimeType: "application/json" },
        }),
      });
      if (!resp.ok) { console.error("Google summary error", resp.status, (await resp.text()).slice(0, 300)); return null; }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      try {
        const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        const j = JSON.parse(cleaned);
        if (j?.summary_md && j?.mindmap_mermaid) return j;
      } catch (e) { console.error("parse google summary", e); }
      return null;
    };

    // ===== Lovable AI =====
    const callLovable = async (): Promise<{ summary_md: string; mindmap_mermaid: string } | { __status: number } | null> => {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4, max_tokens: 4000,
          tools: [{
            type: "function",
            function: {
              name: "return_summary",
              description: "Return summary and mindmap",
              parameters: {
                type: "object",
                properties: {
                  summary_md: { type: "string" },
                  mindmap_mermaid: { type: "string" },
                },
                required: ["summary_md", "mindmap_mermaid"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_summary" } },
        }),
      });
      if (!aiResp.ok) return { __status: aiResp.status };
      const data = await aiResp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return null;
      try { return JSON.parse(args); } catch { return null; }
    };

    let parsed: { summary_md?: string; mindmap_mermaid?: string } | null = null;
    if (preferGoogle) {
      parsed = await callGoogle();
      if (!parsed && LOVABLE_API_KEY) {
        const r = await callLovable();
        if (r && !("__status" in r)) parsed = r as any;
      }
    } else if (LOVABLE_API_KEY) {
      const r = await callLovable();
      if (r && "__status" in r) {
        if (GOOGLE_AI_API_KEY) parsed = await callGoogle();
        if (!parsed) {
          const status = r.__status;
          let msg = "Erro ao gerar resumo.";
          if (status === 402) msg = "Créditos de Lovable AI esgotados. Ative sua chave Google AI Studio em Admin → IA.";
          else if (status === 429) msg = "Limite de IA. Tente em alguns segundos.";
          return new Response(JSON.stringify({ error: msg }), { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
        }
      } else {
        parsed = r as any;
      }
    } else if (GOOGLE_AI_API_KEY) {
      parsed = await callGoogle();
    }

    if (!parsed?.summary_md || !parsed?.mindmap_mermaid) {
      return new Response(JSON.stringify({ error: "IA não estruturou resposta" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

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
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  } catch (e) {
    console.error("apostila-summary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
