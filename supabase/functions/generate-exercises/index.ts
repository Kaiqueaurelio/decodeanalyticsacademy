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
    const { content, title, count } = await req.json();

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

    const truncatedContent = content.slice(0, 12000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Voce e um professor universitario especialista em criar questoes para avaliacao. Gere exatamente 10 exercicios baseados no conteudo fornecido:
- Os primeiros 8 exercicios devem ser de MULTIPLA ESCOLHA com 4 alternativas (A, B, C, D), sendo apenas uma correta. Inclua explicacao para cada.
- Os ultimos 2 exercicios devem ser DISSERTATIVOS (perguntas abertas que exigem resposta escrita). Para dissertativas, nao inclua options, defina type como "essay", e inclua uma resposta modelo no campo explanation.

IMPORTANTE: Sempre gere exatamente 8 questoes de multipla escolha seguidas de 2 questoes dissertativas.`,
          },
          {
            role: "user",
            content: `Titulo: ${title || "Sem titulo"}\n\nConteudo:\n${truncatedContent}\n\nGere 10 exercicios (8 multipla escolha + 2 dissertativas) sobre este conteudo.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_exercises",
              description: "Return the generated exercises (8 multiple choice + 2 essay)",
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
                          description: "Type of exercise: multiple_choice or essay",
                        },
                        question: { type: "string", description: "The question text" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Array of 4 options for multiple choice (empty for essay)",
                        },
                        correct_answer: {
                          type: "string",
                          description: "The correct answer letter (A-D) for multiple choice, or empty string for essay",
                        },
                        explanation: {
                          type: "string",
                          description: "Explanation of the correct answer, or model answer for essay questions",
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
