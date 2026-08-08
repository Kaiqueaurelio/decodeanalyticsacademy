import { getCorsHeaders } from "../_shared/cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


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

const systemPrompt = `Voce e um professor universitario brasileiro especialista em Ciencia da Computacao. Sua tarefa e produzir uma apostila educacional BEM ESTRUTURADA, HIERARQUICA e PADRONIZADA em MARKDOWN, e retorna-la EXCLUSIVAMENTE chamando a funcao return_apostila.

REGRAS DE FORMATACAO DO CAMPO content (MARKDOWN OBRIGATORIO):
- O conteudo DEVE usar markdown com hierarquia clara de topicos e subtopicos.
- Use "## " (H2) para os 6 TOPICOS PRINCIPAIS, exatamente nesta ordem:
  ## 1. Introducao
  ## 2. Conceitos Fundamentais
  ## 3. Desenvolvimento
  ## 4. Exemplos Praticos
  ## 5. Resumo
  ## 6. Referencias
- DENTRO de "## 3. Desenvolvimento" use OBRIGATORIAMENTE de 3 a 6 SUBTOPICOS com "### " (H3),
  numerados como "### 3.1 Nome do subtopico", "### 3.2 ...", "### 3.3 ..." etc.
- DENTRO de "## 4. Exemplos Praticos" use de 2 a 4 subtopicos "### 4.1 ...", "### 4.2 ..." etc.
- Cada subtopico deve ter pelo menos 2 paragrafos de conteudo proprio.
- Use **negrito** para termos-chave (1 a 3 por paragrafo).
- Listas com "- " como marcador.
- Blocos de codigo com tres crases ``` quando houver codigo.
- Paragrafos bem separados por linha em branco.
- MINIMO 1500 palavras totais.
- NAO use H1 ("# ") — o titulo da apostila ja e exibido a parte.

REGRAS PARA EXERCICIOS:
- Inclua de 8 a 10 exercicios de multipla escolha
- Cubra niveis variados (facil, medio, dificil)
- As opcoes comecam com "A) ", "B) ", "C) ", "D) "
- Cada exercicio com explicacao DETALHADA (minimo 2 frases) que justifique a resposta correta`;

const apostilaTool = {
  type: "function" as const,
  function: {
    name: "return_apostila",
    description: "Retorna a apostila estruturada com titulo, categoria, conteudo e exercicios",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Titulo claro e descritivo do assunto" },
        category: {
          type: "string",
          description: "Categoria (Redes, IA, Seguranca, Cloud, Programacao, Banco de Dados, Sistemas Operacionais, Engenharia de Software, etc)",
        },
        content: {
          type: "string",
          description: "Conteudo completo em MARKDOWN com hierarquia: ## para 6 topicos principais e ### para subtopicos numerados (3.1, 3.2 etc). Minimo 1500 palavras.",
        },
        exercises: {
          type: "array",
          description: "Lista de 8 a 10 exercicios de multipla escolha",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" },
                description: "Exatamente 4 opcoes no formato 'A) ...', 'B) ...', 'C) ...', 'D) ...'",
              },
              correct_answer: { type: "string", description: "Letra A, B, C ou D" },
              explanation: { type: "string", description: "Explicacao detalhada da resposta correta" },
            },
            required: ["question", "options", "correct_answer", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "category", "content", "exercises"],
      additionalProperties: false,
    },
  },
};

import { requireUser } from "../_shared/auth-guard.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const auth = await requireUser(req, getCorsHeaders(req), { requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { url, rawText } = body;

    if (!url && !rawText) throw new Error("URL ou texto bruto e obrigatorio");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!lovableApiKey && !googleApiKey) throw new Error("Nenhum provedor de IA configurado");

    // Lê preferência preferGoogle
    let preferGoogle = false;
    try {
      const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: settingRow } = await supa
        .from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
      preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!googleApiKey;
    } catch { /* ignore */ }

    let userPrompt: string;
    let extractionMethod = "fetch";

    if (rawText && rawText.trim().length > 0) {
      const cleanText = rawText.trim().substring(0, 40000);
      userPrompt = `O usuario colou o seguinte texto bruto (pode estar baguncado, copiado de slides/PDFs/anotacoes):

---
${cleanText}
---

Sua tarefa:
1. Identifique o tema/assunto principal
2. REORGANIZE e ESTRUTURE todo o conteudo seguindo rigorosamente o padrao de formatacao
3. PRESERVE todo o conhecimento original
4. Corrija formatacao, organize em paragrafos coerentes
5. Complemente se o conteudo for insuficiente para 1500 palavras
6. Crie de 8 a 10 exercicios de multipla escolha baseados no conteudo

