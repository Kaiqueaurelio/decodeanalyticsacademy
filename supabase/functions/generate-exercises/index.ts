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

    // Reparo de JSON truncado: tenta extrair o array exercises mesmo se cortado
    const tryRepairJson = (text: string): { exercises: any[] } | null => {
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      // 1) parse direto
      try {
        const p = JSON.parse(cleaned);
        if (Array.isArray(p?.exercises)) return p;
      } catch {/* continua */}
      // 2) extrai objetos completos do array exercises
      const startIdx = cleaned.indexOf('"exercises"');
      if (startIdx === -1) return null;
      const arrStart = cleaned.indexOf("[", startIdx);
      if (arrStart === -1) return null;
      const items: any[] = [];
      let i = arrStart + 1;
      while (i < cleaned.length) {
        // pula whitespace e vírgulas
        while (i < cleaned.length && /[\s,]/.test(cleaned[i])) i++;
        if (i >= cleaned.length || cleaned[i] === "]") break;
        if (cleaned[i] !== "{") break;
        // encontra o fechamento balanceado deste objeto
        let depth = 0;
        let inStr = false;
        let esc = false;
        const objStart = i;
        for (; i < cleaned.length; i++) {
          const ch = cleaned[i];
          if (inStr) {
            if (esc) esc = false;
            else if (ch === "\\") esc = true;
            else if (ch === '"') inStr = false;
          } else {
            if (ch === '"') inStr = true;
            else if (ch === "{") depth++;
            else if (ch === "}") {
              depth--;
              if (depth === 0) { i++; break; }
            }
          }
        }
        if (depth !== 0) break; // último objeto truncado — descarta
        const objText = cleaned.slice(objStart, i);
        try { items.push(JSON.parse(objText)); } catch {/* descarta inválido */}
      }
      return items.length ? { exercises: items } : null;
    };

    // ====== Provider A: Google AI Studio (JSON mode) ======
    const callGoogle = async (maxTokensOverride?: number): Promise<{ exercises: any[] } | null> => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      const maxOutputTokens = maxTokensOverride ?? Math.min(32000, Math.max(4000, total * 1200));
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt + "\n\nResponda SOMENTE com JSON puro no formato { \"exercises\": [...] } sem texto extra. Mantenha explanations concisas (2-3 frases) para caber no limite de tokens." }] },
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("Google generate-exercises HTTP error", resp.status, t.slice(0, 400));
        return null;
      }
      const data = await resp.json();
      const finishReason = data?.candidates?.[0]?.finishReason;
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      console.log("Google response: finishReason=", finishReason, "len=", text.length, "maxTokens=", maxOutputTokens);
      const repaired = tryRepairJson(text);
      if (repaired && repaired.exercises.length > 0) {
        console.log("Google parsed/repaired exercises:", repaired.exercises.length);
        return repaired;
      }
      console.error("Google JSON irrecuperável. finishReason=", finishReason, "preview=", text.slice(0, 300));
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
      if ((!parsed || !parsed.exercises?.length) && GOOGLE_AI_API_KEY) {
        // Retry com mais tokens caso tenha sido truncado
        console.log("Google retry com 32000 tokens");
        parsed = await callGoogle(32000);
        providerUsed = "google-direct-retry";
      }
      if ((!parsed || !parsed.exercises?.length) && LOVABLE_API_KEY) {
        const r = await callLovable();
        if (r && !("__status" in r)) { parsed = r; providerUsed = "lovable-fallback"; }
      }
    } else if (LOVABLE_API_KEY) {
      const r = await callLovable();
      if (r && "__status" in r) {
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
      if (!parsed || !parsed.exercises?.length) {
        parsed = await callGoogle(32000);
        providerUsed = "google-direct-retry";
      }
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
