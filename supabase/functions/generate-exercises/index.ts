import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mc = Math.min(Math.max(mcCount ?? 8, 0), 30);
    const essay = Math.min(Math.max(essayCount ?? 2, 0), 10);
    const total = mc + essay;

    if (total < 1) {
      return new Response(
        JSON.stringify({ error: "Selecione pelo menos 1 exercicio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Aumentado de 12k para 30k — Flash aguenta tranquilo e dá MUITO mais contexto
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

    // max_tokens proporcional ao numero de questoes (≈ 600 tokens por questao com explicacao detalhada)
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
        tools: [
          {
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
                        type: {
                          type: "string",
                          enum: ["multiple_choice", "essay"],
                          description: "Type of exercise",
                        },
                        question: { type: "string", description: "The question text" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Array of 4 options for multiple choice (empty array for essay)",
                        },
                        correct_answer: {
                          type: "string",
                          description: "Correct answer letter (A-D) for MC, or empty for essay",
                        },
                        explanation: {
                          type: "string",
                          description: "Detailed explanation (MC) or model answer (essay)",
                        },
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
          },
        ],
        tool_choice: { type: "function", function: { name: "return_exercises" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Creditos insuficientes. Adicione creditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar exercicios" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const finishReason = choice?.finish_reason;
    const toolCall = choice?.message?.tool_calls?.[0];

    if (finishReason === "length" || finishReason === "MAX_TOKENS") {
      console.error("Resposta truncada por max_tokens. finish_reason:", finishReason);
    }

    if (!toolCall?.function?.arguments) {
      console.error("Sem tool_call. data:", JSON.stringify(data).slice(0, 800));
      return new Response(
        JSON.stringify({ error: "A IA nao conseguiu gerar exercicios estruturados. Tente reduzir o numero de questoes ou simplificar o conteudo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: { exercises?: any[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("JSON parse falhou. args:", toolCall.function.arguments?.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Resposta da IA chegou incompleta. Tente novamente com menos questoes." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const exercises = (parsed.exercises || []).filter(
      (ex: any) => ex.question && ex.type
    ).map((ex: any) => ({
      type: ex.type || "multiple_choice",
      question: ex.question,
      options: ex.type === "essay" ? [] : (ex.options || []),
      correct_answer: ex.type === "essay" ? "dissertativa" : (ex.correct_answer || "A"),
      explanation: ex.explanation || "",
    }));

    return new Response(JSON.stringify({ exercises }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-exercises error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
