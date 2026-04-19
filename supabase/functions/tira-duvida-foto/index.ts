// Receives a photo of an exercise, returns concept + hint + related apostila.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const imageDataUrl: string | undefined = body.image; // data:image/...;base64,...
    const imagePath: string | undefined = body.image_path; // storage path
    const imageUrl: string | undefined = body.image_url; // public/signed url for storage
    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "Imagem ausente" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Daily limit check
    const { data: countToday } = await userClient.rpc("count_tira_duvidas_today", { _user_id: user.id });
    if ((countToday ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Limite diário de ${DAILY_LIMIT} dúvidas atingido. Tente novamente amanhã.` }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Vision call - extract concept + hint + topic query
    const visionRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um tutor acadêmico de Computação. O aluno enviou a foto de um exercício e precisa de ajuda PARA ENTENDER o tema, não receber a resposta pronta. Responda SEMPRE em português, de forma didática e amigável. Use a ferramenta "tira_duvida" para retornar a resposta estruturada.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise o exercício na imagem. Identifique o conceito principal envolvido, dê uma dica do caminho de raciocínio (sem resolver) e gere uma consulta curta para buscar material de apoio." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "tira_duvida",
            description: "Retorna a explicação didática estruturada",
            parameters: {
              type: "object",
              properties: {
                topic: { type: "string", description: "Tópico/disciplina principal em 2-6 palavras (ex: 'Algoritmos de ordenação', 'Lógica proposicional')" },
                concept: { type: "string", description: "Explicação clara do conceito envolvido (3-5 parágrafos curtos, em markdown)" },
                hint: { type: "string", description: "Dica de raciocínio para resolver o exercício SEM dar a resposta final (1-2 parágrafos)" },
                search_query: { type: "string", description: "Query de busca semântica para encontrar a apostila relacionada (uma frase descritiva)" },
              },
              required: ["topic", "concept", "hint", "search_query"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "tira_duvida" } },
      }),
    });

    if (!visionRes.ok) {
      const txt = await visionRes.text();
      console.error("vision error", visionRes.status, txt);
      if (visionRes.status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (visionRes.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Avise o administrador." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Vision error ${visionRes.status}`);
    }

    const visionJson = await visionRes.json();
    const toolCall = visionJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Resposta da IA inválida");
    const args = JSON.parse(toolCall.function.arguments);
    const { topic, concept, hint, search_query } = args;

    // Step 2: Embed search query
    let relatedApostila: { id: string; title: string; category: string; similarity: number } | null = null;
    try {
      const embedRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/text-embedding-004", input: `${topic}\n${search_query}` }),
      });
      if (embedRes.ok) {
        const ej = await embedRes.json();
        const vec = ej.data?.[0]?.embedding;
        if (vec) {
          const admin = createClient(SUPABASE_URL, SERVICE_KEY);
          const { data: matches } = await admin.rpc("match_apostila", { _embedding: vec });
          if (matches && matches.length > 0) {
            relatedApostila = matches[0] as any;
          }
        }
      }
    } catch (e) {
      console.error("embed/match err", e);
    }

    const fullAnswer = `**Tema:** ${topic}\n\n## Conceito\n${concept}\n\n## Dica de resolução\n${hint}`;

    // Step 3: Save record
    const { data: saved, error: saveErr } = await userClient.from("tira_duvidas").insert({
      user_id: user.id,
      image_url: imageUrl ?? imagePath ?? "inline",
      image_path: imagePath ?? null,
      concept,
      hint,
      full_answer: fullAnswer,
      related_apostila_id: relatedApostila?.id ?? null,
      related_apostila_title: relatedApostila?.title ?? null,
      similarity: relatedApostila?.similarity ?? null,
    }).select().single();

    if (saveErr) console.error("save err", saveErr);

    return new Response(JSON.stringify({
      id: saved?.id,
      topic,
      concept,
      hint,
      full_answer: fullAnswer,
      related_apostila: relatedApostila,
      remaining_today: DAILY_LIMIT - (countToday ?? 0) - 1,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
