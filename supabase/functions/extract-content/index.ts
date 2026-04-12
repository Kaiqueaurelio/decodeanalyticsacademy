import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isJsRenderedUrl(url: string): boolean {
  return url.includes("claude.ai/public/artifacts") ||
    url.includes("claudeusercontent.com") ||
    url.includes("codepen.io") ||
    url.includes("codesandbox.io") ||
    url.includes("stackblitz.com") ||
    url.includes("replit.com");
}

function isNotionUrl(url: string): boolean {
  return url.includes("notion.site") || url.includes("notion.so");
}

async function fetchViaFirecrawl(url: string): Promise<{ text: string; title: string }> {
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    console.error("FIRECRAWL_API_KEY not available");
    return { text: "", title: "Sem titulo" };
  }

  try {
    console.log("Using Firecrawl for JS-rendered URL:", url);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Firecrawl error:", response.status, errText);
      return { text: "", title: "Sem titulo" };
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";
    const title = data.data?.metadata?.title || data.metadata?.title || "Sem titulo";

    console.log("Firecrawl extracted", markdown.length, "chars");
    return { text: markdown, title };
  } catch (err) {
    console.error("Firecrawl fetch error:", err);
    return { text: "", title: "Sem titulo" };
  }
}

async function fetchNotionContent(url: string): Promise<{ text: string; title: string }> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  let textContent = "";
  let pageTitle = "Sem titulo";

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);

    pageTitle = ogTitleMatch?.[1] || titleMatch?.[1] || "Sem titulo";

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

    if (descMatch?.[1]) textContent = `Descricao: ${descMatch[1]}\n\n${textContent}`;
    if (metaDescMatch?.[1] && !descMatch) textContent = `Descricao: ${metaDescMatch[1]}\n\n${textContent}`;

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

  // If content is sparse, try Firecrawl
  if (textContent.replace(/\s+/g, " ").trim().length < 200) {
    const fcResult = await fetchViaFirecrawl(url);
    if (fcResult.text.length > textContent.length) {
      return fcResult;
    }
  }

  return { text: textContent, title: pageTitle };
}

async function fetchGenericContent(url: string): Promise<{ text: string; title: string }> {
  let textContent = "";
  let pageTitle = "Sem titulo";

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
      pageTitle = ogTitleMatch?.[1] || h1Match?.[1] || titleMatch?.[1] || "Sem titulo";

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

      if (ogDescMatch?.[1]) textContent = `Descricao: ${ogDescMatch[1]}\n\n${textContent}`;
      if (metaDescMatch?.[1] && !ogDescMatch) textContent = `Descricao: ${metaDescMatch[1]}\n\n${textContent}`;
    }
  } catch (fetchErr) {
    console.error("Fetch error:", fetchErr);
  }

  // If content is sparse (JS-rendered page), try Firecrawl as fallback
  if (textContent.replace(/\s+/g, " ").trim().length < 200) {
    console.log("Content sparse, trying Firecrawl fallback...");
    const fcResult = await fetchViaFirecrawl(url);
    if (fcResult.text.length > textContent.length) {
      return fcResult;
    }
  }

  return { text: textContent, title: pageTitle };
}

const systemPrompt = `Voce e um professor universitario especialista em Ciencia da Computacao. Sua tarefa e produzir uma apostila educacional BEM ESTRUTURADA e PADRONIZADA.

REGRAS DE FORMATACAO DO CONTEUDO (campo "content"):
- Use EXATAMENTE este padrao de estrutura com secoes numeradas:
  1. INTRODUCAO - contextualizacao do tema
  2. CONCEITOS FUNDAMENTAIS - definicoes e teoria base
  3. DESENVOLVIMENTO - explicacao detalhada com subtopicos numerados (2.1, 2.2, etc.)
  4. EXEMPLOS PRATICOS - casos de uso reais, codigo ou cenarios aplicados
  5. RESUMO - sintese dos pontos principais
  6. REFERENCIAS - fontes mencionadas ou relevantes

- Cada secao deve comecar com o titulo em MAIUSCULAS seguido de linha em branco
- Use paragrafos bem separados (linha em branco entre eles)
- Listas devem usar "." como marcador
- Subtopicos devem usar numeracao (1.1, 1.2, 2.1, etc.)
- O conteudo deve ter no MINIMO 1500 palavras
- NAO use markdown (sem #, **, etc.) - apenas texto puro formatado

REGRAS PARA EXERCICIOS:
- Inclua de 8 a 10 exercicios de multipla escolha
- Cubra diferentes niveis de dificuldade (facil, medio, dificil)
- As opcoes devem comecar com "A) ", "B) ", "C) ", "D) "

Responda SOMENTE com JSON valido, sem markdown. Formato:
{
  "title": "Titulo claro e descritivo do assunto",
  "category": "Categoria (Redes, IA, Seguranca, Cloud, Programacao, Banco de Dados, Sistemas Operacionais, Engenharia de Software, etc)",
  "content": "Conteudo completo seguindo a estrutura padronizada acima",
  "exercises": [
    {
      "question": "pergunta",
      "options": ["A) opcao", "B) opcao", "C) opcao", "D) opcao"],
      "correct_answer": "A",
      "explanation": "explicacao da resposta correta"
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, rawText } = body;

    if (!url && !rawText) throw new Error("URL ou texto bruto e obrigatorio");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY nao configurada");

    let userPrompt: string;

    if (rawText && rawText.trim().length > 0) {
      const cleanText = rawText.trim().substring(0, 40000);
      userPrompt = `O usuario colou o seguinte texto bruto (pode estar baguncado, desorganizado, com formatacao inconsistente, copiado de slides, PDFs, ou anotacoes):

