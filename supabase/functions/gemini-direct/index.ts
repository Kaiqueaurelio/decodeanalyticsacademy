// Edge function: chama Google AI Studio (Gemini) direto com a chave do usuário.
// Faz fallback automático para Lovable AI Gateway em caso de erro.
// Suporta streaming SSE no formato OpenAI-compatible (delta.content).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Msg {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";
const DEFAULT_LOVABLE_MODEL = "google/gemini-2.5-flash";

function toGeminiContents(messages: Msg[]) {
  // Gemini API expects { role: 'user'|'model', parts: [{text}] }
  // System instruction goes in a separate field.
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return { system, contents };
}

async function callGoogleStream(apiKey: string, model: string, messages: Msg[]) {
  const { system, contents } = toGeminiContents(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: { temperature: 0.7 },
    }),
  });
}

async function callLovableStream(apiKey: string, model: string, messages: Msg[]) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

// Converte stream SSE do Google (formato Gemini) para SSE no formato OpenAI delta
function googleToOpenAIStream(googleBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = googleBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
            if (text) {
              const chunk = {
                choices: [{ delta: { content: text } }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
          } catch {
            // partial JSON — devolve ao buffer
            buffer = line + "\n" + buffer;
            break;
          }
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const body = await req.json();
    const messages: Msg[] = Array.isArray(body.messages) ? body.messages : [];
    const systemPrompt: string | undefined = body.systemPrompt;
    const googleModel: string = body.googleModel || DEFAULT_GOOGLE_MODEL;
    const lovableModel: string = body.lovableModel || DEFAULT_LOVABLE_MODEL;

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalMessages: Msg[] = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages.filter((m) => m.role !== "system")]
      : messages;

    // Tenta Google primeiro se houver chave
    if (GOOGLE_AI_API_KEY) {
      try {
        const gResp = await callGoogleStream(GOOGLE_AI_API_KEY, googleModel, finalMessages);
        if (gResp.ok && gResp.body) {
          const transformed = googleToOpenAIStream(gResp.body);
          return new Response(transformed, {
            headers: {
              ...corsHeaders,
              "Content-Type": "text/event-stream",
              "X-AI-Provider": "google-direct",
            },
          });
        }
        const errText = await gResp.text();
        console.warn("Google AI falhou, fallback Lovable:", gResp.status, errText.slice(0, 300));
      } catch (e) {
        console.warn("Google AI exception, fallback Lovable:", e);
      }
    }

    // Fallback Lovable AI
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Nenhum provedor de IA configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lResp = await callLovableStream(LOVABLE_API_KEY, lovableModel, finalMessages);
    if (!lResp.ok) {
      if (lResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (lResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await lResp.text();
      console.error("Lovable AI error", lResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no provedor de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(lResp.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-AI-Provider": "lovable-fallback",
      },
    });
  } catch (e) {
    console.error("gemini-direct error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
