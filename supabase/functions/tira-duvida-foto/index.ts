// Receives a photo of an exercise, returns concept + hint + related apostila.
// Suporta dual provider: Google AI Studio direto (chave do user) ou Lovable AI Gateway (fallback).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 10;

const TOOL_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string", description: "Tópico/disciplina principal em 2-6 palavras" },
    concept: { type: "string", description: "Explicação clara do conceito (3-5 parágrafos curtos, em markdown)" },
    hint: { type: "string", description: "Dica de raciocínio SEM dar a resposta final (1-2 parágrafos)" },
    search_query: { type: "string", description: "Query de busca semântica para encontrar a apostila relacionada" },
  },
  required: ["topic", "concept", "hint", "search_query"],
};

const SYSTEM_PROMPT = `Você é um tutor acadêmico de Computação. O aluno enviou a foto de um exercício e precisa de ajuda PARA ENTENDER o tema, não receber a resposta pronta. Responda SEMPRE em português, de forma didática e amigável.`;
const USER_PROMPT = "Analise o exercício na imagem. Identifique o conceito principal envolvido, dê uma dica do caminho de raciocínio (sem resolver) e gere uma consulta curta para buscar material de apoio.";

function dataUrlToBase64(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { mimeType: "image/jpeg", data: dataUrl };
  return { mimeType: match[1], data: match[2] };
}

async function visionGoogle(apiKey: string, imageDataUrl: string) {
  const { mimeType, data } = dataUrlToBase64(imageDataUrl);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{
        role: "user",
        parts: [
          { text: USER_PROMPT },
          { inlineData: { mimeType, data } },
        ],
      }],
      tools: [{
        functionDeclarations: [{
          name: "tira_duvida",
          description: "Retorna a explicação didática estruturada",
          parameters: TOOL_SCHEMA,
        }],
      }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["tira_duvida"] } },
      generationConfig: { temperature: 0.5 },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`google-vision-${res.status}:${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  const fnCall = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
  if (!fnCall?.args) throw new Error("google-vision: sem functionCall");
  return fnCall.args as { topic: string; concept: string; hint: string; search_query: string };
}

async function visionLovable(apiKey: string, imageDataUrl: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "tira_duvida",
          description: "Retorna a explicação didática estruturada",
          parameters: { ...TOOL_SCHEMA, additionalProperties: false },
        },
      }],
      tool_choice: { type: "function", function: { name: "tira_duvida" } },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    const err: any = new Error(`lovable-vision-${res.status}`);
    err.status = res.status;
    err.body = txt;
    throw err;
  }
  const json = await res.json();
  const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("lovable-vision: sem tool_call");
  return JSON.parse(toolCall.function.arguments) as { topic: string; concept: string; hint: string; search_query: string };
}

async function embedGoogle(apiKey: string, text: string): Promise<number[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  if (!res.ok) {
    console.warn("google-embed falhou", res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const json = await res.json();
  return json?.embedding?.values ?? null;
}

async function embedLovable(apiKey: string, text: string): Promise<number[] | null> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/text-embedding-004", input: text }),
  });
  if (!res.ok) {
    console.warn("lovable-embed falhou", res.status);
    return null;
  }
  const json = await res.json();
  return json?.data?.[0]?.embedding ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const imageDataUrl: string | undefined = body.image;
    const imagePath: string | undefined = body.image_path;
    const imageUrl: string | undefined = body.image_url;
    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "Imagem ausente" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Daily limit
    const { data: countToday } = await userClient.rpc("count_tira_duvidas_today", { _user_id: user.id });
    if ((countToday ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Limite diário de ${DAILY_LIMIT} dúvidas atingido. Tente novamente amanhã.` }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read provider preference (admin client to bypass RLS on app_settings if needed)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    let preferGoogle = false;
    try {
      const { data: setting } = await admin.from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
      const v: any = setting?.value;
      preferGoogle = v === "google" || v?.provider === "google" || v?.preferGoogle === true;
    } catch (e) {
      console.warn("app_settings read err", e);
    }

    // Step 1: Vision
    let args: { topic: string; concept: string; hint: string; search_query: string } | null = null;
    let provider: "google-direct" | "lovable-ai" = "lovable-ai";

    if (preferGoogle && GOOGLE_AI_API_KEY) {
      try {
        args = await visionGoogle(GOOGLE_AI_API_KEY, imageDataUrl);
        provider = "google-direct";
      } catch (e) {
        console.warn("Google vision falhou, fallback Lovable:", (e as Error).message);
      }
    }

    if (!args) {
      if (!LOVABLE_API_KEY) {
        // Sem Lovable: tenta Google direto como último recurso
        if (GOOGLE_AI_API_KEY) {
          try {
            args = await visionGoogle(GOOGLE_AI_API_KEY, imageDataUrl);
            provider = "google-direct";
          } catch (e) {
            console.error("google fallback fatal", e);
            return new Response(JSON.stringify({ error: "Falha na análise da imagem (provedor Google indisponível)." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else {
          return new Response(JSON.stringify({ error: "Nenhum provedor de IA configurado." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } else {
        try {
          args = await visionLovable(LOVABLE_API_KEY, imageDataUrl);
        } catch (e: any) {
          const status = e?.status;
          console.error("lovable vision falhou", status, e?.body?.slice?.(0, 300));
          if (status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": "lovable-ai" } });
          if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Ative sua chave Google AI Studio no Admin ou avise o administrador." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": "lovable-ai" } });

          // Último fallback: tenta Google direto se a chave existir
          if (GOOGLE_AI_API_KEY) {
            try {
              args = await visionGoogle(GOOGLE_AI_API_KEY, imageDataUrl);
              provider = "google-direct";
            } catch (e2) {
              console.error("google ultimate fallback fatal", e2);
              return new Response(JSON.stringify({ error: "Falha na análise da imagem. Tente novamente em instantes." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          } else {
            return new Response(JSON.stringify({ error: "Falha na análise da imagem. Tente novamente em instantes." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
    }

    const { topic, concept, hint, search_query } = args;

    // Step 2: Embed search query (mesma preferência)
    let relatedApostila: { id: string; title: string; category: string; similarity: number } | null = null;
    try {
      const text = `${topic}\n${search_query}`;
      let vec: number[] | null = null;
      if (preferGoogle && GOOGLE_AI_API_KEY) vec = await embedGoogle(GOOGLE_AI_API_KEY, text);
      if (!vec && LOVABLE_API_KEY) vec = await embedLovable(LOVABLE_API_KEY, text);
      if (vec) {
        const { data: matches } = await admin.rpc("match_apostila", { _embedding: vec as any });
        if (matches && matches.length > 0) relatedApostila = matches[0] as any;
      }
    } catch (e) {
      console.error("embed/match err", e);
    }

    const fullAnswer = `**Tema:** ${topic}\n\n## Conceito\n${concept}\n\n## Dica de resolução\n${hint}`;

    // Step 3: Save
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
      provider,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": provider } });
  } catch (e) {
    console.error("fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
