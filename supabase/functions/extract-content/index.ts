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

    // Fetch the page content
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DecodeAnalytics/1.0)" },
    });
    if (!response.ok) throw new Error(`Falha ao acessar URL: ${response.status}`);

    const html = await response.text();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    const pageTitle = ogTitleMatch?.[1] || h1Match?.[1] || titleMatch?.[1] || "Sem título";

    // Strip HTML tags and get text content
    const textContent = html
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

    // Truncate to reasonable size
    const content = textContent.substring(0, 50000);

    // Now use AI to structure the content and generate exercises
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente educacional. A partir do conteúdo de uma página web, extraia:
1. O título principal do assunto (campo "title")
2. A categoria/matéria (campo "category") - exemplos: Redes, IA, Segurança, Cloud, Programação, Banco de Dados, Sistemas Operacionais
3. O conteúdo principal formatado em texto limpo com títulos e parágrafos (campo "content")
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
}`
          },
          {
            role: "user",
            content: `URL: ${url}\nTítulo da página: ${pageTitle}\n\nConteúdo extraído:\n${content.substring(0, 30000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Error:", errText);
      // Fallback without AI
      return new Response(JSON.stringify({
        title: pageTitle.trim(),
        category: "Geral",
        content: content.substring(0, 10000),
        exercises: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";
    
    // Parse the AI response - handle potential markdown code blocks
    let parsed;
    try {
      const jsonStr = aiText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Fallback
      parsed = {
        title: pageTitle.trim(),
        category: "Geral",
        content: content.substring(0, 10000),
        exercises: [],
      };
    }

    return new Response(JSON.stringify({
      title: parsed.title || pageTitle.trim(),
      category: parsed.category || "Geral",
      content: parsed.content || content.substring(0, 10000),
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
