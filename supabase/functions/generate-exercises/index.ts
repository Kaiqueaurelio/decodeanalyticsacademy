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

    const truncatedContent = content.slice(0, 12000);

    let systemPrompt = `Voce e um professor universitario especialista em criar questoes para avaliacao. Gere exatamente ${total} exercicios baseados no conteudo fornecido:`;
    
    if (mc > 0) {
      systemPrompt += `\n- ${mc} exercicio(s) de MULTIPLA ESCOLHA com 4 alternativas (A, B, C, D), sendo apenas uma correta. Defina type como "multiple_choice". Inclua explicacao para cada.`;
    }
    if (essay > 0) {
      systemPrompt += `\n- ${essay} exercicio(s) DISSERTATIVO(S) (perguntas abertas que exigem resposta escrita). Defina type como "essay", nao inclua options, e inclua uma resposta modelo no campo explanation.`;
    }
    if (mc > 0 && essay > 0) {
      systemPrompt += `\n\nIMPORTANTE: Gere primeiro as ${mc} questoes de multipla escolha, depois as ${essay} dissertativas.`;
    }

    const userPrompt = `Titulo: ${title || "Sem titulo"}\n\nConteudo:\n${truncatedContent}\n\nGere ${total} exercicios (${mc} multipla escolha + ${essay} dissertativas) sobre este conteudo.`;

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
                          description: "Explanation or model answer for essay questions",
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Resposta inesperada da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
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
