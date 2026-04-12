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

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

    pageTitle = ogTitleMatch?.[1] || titleMatch?.[1] || "Sem título";

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

    if (descMatch?.[1]) textContent = `Descrição: ${descMatch[1]}\n\n${textContent}`;
    if (metaDescMatch?.[1] && !descMatch) textContent = `Descrição: ${metaDescMatch[1]}\n\n${textContent}`;

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

const systemPrompt = `Você é um professor universitário especialista em Ciência da Computação. Sua tarefa é produzir uma apostila educacional BEM ESTRUTURADA e PADRONIZADA.

REGRAS DE FORMATAÇÃO DO CONTEÚDO (campo "content"):
- Use EXATAMENTE este padrão de estrutura com seções numeradas:
  1. INTRODUCAO - contextualizacao do tema
  2. CONCEITOS FUNDAMENTAIS - definicoes e teoria base
  3. DESENVOLVIMENTO - explicacao detalhada com subtopicos numerados (2.1, 2.2, etc.)
  4. EXEMPLOS PRATICOS - casos de uso reais, codigo ou cenarios aplicados
  5. RESUMO - sintese dos pontos principais
  6. REFERENCIAS - fontes mencionadas ou relevantes

- Cada seção deve começar com o título em MAIÚSCULAS seguido de linha em branco
- Use parágrafos bem separados (linha em branco entre eles)
- Listas devem usar "•" como marcador
- Subtópicos devem usar numeração (1.1, 1.2, 2.1, etc.)
- O conteúdo deve ter no MÍNIMO 1500 palavras
- NÃO use markdown (sem #, **, etc.) - apenas texto puro formatado

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, rawText } = body;

    if (!url && !rawText) throw new Error("URL ou texto bruto é obrigatório");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    let userPrompt: string;

    if (rawText && rawText.trim().length > 0) {
      // ─── Raw text mode: organize messy text into structured apostila ───
      const cleanText = rawText.trim().substring(0, 40000);
      userPrompt = `O usuário colou o seguinte texto bruto (pode estar bagunçado, desorganizado, com formatação inconsistente, copiado de slides, PDFs, ou anotações):

---
${cleanText}
---

Sua tarefa:
1. Identifique o tema/assunto principal do texto
2. REORGANIZE e ESTRUTURE todo o conteúdo seguindo rigorosamente o padrão de formatação da apostila
3. PRESERVE todo o conteúdo original — não remova informações
4. Corrija erros de formatação, organize em parágrafos coerentes
5. Complemente com explicações adicionais se o conteúdo for insuficiente para atingir 1500 palavras
6. Crie de 8 a 10 exercícios de múltipla escolha baseados no conteúdo

IMPORTANTE: Mesmo que o texto pareça caótico, extraia TODO o conhecimento útil e organize-o profissionalmente.`;
    } else if (url) {
      // ─── URL mode: fetch and process ───
      const isNotion = isNotionUrl(url);
      const { text: textContent, title: pageTitle } = isNotion
        ? await fetchNotionContent(url)
        : await fetchGenericContent(url);

      const cleanContent = textContent.replace(/\s+/g, " ").trim();
      const isSparse = cleanContent.length < 200;

      if (isSparse || isNotion) {
        const extraContent = cleanContent.length > 50 ? `\n\nConteúdo parcial extraído da página:\n${cleanContent.substring(0, 15000)}` : "";
        userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}${extraContent}\n\nCom base nas informações acima, crie uma apostila educacional COMPLETA e DETALHADA sobre o tema identificado, seguindo rigorosamente a estrutura padronizada. Se o conteúdo extraído for insuficiente, complemente com seu conhecimento. IMPORTANTE: inclua OBRIGATORIAMENTE de 8 a 10 exercícios.`;
      } else {
        userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}\n\nConteúdo extraído:\n${cleanContent.substring(0, 30000)}\n\nReorganize e estruture o conteúdo acima seguindo rigorosamente o padrão de formatação. PRESERVE todo o conteúdo original mas reorganize-o nas seções padronizadas. Complemente se necessário para atingir o mínimo de 1500 palavras. IMPORTANTE: inclua de 8 a 10 exercícios.`;
      }
    } else {
      throw new Error("Entrada inválida");
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

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione fundos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        title: "Sem título",
        category: "Geral",
        content: rawText ? rawText.substring(0, 10000) : "Não foi possível processar o conteúdo.",
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
        title: "Sem título",
        category: "Geral",
        content: rawText ? rawText.substring(0, 10000) : "Não foi possível processar o conteúdo.",
        exercises: [],
      };
    }

    return new Response(JSON.stringify({
      title: parsed.title || "Sem título",
      category: parsed.category || "Geral",
      content: parsed.content || (rawText ? rawText.substring(0, 10000) : ""),
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