Retorne APENAS chamando a funcao return_apostila.`;
    } else if (url) {
      const isJsRendered = isJsRenderedUrl(url);
      const isNotion = isNotionUrl(url);

      let textContent: string;
      let pageTitle: string;

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
        if (textContent.replace(/\s+/g, " ").trim().length < 200) {
          extractionMethod = "firecrawl-fallback";
        }
      }

      const cleanContent = textContent.replace(/\s+/g, " ").trim();
      const isSparse = cleanContent.length < 200;

      if (isSparse) {
        userPrompt = `URL: ${url}\nTitulo da pagina: ${pageTitle}\n\nO conteudo extraido foi insuficiente. Com base no titulo e URL, crie uma apostila educacional COMPLETA sobre o tema identificado, seguindo a estrutura padronizada com 8-10 exercicios. Retorne APENAS chamando return_apostila.`;
      } else {
        userPrompt = `URL: ${url}\nTitulo da pagina: ${pageTitle}\n\nConteudo extraido:\n${cleanContent.substring(0, 30000)}\n\nReorganize e estruture o conteudo acima na estrutura padronizada. PRESERVE todo o conhecimento original. Complemente se necessario para atingir 1500 palavras. Inclua 8-10 exercicios. Retorne APENAS chamando return_apostila.`;
      }
    } else {
      throw new Error("Entrada invalida");
    }

    // ===== Google AI Studio direto (JSON mode) =====
    // Retorna { __status } em caso de erro HTTP para permitir fallback inteligente.
    const callGoogle = async (): Promise<any | { __status: number } | null> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${encodeURIComponent(googleApiKey!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt + "\n\nResponda SOMENTE com JSON puro no formato { \"title\": \"...\", \"category\": \"...\", \"content\": \"...\", \"exercises\": [...] }." }] },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 16000,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!resp.ok) {
        console.error("Google extract-content error", resp.status, (await resp.text()).slice(0, 300));
        return { __status: resp.status };
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      try {
        const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.error("Google JSON parse failed", e, text.slice(0, 300));
        return null;
      }
    };

    // ===== Lovable AI =====
    const callLovable = async (): Promise<any | { __status: number } | null> => {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 16000,
          tools: [apostilaTool],
          tool_choice: { type: "function", function: { name: "return_apostila" } },
        }),
      });
      if (!aiResponse.ok) return { __status: aiResponse.status };
      const aiData = await aiResponse.json();
      const choice = aiData.choices?.[0];
      const toolCall = choice?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try { return JSON.parse(toolCall.function.arguments); } catch { /* ignore */ }
      }
      const aiText = choice?.message?.content || "";
      try {
        const jsonStr = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(jsonStr);
      } catch { return null; }
    };

    // ===== Estratégia dual com fallback automático =====
    let parsed: { title?: string; category?: string; content?: string; exercises?: any[] } | null = null;
    let providerUsed: "google-direct" | "lovable-ai" | "google-fallback" | "lovable-fallback" = "lovable-ai";
    let lastStatus: number | null = null;

    if (preferGoogle && googleApiKey) {
      const g = await callGoogle();
      if (g && !("__status" in g)) {
        parsed = g;
        providerUsed = "google-direct";
      } else {
        if (g && "__status" in g) lastStatus = (g as any).__status;
        // Fallback automático para Lovable AI quando Google falha (ex: 429 quota)
        if (lovableApiKey) {
          console.log("Google falhou (status", lastStatus, "). Caindo para Lovable AI...");
          const r = await callLovable();
          if (r && typeof r === "object" && !("__status" in r)) {
            parsed = r as any;
            providerUsed = "lovable-fallback";
          } else if (r && "__status" in r) {
            lastStatus = (r as any).__status;
          }
        }
      }
    } else if (lovableApiKey) {
      const r = await callLovable();
      if (r && typeof r === "object" && "__status" in r) {
        lastStatus = (r as any).__status;
        if (googleApiKey) {
          const g = await callGoogle();
          if (g && !("__status" in g)) { parsed = g; providerUsed = "google-fallback"; }
          else if (g && "__status" in g) lastStatus = (g as any).__status;
        }
      } else {
        parsed = r as any;
      }
    } else if (googleApiKey) {
      const g = await callGoogle();
      if (g && !("__status" in g)) { parsed = g; providerUsed = "google-direct"; }
      else if (g && "__status" in g) lastStatus = (g as any).__status;
    }

    if (!parsed?.content || parsed.content.length < 100) {
      let msg = "A IA nao retornou conteudo suficiente. Tente outra URL ou cole o texto manualmente.";
      let status = 502;
      if (lastStatus === 429) {
        msg = "Limite de requisicoes da IA excedido (cota esgotada). Aguarde alguns minutos e tente novamente, ou alterne o provedor de IA em Admin → IA.";
        status = 429;
      } else if (lastStatus === 402) {
        msg = "Creditos de IA esgotados. Configure outra chave em Admin → IA.";
        status = 402;
      } else if (lastStatus === 401 || lastStatus === 403) {
        msg = "Chave de IA invalida ou sem permissao. Verifique em Admin → IA.";
        status = lastStatus;
      }
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      title: parsed.title || "Sem titulo",
      category: parsed.category || "Geral",
      content: parsed.content,
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      extraction_method: rawText ? "text" : extractionMethod,
      provider: providerUsed,
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "X-AI-Provider": providerUsed } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
