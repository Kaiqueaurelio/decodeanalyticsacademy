import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { markdown, metadata, url } = await req.json();

    if (!markdown && !metadata) {
      return new Response(
        JSON.stringify({ error: "Bad Request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncatedMarkdown = (markdown || "").substring(0, 15000);
    const metaInfo = metadata
      ? `\nMetadados:\n- Titulo: ${metadata.title || "N/A"}\n- Descricao: ${metadata.description || "N/A"}\n- og:image: ${metadata.ogImage || metadata.image || "N/A"}\n- URL: ${url || "N/A"}`
      : "";

    const userPrompt = `Extraia as informacoes do seguinte conteudo:\n${metaInfo}\n\nConteudo da pagina:\n${truncatedMarkdown}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawText.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean any residual markdown from content
    let cleanContent = (parsed.content || "")
      .replace(/!\[.*?\]\(.*?\)/g, "")       // remove ![alt](url)
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")  // [text](url) -> text
      .replace(/#{1,6}\s*/g, "")               // remove # headers
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") // remove **bold** / *italic*
      .replace(/`([^`]+)`/g, "$1")             // remove `code`
      .replace(/^[-*]\s+/gm, "• ")             // normalize list markers
      .replace(/\n{3,}/g, "\n\n")              // collapse excessive newlines
      .trim();

    const validCategories = ["cursos", "empregos", "eventos", "tecnologia", "geral"];
    const category = validCategories.includes(parsed.category) ? parsed.category : "geral";

    return new Response(
      JSON.stringify({
        title: (parsed.title || "").substring(0, 100),
        content: cleanContent,
        category,
        image_url: parsed.image_url || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
