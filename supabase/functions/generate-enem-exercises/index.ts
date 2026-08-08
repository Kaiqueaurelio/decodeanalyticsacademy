import { getCorsHeaders } from "../_shared/cors.ts";
// Geração de questões estilo ENEM: contextualização longa,
// 5 alternativas (A-E), explicação da correta E por que cada distrator
// está errado. Salva em `exercises` vinculadas ao apostila_id.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireUser } from "../_shared/auth-guard.ts";


const SYSTEM = `Você é um elaborador oficial de questões do ENEM.

Regras absolutas:
1. Cada questão tem TEXTO DE APOIO (contextualização de 5 a 12 linhas: notícia, trecho literário, tabela, situação-problema, gráfico descrito em texto, etc). Após o texto de apoio, um comando claro e OBJETIVO.
2. 5 alternativas rotuladas (A), (B), (C), (D), (E). Apenas UMA correta. Distratores plausíveis, todos com o mesmo estilo e comprimento parecido.
3. A explicação tem obrigatoriamente 2 partes:
   - "correta": justificativa completa da opção certa, referenciando o texto de apoio.
   - "distratores": objeto com chaves A-E explicando por que cada alternativa errada está errada (exceto a correta).
4. Linguagem culta em português do Brasil. Não use marcas comerciais reais.
5. Diversifique competências (interpretar, calcular, comparar, contextualizar).
6. Nada de "todas as anteriores", "nenhuma das anteriores" ou pegadinhas triviais.

Retorne APENAS JSON válido conforme o schema, sem comentários.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const auth = await requireUser(req, getCorsHeaders(req), { requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const { apostila_id, area, count } = await req.json();
    if (!apostila_id) {
      return new Response(JSON.stringify({ error: "apostila_id required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const n = Math.min(Math.max(Number(count) || 10, 1), 20);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: apostila } = await admin
      .from("apostilas")
      .select("id, title, category, content")
      .eq("id", apostila_id)
      .single();
    if (!apostila) {
      return new Response(JSON.stringify({ error: "Apostila not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const areaLabel = area || apostila.category || "conteúdo geral";
    const truncated = ((apostila.content as string) || "").slice(0, 22000);

    const user = `Área ENEM: ${areaLabel}
Matéria/Apostila: ${apostila.title}

Conteúdo de referência (use como base factual):
"""
${truncated}
"""

Gere ${n} questões inéditas no formato ENEM, cobrindo tópicos variados do conteúdo acima. Devolva JSON com o shape:
{
  "questions": [
    {
      "context": "texto de apoio (5-12 linhas)",
      "question": "comando objetivo terminado em ':' ou '?'",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "correct_answer": "A" | "B" | "C" | "D" | "E",
      "explanation_correct": "por que a resposta certa é correta",
      "explanation_distractors": { "A": "...", "B": "...", ... }
    }
  ]
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      return new Response(
        JSON.stringify({ error: "AI request failed", status: aiRes.status, details: errBody }),
        { status: aiRes.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }
    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI returned invalid JSON", raw }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (!questions.length) {
      return new Response(JSON.stringify({ error: "No questions produced" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rows = questions.map((q: any) => {
      const opts = q.options || {};
      const options = ["A", "B", "C", "D", "E"]
        .map((k) => (opts[k] ? `${k}) ${String(opts[k]).trim()}` : null))
        .filter(Boolean);
      const explain =
        `${q.explanation_correct || ""}\n\n` +
        (q.explanation_distractors
          ? Object.entries(q.explanation_distractors)
              .map(([k, v]) => `Por que **${k}** não serve: ${v}`)
              .join("\n")
          : "");
      return {
        apostila_id,
        question: `${q.context ? q.context + "\n\n" : ""}${q.question || ""}`,
        options,
        correct_answer: q.correct_answer,
        explanation: explain.trim(),
        question_type: "objective",
      };
    });

    const { error: insErr, data: inserted } = await admin
      .from("exercises")
      .insert(rows)
      .select("id");
    if (insErr) {
      return new Response(
        JSON.stringify({ error: "Insert failed", details: insErr.message }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, inserted: inserted?.length ?? rows.length }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
