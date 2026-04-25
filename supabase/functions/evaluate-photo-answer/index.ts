// Avalia resposta manuscrita do aluno usando Lovable AI (visão).
// Recebe: { exercise_id, image_urls: string[], user_text?: string }
// Retorna: { correct: 'correct'|'partial'|'incorrect', score: number,
//            detected_answer: string, expected_answer: string, feedback: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function buildPrompt(ex: any) {
  const t = ex.question_type || "essay";
  const exp = ex.expected_answer || {};

  const typeLabel: Record<string, string> = {
    objective: "objetiva",
    essay: "dissertativa textual",
    calculation: "cálculo matemático manuscrito",
    graph: "grafo / árvore / busca (BFS, DFS, gulosa, caminho mínimo)",
    algorithm: "teste de mesa / pseudocódigo / código manuscrito",
  };

  const expectedDescription = [
    exp.description ? `Descrição do gabarito:\n${exp.description}` : "",
    exp.expected_path ? `Caminho esperado: ${exp.expected_path}` : "",
    exp.expected_cost != null ? `Custo total esperado: ${exp.expected_cost}` : "",
    exp.expected_result != null ? `Resultado numérico esperado: ${exp.expected_result}` : "",
    exp.tolerance != null ? `Tolerância: ±${exp.tolerance}` : "",
    Array.isArray(exp.expected_steps) && exp.expected_steps.length
      ? `Passos esperados:\n${exp.expected_steps.map((s: string, i: number) => `  ${i + 1}. ${s}`).join("\n")}`
      : "",
    exp.algorithm ? `Algoritmo de referência: ${exp.algorithm}` : "",
    ex.reference_answer ? `Resposta modelo (texto): ${ex.reference_answer}` : "",
    ex.explanation ? `Explicação/comentários: ${ex.explanation}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `Você é um professor universitário avaliando uma resposta MANUSCRITA enviada por foto.

Tipo da questão: ${typeLabel[t] || t}

ENUNCIADO:
${ex.question}

GABARITO ESTRUTURADO:
${expectedDescription || "(sem gabarito estruturado — use bom senso acadêmico e o enunciado)"}

INSTRUÇÕES:
1. Faça OCR da(s) imagem(ns) e descreva o que o aluno escreveu/desenhou.
2. Para grafos: identifique nós, arestas, pesos, caminho percorrido, custo total.
3. Para teste de mesa: identifique a tabela de variáveis, iterações, valores finais.
4. Para cálculo: extraia operações, valores intermediários e resultado final.
5. Para código manuscrito: extraia o pseudocódigo/código e avalie a lógica.
6. Compare com o gabarito. Considere TOLERÂNCIA quando informada.
7. Classifique: "correct" (≥85% certo), "partial" (40-84%), "incorrect" (<40%).
8. Score: 0 a 100.
9. Feedback em português, didático, indicando o que está certo, o que está errado e como corrigir.

Responda EXCLUSIVAMENTE chamando a tool grade_answer.`;
}

const TOOL = {
  type: "function",
  function: {
    name: "grade_answer",
    description: "Retorna a correção estruturada da resposta manuscrita.",
    parameters: {
      type: "object",
      properties: {
        correct: { type: "string", enum: ["correct", "partial", "incorrect"] },
        score: { type: "number", description: "0 a 100" },
        detected_answer: { type: "string", description: "O que o aluno respondeu (extraído da imagem)" },
        expected_answer: { type: "string", description: "Resumo do que era esperado" },
        feedback: { type: "string", description: "Feedback didático em português" },
      },
      required: ["correct", "score", "detected_answer", "expected_answer", "feedback"],
      additionalProperties: false,
    },
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { exercise_id, image_urls, user_text } = body || {};

    if (!exercise_id || !Array.isArray(image_urls) || image_urls.length === 0) {
      return new Response(JSON.stringify({ error: "exercise_id e image_urls são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: ex, error: exErr } = await admin
      .from("exercises")
      .select("id, question, question_type, expected_answer, reference_answer, explanation, correct_answer")
      .eq("id", exercise_id)
      .maybeSingle();

    if (exErr || !ex) {
      return new Response(JSON.stringify({ error: "Exercício não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(ex);

    const userContent: any[] = [{ type: "text", text: user_text ? `Texto adicional do aluno: ${user_text}` : "Avalie as imagens." }];
    for (const url of image_urls.slice(0, 6)) {
      userContent.push({ type: "image_url", image_url: { url } });
    }

    const aiRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "grade_answer" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Avise o administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha na avaliação por IA", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Sem tool_call na resposta:", JSON.stringify(aiJson).slice(0, 500));
      return new Response(JSON.stringify({ error: "IA não retornou avaliação estruturada." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Resposta da IA inválida." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const correct = ["correct", "partial", "incorrect"].includes(parsed.correct) ? parsed.correct : "incorrect";

    // Persistir todas as imagens enviadas + resultado em respostas_foto
    const inserts = image_urls.map((url: string) => ({
      user_id: user.id,
      exercise_id,
      imagem_url: url,
      nota: score,
      score,
      correct,
      detected_answer: String(parsed.detected_answer || "").slice(0, 4000),
      expected_answer_snapshot: String(parsed.expected_answer || "").slice(0, 4000),
      feedback_ia: String(parsed.feedback || "").slice(0, 4000),
    }));

    await admin.from("respostas_foto").insert(inserts);

    return new Response(
      JSON.stringify({
        correct,
        score,
        detected_answer: parsed.detected_answer,
        expected_answer: parsed.expected_answer,
        feedback: parsed.feedback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("evaluate-photo-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
