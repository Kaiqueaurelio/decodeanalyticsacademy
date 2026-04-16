// Edge function: chat didático restrito ao conteúdo da apostila
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Msg {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY && !GOOGLE_AI_API_KEY) throw new Error("Nenhum provedor de IA configurado");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const apostilaId: string = body.apostilaId;
    const messages: Msg[] = Array.isArray(body.messages) ? body.messages : [];

    if (!apostilaId || messages.length === 0) {
      return new Response(JSON.stringify({ error: "apostilaId e messages são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega a apostila (RLS garante que o aluno só pega publicadas)
    const { data: apostila, error: apErr } = await supabase
      .from("apostilas")
      .select("title, category, content")
      .eq("id", apostilaId)
      .maybeSingle();

    if (apErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lê preferência global de provedor
    const { data: settingRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ai_provider")
      .maybeSingle();
    const preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;

    // Trunca conteúdo para caber no contexto (~120k chars é seguro)
    const apostilaContent = (apostila.content || "").slice(0, 120000);

    const systemPrompt = `Você é um tutor didático da Decode Analytics Academy ajudando um aluno a estudar a apostila "${apostila.title}" (${apostila.category}).

REGRAS RIGOROSAS:
1. Você SÓ pode usar fatos, definições, exemplos e dados que estão no CONTEÚDO DA APOSTILA abaixo.
2. Você PODE explicar de forma diferente, dar analogias, reformular, simplificar e propor exercícios — desde que o conteúdo factual venha da apostila.
3. Se o aluno perguntar algo que NÃO está na apostila, responda exatamente: "Isso não está coberto nesta apostila. Sugiro consultar outro material ou perguntar ao professor." e depois indique tópicos relacionados que ESTÃO na apostila.
4. NÃO invente fatos, datas, autores, fórmulas, números ou citações que não estejam no conteúdo abaixo.
5. Sempre responda em português brasileiro, de forma clara, didática e amigável.
6. Use markdown (negrito, listas, código) para deixar as respostas legíveis.
7. Quando útil, cite o trecho/seção da apostila que embasa sua resposta.

==== CONTEÚDO DA APOSTILA ====
${apostilaContent}
==== FIM DO CONTEÚDO ====`;

    // Helpers ===========================================================
    const callGoogle = async () => {
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7 },
        }),
      });
    };

    const callLovable = async () => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      });
    };

    // Converte SSE Gemini → SSE OpenAI delta
    const transformGoogle = (input: ReadableStream<Uint8Array>) => {
      const reader = input.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buf = "";
      return new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (!json) continue;
            try {
              const parsed = JSON.parse(json);
              const text = parsed?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
              if (text) {
                const chunk = { choices: [{ delta: { content: text } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        },
      });
    };

    // Tenta Google primeiro se preferido
    let aiResp: Response | null = null;
    let provider = "lovable";
    if (preferGoogle) {
      try {
        const g = await callGoogle();
        if (g.ok && g.body) {
          provider = "google-direct";
          return new Response(transformGoogle(g.body), {
            headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-AI-Provider": provider },
          });
        }
        console.warn("Google falhou, fallback Lovable:", g.status, (await g.text()).slice(0, 300));
      } catch (e) {
        console.warn("Google exception, fallback Lovable:", e);
      }
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Provedor indisponível" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    aiResp = await callLovable();

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde um instante." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Avise o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no provedor de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-AI-Provider": provider },
    });
  } catch (e) {
    console.error("apostila-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
