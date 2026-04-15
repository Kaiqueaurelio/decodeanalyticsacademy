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

    const exerciseCount = Math.min(Math.max(count || 8, 3), 15);
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
            content: `Voce e um professor universitario especialista em criar questoes de multipla escolha. Gere exatamente ${exerciseCount} exercicios de multipla escolha baseados no conteudo fornecido. Cada exercicio deve ter 4 alternativas (A, B, C, D), sendo apenas uma correta. Inclua uma explicacao clara para cada resposta correta.`,
          },
          {
            role: "user",
            content: `Titulo: ${title || "Sem titulo"}\n\nConteudo:\n${truncatedContent}\n\nGere ${exerciseCount} exercicios de multipla escolha sobre este conteudo.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_exercises",
              description: "Return the generated multiple choice exercises",
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "The question text" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Array of 4 options (A, B, C, D text only)",
                        },
                        correct_answer: {
                          type: "string",
                          enum: ["A", "B", "C", "D"],
                          description: "The correct answer letter",
                        },
                        explanation: {
                          type: "string",
                          description: "Explanation of the correct answer",
                        },
                      },
                      required: ["question", "options", "correct_answer", "explanation"],
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
      (ex: any) => ex.question && Array.isArray(ex.options) && ex.options.length >= 2 && ex.correct_answer
    );

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
