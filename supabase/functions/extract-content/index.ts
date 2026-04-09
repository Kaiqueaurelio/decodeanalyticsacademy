import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isNotionUrl(url: string): boolean {
  return url.includes("notion.site") || url.includes("notion.so");
}

async function fetchNotionContent(url: string): Promise<{ text: string; title: string }> {
  // Try fetching with headers that work better for Notion public pages
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  let textContent = "";
  let pageTitle = "Sem título";

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // Extract title from various sources
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

    pageTitle = ogTitleMatch?.[1] || titleMatch?.[1] || "Sem título";

    // For Notion pages, extract content from data attributes and text nodes
    textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Add descriptions as extra context
    if (descMatch?.[1]) textContent = `Descrição: ${descMatch[1]}\n\n${textContent}`;
    if (metaDescMatch?.[1] && !descMatch) textContent = `Descrição: ${metaDescMatch[1]}\n\n${textContent}`;

    // Notion pages also embed content as JSON in script tags — try to extract
    const notionDataMatch = html.match(/"block":\s*(\{[\s\S]*?\})\s*,\s*"collection"/);
    if (notionDataMatch) {
      try {
        const blockData = JSON.parse(notionDataMatch[1]);
        const textParts: string[] = [];
        function extractText(obj: Record<string, unknown>) {
          if (typeof obj === "string") { textParts.push(obj); return; }
          if (Array.isArray(obj)) { obj.forEach(extractText); return; }
          if (obj && typeof obj === "object") {
            const val = obj as Record<string, unknown>;
            if (val.title && Array.isArray(val.title)) val.title.forEach((t: unknown[]) => { if (t[0]) textParts.push(String(t[0])); });
            if (val.properties) extractText(val.properties as Record<string, unknown>);
            Object.values(val).forEach(v => { if (v && typeof v === "object") extractText(v as Record<string, unknown>); });
          }
        }
        extractText(blockData);
        if (textParts.length > 5) textContent += "\n\n" + textParts.join("\n");
      } catch { /* ignore parse errors */ }
    }
  } catch (err) {
    console.error("Notion fetch error:", err);
  }

  return { text: textContent, title: pageTitle };
}

async function fetchGenericContent(url: string): Promise<{ text: string; title: string }> {
  let textContent = "";
  let pageTitle = "Sem título";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
      const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
      pageTitle = ogTitleMatch?.[1] || h1Match?.[1] || titleMatch?.[1] || "Sem título";

      textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<[^>]+>/g, "\n")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (ogDescMatch?.[1]) textContent = `Descrição: ${ogDescMatch[1]}\n\n${textContent}`;
      if (metaDescMatch?.[1] && !ogDescMatch) textContent = `Descrição: ${metaDescMatch[1]}\n\n${textContent}`;
    }
  } catch (fetchErr) {
    console.error("Fetch error:", fetchErr);
  }

  return { text: textContent, title: pageTitle };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL é obrigatória");

    // Use specialized fetcher for Notion URLs
    const { text: textContent, title: pageTitle } = isNotionUrl(url)
      ? await fetchNotionContent(url)
      : await fetchGenericContent(url);

    const cleanContent = textContent.replace(/\s+/g, " ").trim();
    const isSparse = cleanContent.length < 200;
    const isNotion = isNotionUrl(url);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    let userPrompt: string;

    // Unified system prompt for ALL sources (Notion, Perplexity, generic URLs)
    const systemPrompt = `Você é um professor universitário especialista em Ciência da Computação. Sua tarefa é produzir uma apostila educacional BEM ESTRUTURADA e PADRONIZADA.

REGRAS DE FORMATAÇÃO DO CONTEÚDO (campo "content"):
- Use EXATAMENTE este padrão de estrutura com seções numeradas:
  1. INTRODUÇÃO — contextualização do tema
  2. CONCEITOS FUNDAMENTAIS — definições e teoria base
  3. DESENVOLVIMENTO — explicação detalhada com subtópicos numerados (2.1, 2.2, etc.)
  4. EXEMPLOS PRÁTICOS — casos de uso reais, código ou cenários aplicados
  5. RESUMO — síntese dos pontos principais
  6. REFERÊNCIAS — fontes mencionadas ou relevantes

- Cada seção deve começar com o título em MAIÚSCULAS seguido de linha em branco
- Use parágrafos bem separados (linha em branco entre eles)
- Listas devem usar "•" como marcador
- Subtópicos devem usar numeração (1.1, 1.2, 2.1, etc.)
- O conteúdo deve ter no MÍNIMO 1500 palavras
- NÃO use markdown (sem #, **, ```, etc.) — apenas texto puro formatado

REGRAS PARA EXERCÍCIOS:
- Inclua de 8 a 10 exercícios de múltipla escolha
- Cubra diferentes níveis de dificuldade (fácil, médio, difícil)
- As opções devem começar com "A) ", "B) ", "C) ", "D) "

Responda SOMENTE com JSON válido, sem markdown. Formato:
{
  "title": "Título claro e descritivo do assunto",
  "category": "Categoria (Redes, IA, Segurança, Cloud, Programação, Banco de Dados, Sistemas Operacionais, Engenharia de Software, etc)",
  "content": "Conteúdo completo seguindo a estrutura padronizada acima",
  "exercises": [
    {
      "question": "pergunta",
      "options": ["A) opção", "B) opção", "C) opção", "D) opção"],
      "correct_answer": "A",
      "explanation": "explicação da resposta correta"
    }
  ]
}`;

    if (isSparse || isNotion) {
      const extraContent = cleanContent.length > 50 ? `\n\nConteúdo parcial extraído da página:\n${cleanContent.substring(0, 15000)}` : "";
      userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}${extraContent}\n\nCom base nas informações acima, crie uma apostila educacional COMPLETA e DETALHADA sobre o tema identificado, seguindo rigorosamente a estrutura padronizada. Se o conteúdo extraído for insuficiente, complemente com seu conhecimento. IMPORTANTE: inclua OBRIGATORIAMENTE de 8 a 10 exercícios.`;
    } else {
      userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}\n\nConteúdo extraído:\n${cleanContent.substring(0, 30000)}\n\nReorganize e estruture o conteúdo acima seguindo rigorosamente o padrão de formatação. PRESERVE todo o conteúdo original mas reorganize-o nas seções padronizadas. Complemente se necessário para atingir o mínimo de 1500 palavras. IMPORTANTE: inclua de 8 a 10 exercícios.`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 16000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Error:", errText);
      return new Response(JSON.stringify({
        title: pageTitle.trim(),
        category: "Geral",
        content: isSparse ? "Não foi possível extrair o conteúdo desta página." : cleanContent.substring(0, 10000),
        exercises: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        title: pageTitle.trim(),
        category: "Geral",
        content: isSparse ? "Não foi possível extrair o conteúdo desta página." : cleanContent.substring(0, 10000),
        exercises: [],
      };
    }

    return new Response(JSON.stringify({
      title: parsed.title || pageTitle.trim(),
      category: parsed.category || "Geral",
      content: parsed.content || cleanContent.substring(0, 10000),
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
