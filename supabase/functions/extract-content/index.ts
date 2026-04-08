import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL é obrigatória");

    let textContent = "";
    let pageTitle = "Sem título";

    // Try to fetch the page content
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

        // Add OG/meta descriptions as extra context
        if (ogDescMatch?.[1]) textContent = `Descrição: ${ogDescMatch[1]}\n\n${textContent}`;
        if (metaDescMatch?.[1] && !ogDescMatch) textContent = `Descrição: ${metaDescMatch[1]}\n\n${textContent}`;
      }
    } catch (fetchErr) {
      console.error("Fetch error:", fetchErr);
    }

    // Check if content is too sparse (SPA pages like Perplexity)
    const cleanContent = textContent.replace(/\s+/g, " ").trim();
    const isSparse = cleanContent.length < 200;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    // Build AI prompt based on whether we got real content or not
    let userPrompt: string;
    let systemPrompt: string;

    if (isSparse) {
      // Content is too sparse - ask AI to research and generate based on URL
      systemPrompt = `Você é um professor universitário especialista. O usuário forneceu uma URL de uma página que não pôde ser acessada diretamente (pode ser uma página dinâmica/SPA). 
Com base na URL e no título da página, você deve:
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
      userPrompt = `URL: ${url}\nTítulo da página: ${pageTitle}\n\nA página não retornou conteúdo suficiente. Analise a URL e o título para identificar o assunto e crie uma apostila educacional completa sobre o tema, com pelo menos 8 exercícios.`;
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
