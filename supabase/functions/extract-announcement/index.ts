import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


const systemPrompt = `Voce e um assistente que extrai informacoes de paginas web para criar avisos em um mural academico universitario.

A partir do conteudo markdown fornecido, extraia as informacoes e retorne um JSON com:

1. "title": Titulo curto e claro (maximo 80 caracteres). Sem emojis.
2. "content": Descricao LIMPA em texto puro (sem markdown, sem ![imagens], sem links, sem ** ou ##). 
   - Resuma o conteudo em 2-4 paragrafos claros e objetivos.
   - Foque no que e relevante para estudantes universitarios de tecnologia.
   - Inclua: o que e, para quem e, principais beneficios ou topicos abordados.
   - Maximo de 600 palavras.
3. "category": Uma dessas opcoes EXATAS: "cursos", "empregos", "eventos", "tecnologia", "geral"
   - "cursos" para cursos, treinamentos, certificacoes
   - "empregos" para vagas, estagios, oportunidades de trabalho
   - "eventos" para hackathons, meetups, conferencias, workshops
   - "tecnologia" para noticias, artigos, lancamentos tech
   - "geral" para tudo que nao se encaixa acima
4. "image_url": URL da imagem principal (og:image, logo, ou imagem de destaque). Null se nao encontrar.

REGRAS:
- NUNCA inclua sintaxe markdown no content (nada de #, **, [], ![], etc)
- NUNCA inclua URLs no content
- O texto deve ser fluido, natural e pronto para exibicao
- Responda SOMENTE com JSON valido, sem explicacoes`;

import { requireUser } from "../_shared/auth-guard.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const auth = await requireUser(req, getCorsHeaders(req));
  if (!auth.ok) return auth.response;

  try {
    const { markdown, metadata, url } = await req.json();

    if (!markdown && !metadata) {
      return new Response(
        JSON.stringify({ error: "Bad Request" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!LOVABLE_API_KEY && !GOOGLE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Lê preferência preferGoogle
    let preferGoogle = false;
    try {
      const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: settingRow } = await supa
        .from("app_settings")
        .select("value")
        .eq("key", "ai_provider")
        .maybeSingle();
      preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;
    } catch { /* ignore */ }

    const truncatedMarkdown = (markdown || "").substring(0, 15000);
    const metaInfo = metadata
      ? `\nMetadados:\n- Titulo: ${metadata.title || "N/A"}\n- Descricao: ${metadata.description || "N/A"}\n- og:image: ${metadata.ogImage || metadata.image || "N/A"}\n- URL: ${url || "N/A"}`
      : "";

    const userPrompt = `Extraia as informacoes do seguinte conteudo:\n${metaInfo}\n\nConteudo da pagina:\n${truncatedMarkdown}`;

    // ===== Google direto (JSON mode) =====
    const callGoogle = async (): Promise<any | null> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!resp.ok) {
        console.error("Google extract-announcement error", resp.status, (await resp.text()).slice(0, 300));
        return null;
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      try {
        const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.error("Google JSON parse failed", e);
        return null;
      }
    };

    // ===== Lovable AI =====
    const callLovable = async (): Promise<any | { __status: number } | null> => {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        }),
      });
      if (!aiResponse.ok) return { __status: aiResponse.status };
      const aiData = await aiResponse.json();
      const rawText = aiData.choices?.[0]?.message?.content || "";
      try {
        const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleaned);
      } catch {
        return null;
      }
    };

    // ===== Estratégia dual =====
    let parsed: any | null = null;
    let providerUsed: "google-direct" | "lovable-ai" | "google-fallback" | "lovable-fallback" = "lovable-ai";

    if (preferGoogle && GOOGLE_AI_API_KEY) {
      parsed = await callGoogle();
      providerUsed = "google-direct";
      if (!parsed && LOVABLE_API_KEY) {
        const r = await callLovable();
        if (r && !("__status" in r)) { parsed = r; providerUsed = "lovable-fallback"; }
      }
    } else if (LOVABLE_API_KEY) {
      const r = await callLovable();
      if (r && "__status" in r) {
        if (GOOGLE_AI_API_KEY) {
          parsed = await callGoogle();
          providerUsed = "google-fallback";
        }
        if (!parsed) {
          const status = r.__status;
          let msg = "AI extraction failed";
          if (status === 429) msg = "Rate limit exceeded";
          else if (status === 402) msg = "Credits exhausted";
          return new Response(
            JSON.stringify({ error: msg }),
            { status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "X-AI-Provider": "lovable-ai" } }
          );
        }
      } else {
        parsed = r;
      }
    } else if (GOOGLE_AI_API_KEY) {
      parsed = await callGoogle();
      providerUsed = "google-direct";
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Clean any residual markdown from content
    let cleanContent = (parsed.content || "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^[-*]\s+/gm, "• ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const validCategories = ["cursos", "empregos", "eventos", "tecnologia", "geral"];
    const category = validCategories.includes(parsed.category) ? parsed.category : "geral";

    return new Response(
      JSON.stringify({
        title: (parsed.title || "").substring(0, 100),
        content: cleanContent,
        category,
        image_url: parsed.image_url || null,
        provider: providerUsed,
      }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "X-AI-Provider": providerUsed } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