---
${cleanText}
---

Sua tarefa:
1. Identifique o tema/assunto principal do texto
2. REORGANIZE e ESTRUTURE todo o conteudo seguindo rigorosamente o padrao de formatacao da apostila
3. PRESERVE todo o conteudo original - nao remova informacoes
4. Corrija erros de formatacao, organize em paragrafos coerentes
5. Complemente com explicacoes adicionais se o conteudo for insuficiente para atingir 1500 palavras
6. Crie de 8 a 10 exercicios de multipla escolha baseados no conteudo

IMPORTANTE: Mesmo que o texto pareca caotico, extraia TODO o conhecimento util e organize-o profissionalmente.`;
    } else if (url) {
      const isJsRendered = isJsRenderedUrl(url);
      const isNotion = isNotionUrl(url);

      let textContent: string;
      let pageTitle: string;
      let extractionMethod = "fetch";

      if (isJsRendered) {
        const result = await fetchViaFirecrawl(url);
        textContent = result.text;
        pageTitle = result.title;
        extractionMethod = "firecrawl";
      } else if (isNotion) {
        const result = await fetchNotionContent(url);
        textContent = result.text;
        pageTitle = result.title;
        extractionMethod = textContent.length > 200 ? "fetch" : "firecrawl";
      } else {
        const result = await fetchGenericContent(url);
        textContent = result.text;
        pageTitle = result.title;
        // Check if Firecrawl fallback was used (content was sparse and Firecrawl provided more)
        if (textContent.replace(/\s+/g, " ").trim().length < 200) {
          extractionMethod = "firecrawl-fallback";
        }
      }

      const cleanContent = textContent.replace(/\s+/g, " ").trim();
      const isSparse = cleanContent.length < 200;

      if (isSparse) {
        userPrompt = `URL: ${url}\nTitulo da pagina: ${pageTitle}\n\nO conteudo extraido foi insuficiente. Com base no titulo e URL, crie uma apostila educacional COMPLETA e DETALHADA sobre o tema identificado, seguindo rigorosamente a estrutura padronizada. IMPORTANTE: inclua OBRIGATORIAMENTE de 8 a 10 exercicios.`;
      } else {
        userPrompt = `URL: ${url}\nTitulo da pagina: ${pageTitle}\n\nConteudo extraido:\n${cleanContent.substring(0, 30000)}\n\nReorganize e estruture o conteudo acima seguindo rigorosamente o padrao de formatacao. PRESERVE todo o conteudo original mas reorganize-o nas secoes padronizadas. Complemente se necessario para atingir o minimo de 1500 palavras. IMPORTANTE: inclua de 8 a 10 exercicios.`;
      }
    } else {
      throw new Error("Entrada invalida");
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
        return new Response(JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Creditos insuficientes. Adicione fundos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        title: "Sem titulo",
        category: "Geral",
        content: rawText ? rawText.substring(0, 10000) : "Nao foi possivel processar o conteudo.",
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
        title: "Sem titulo",
        category: "Geral",
        content: rawText ? rawText.substring(0, 10000) : "Nao foi possivel processar o conteudo.",
        exercises: [],
      };
    }

    return new Response(JSON.stringify({
      title: parsed.title || "Sem titulo",
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
