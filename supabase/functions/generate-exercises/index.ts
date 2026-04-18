import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, mcCount, essayCount } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Conteudo insuficiente para gerar exercicios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!LOVABLE_API_KEY && !GOOGLE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Nenhum provedor de IA configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lê preferência global preferGoogle
    let preferGoogle = false;
    try {
      const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: settingRow } = await supa
        .from("app_settings")
        .select("value")
        .eq("key", "ai_provider")
        .maybeSingle();
      preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;
    } catch {/* ignore */}

    const mc = Math.min(Math.max(mcCount ?? 8, 0), 30);
    const essay = Math.min(Math.max(essayCount ?? 2, 0), 10);
    const total = mc + essay;

    if (total < 1) {
      return new Response(
        JSON.stringify({ error: "Selecione pelo menos 1 exercicio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncatedContent = content.slice(0, 30000);

    let systemPrompt = `Voce e um professor universitario brasileiro especialista em criar questoes de avaliacao de alta qualidade.

REGRAS OBRIGATORIAS:
- Gere EXATAMENTE ${total} exercicios baseados estritamente no conteudo fornecido.
- Toda questao deve testar entendimento real do conteudo (nao perguntas triviais ou genericas).
- Toda explicacao deve ser DETALHADA (minimo 2 frases) e justificar a resposta correta usando o conteudo.
- Evite alternativas obvias ou pegadinhas baratas. Distratores devem ser plausiveis.
- Linguagem clara, em portugues do Brasil.`;

    if (mc > 0) {
      systemPrompt += `\n- ${mc} exercicio(s) de MULTIPLA ESCOLHA com 4 alternativas (A, B, C, D), sendo apenas uma correta. type="multiple_choice".`;
    }
    if (essay > 0) {
      systemPrompt += `\n- ${essay} exercicio(s) DISSERTATIVO(S) (perguntas abertas). type="essay", options vazio, e o campo explanation deve conter uma resposta modelo COMPLETA (4-6 frases) que servira de gabarito.`;
    }
    if (mc > 0 && essay > 0) {
      systemPrompt += `\n\nORDEM: gere primeiro as ${mc} de multipla escolha, depois as ${essay} dissertativas.`;
    }

    const userPrompt = `Titulo: ${title || "Sem titulo"}\n\nConteudo da apostila:\n${truncatedContent}\n\nGere ${total} exercicios (${mc} multipla escolha + ${essay} dissertativas) baseados rigorosamente no conteudo acima.`;

    // ====== Provider A: Google AI Studio (JSON mode) ======
    const callGoogle = async (): Promise<{ exercises: any[] } | null> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt + "\n\nResponda SOMENTE com JSON puro no formato { \"exercises\": [...] } sem texto extra." }] },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: Math.min(16000, Math.max(2500, total * 700)),
            responseMimeType: "application/json",
          },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("Google generate-exercises error", resp.status, t.slice(0, 400));
        return null;
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      try {
        const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed?.exercises)) return parsed;
      } catch (e) {
        console.error("Google JSON parse falhou", e, text.slice(0, 400));
      }
      return null;
    };

    // ====== Provider B: Lovable AI Gateway (tool call) ======
    const callLovable = async (): Promise<{ exercises: any[] } | { __status: number, __err: string } | null> => {
      const dynamicMaxTokens = Math.min(16000, Math.max(2500, total * 700));
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: dynamicMaxTokens,
          tools: [{
            type: "function",
            function: {
              name: "return_exercises",
              description: `Return the generated exercises (${mc} multiple choice + ${essay} essay)`,
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["multiple_choice", "essay"] },
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" },
                      },
                      required: ["type", "question", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["exercises"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_exercises" } },
        }),
      });

      if (!response.ok) {
        return { __status: response.status, __err: await response.text().catch(() => "") };
      }
      const data = await response.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return null;
      try { return JSON.parse(args); } catch { return null; }
    };

    // ====== Estratégia: respeita preferência ======
    let parsed: { exercises?: any[] } | null = null;
    let providerUsed = "lovable";

    if (preferGoogle && GOOGLE_AI_API_KEY) {
      parsed = await callGoogle();
      providerUsed = "google-direct";
      if (!parsed && LOVABLE_API_KEY) {
        // fallback Lovable
        const r = await callLovable();
        if (r && !("__status" in r)) { parsed = r; providerUsed = "lovable-fallback"; }
      }
    } else if (LOVABLE_API_KEY) {
      const r = await callLovable();
      if (r && "__status" in r) {
        // Lovable falhou (402/429/etc) — tenta Google se houver chave
        if (GOOGLE_AI_API_KEY) {
          parsed = await callGoogle();
          providerUsed = "google-fallback";
        }
        if (!parsed) {
          let msg = "Erro no provedor de IA.";
          if (r.__status === 402) msg = "Créditos de Lovable AI esgotados. Ative sua chave Google AI Studio em Admin → IA.";
          else if (r.__status === 429) msg = "Muitas requisições. Aguarde alguns segundos.";
          return new Response(JSON.stringify({ error: msg, upstream_status: r.__status }), {
            status: r.__status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        parsed = r as any;
      }
    } else if (GOOGLE_AI_API_KEY) {
      parsed = await callGoogle();
      providerUsed = "google-direct";
    }

    if (!parsed?.exercises) {
      return new Response(JSON.stringify({ error: "A IA nao conseguiu gerar exercicios estruturados." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exercises = (parsed.exercises || []).filter((ex: any) => ex.question && ex.type).map((ex: any) => ({
      type: ex.type || "multiple_choice",
      question: ex.question,
      options: ex.type === "essay" ? [] : (ex.options || []),
      correct_answer: ex.type === "essay" ? "dissertativa" : (ex.correct_answer || "A"),
      explanation: ex.explanation || "",
    }));

    return new Response(JSON.stringify({ exercises, provider: providerUsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-AI-Provider": providerUsed },
    });
  } catch (e) {
    console.error("generate-exercises error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
