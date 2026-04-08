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
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
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
    let systemPrompt: string;

    if (isSparse || isNotion) {
      // For Notion or sparse pages, ask AI to generate complete content based on URL + title + whatever we got
      systemPrompt = `Você é um professor universitário especialista. O usuário forneceu uma URL de uma página (possivelmente do Notion) com conteúdo sobre um assunto acadêmico.
Com base na URL, título da página e qualquer conteúdo extraído, você deve:
1. Identificar o assunto principal
2. Criar um conteúdo educacional COMPLETO e DETALHADO sobre esse assunto (mínimo 2000 palavras)
3. Gerar exercícios de múltipla escolha

O conteúdo deve ser uma apostila educacional completa, com introdução, conceitos, exemplos práticos e conclusão.

Responda SOMENTE com JSON válido, sem markdown. Formato:
{
  "title": "Título do assunto identificado",
  "category": "Categoria (Redes, IA, Segurança, Cloud, Programação, Banco de Dados, Sistemas Operacionais, etc)",
  "content": "Conteúdo completo da apostila com formatação em texto",
  "exercises": [
    {
      "question": "pergunta",
      "options": ["A) opção", "B) opção", "C) opção", "D) opção"],
      "correct_answer": "A",
      "explanation": "explicação"
    }
  ]
}`;
      const extraContent = cleanContent.length > 50 ? `\n\nConteúdo parcial extraído da página:\n${cleanContent.substring(0, 15000)}` : "";
      userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}${extraContent}\n\nCrie uma apostila educacional completa sobre o tema identificado. IMPORTANTE: inclua OBRIGATORIAMENTE de 8 a 10 exercícios de múltipla escolha no campo "exercises". Cada exercício com question, options (4 opções), correct_answer (A/B/C/D) e explanation.`;
    } else {
      systemPrompt = `Você é um assistente educacional. A partir do conteúdo de uma página web, extraia:
1. O título principal do assunto (campo "title")
2. A categoria/matéria (campo "category") - exemplos: Redes, IA, Segurança, Cloud, Programação, Banco de Dados, Sistemas Operacionais
3. O conteúdo principal formatado em texto limpo com títulos e parágrafos (campo "content") - PRESERVE TODO o conteúdo original, NÃO resuma
4. De 5 a 10 exercícios de múltipla escolha sobre o conteúdo (campo "exercises")

Cada exercício deve ter:
- "question": a pergunta
- "options": array com 4 opções (strings)
- "correct_answer": letra A, B, C ou D
- "explanation": explicação curta da resposta

Responda SOMENTE com JSON válido, sem markdown. Formato:
{
  "title": "...",
  "category": "...",
  "content": "...",
  "exercises": [...]
}`;
      userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}\n\nConteúdo extraído:\n${cleanContent.substring(0, 30000)}`;
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
