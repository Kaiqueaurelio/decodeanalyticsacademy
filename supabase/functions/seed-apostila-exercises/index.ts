import { getCorsHeaders } from "../_shared/cors.ts";
// Seed exercises for a single apostila via Lovable AI.
// Auth: admin user JWT OR service-role bearer (para uso interno/batch).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const getCorsHeaders(req) = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function letterFromOption(correct: string, options: string[]): string {
  const norm = (s: string) => (s || "").trim().toLowerCase();
  const c = norm(correct);
  if (/^[a-d]$/i.test(c)) return c.toUpperCase();
  const idx = options.findIndex((o) => norm(o) === c || norm(o).startsWith(c));
  return idx >= 0 ? String.fromCharCode(65 + idx) : "A";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI provider ausente" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const seedKey = req.headers.get("x-seed-key") ?? "";
    const INTERNAL_SEED_KEY = Deno.env.get("INTERNAL_SEED_KEY") ?? "";
    const isServiceRole = authHeader === `Bearer ${SERVICE}` || (INTERNAL_SEED_KEY.length > 8 && seedKey === INTERNAL_SEED_KEY);

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Se não for service role, valida user + admin.
    if (!isServiceRole) {
      if (!authHeader.toLowerCase().startsWith("bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: uData, error: uErr } = await userClient.auth.getUser();
      if (uErr || !uData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uData.user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const apostilaId = String(body?.apostilaId ?? "").trim();
    const count = Math.min(Math.max(Number(body?.count ?? 8), 1), 15);
    const skipIfExists = body?.skipIfExists !== false; // default true

    if (!apostilaId) {
      return new Response(JSON.stringify({ error: "apostilaId obrigatório" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: apostila, error: apErr } = await admin
      .from("apostilas")
      .select("id, title, content, category")
      .eq("id", apostilaId)
      .maybeSingle();
    if (apErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila não encontrada" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (skipIfExists) {
      const { count: existing } = await admin
        .from("exercises")
        .select("id", { count: "exact", head: true })
        .eq("apostila_id", apostilaId);
      if ((existing ?? 0) > 0) {
        return new Response(JSON.stringify({ ok: true, skipped: true, existing }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    const content = String(apostila.content ?? "").slice(0, 25000);
    if (content.trim().length < 60) {
      return new Response(JSON.stringify({ error: "Conteúdo insuficiente" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const system = `Você é um examinador brasileiro estilo ENEM/vestibular. Gere EXATAMENTE ${count} questões objetivas de múltipla escolha (4 alternativas A-D), baseadas RIGOROSAMENTE no conteúdo. Distratores plausíveis, sem pegadinhas baratas. Explicação com 2-3 frases justificando pela apostila. Português-BR.`;
    const userPrompt = `Título: ${apostila.title}\nCategoria: ${apostila.category}\n\nConteúdo:\n${content}\n\nGere ${count} questões objetivas.`;

    const GOOGLE_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    // Tenta Lovable Gateway; se 402/429/5xx, cai pro Google AI direto.
    async function callLovable(): Promise<{ items: any[] } | { err: string; status: number }> {
      const resp = await fetch(GATEWAY, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
          temperature: 0.4,
          tools: [{
            type: "function",
            function: {
              name: "return_exercises",
              description: "Retorna as questões geradas",
              parameters: {
                type: "object",
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" },
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
          }],
          tool_choice: { type: "function", function: { name: "return_exercises" } },
        }),
      });
      if (!resp.ok) return { err: (await resp.text()).slice(0, 300), status: resp.status };
      const j = await resp.json();
      const argsStr = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      try { const p = JSON.parse(argsStr || "{}"); return { items: Array.isArray(p.exercises) ? p.exercises : [] }; }
      catch { return { items: [] }; }
    }

    async function callGoogle(): Promise<{ items: any[] } | { err: string; status: number }> {
      if (!GOOGLE_KEY) return { err: "no google key", status: 500 };
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_KEY)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: system + '\n\nResponda SOMENTE JSON puro no formato {"exercises":[{"question":"...","options":["...","...","...","..."],"correct_answer":"A","explanation":"..."}]}.' }] },
          generationConfig: { temperature: 0.4, maxOutputTokens: 8000, responseMimeType: "application/json" },
        }),
      });
      if (!resp.ok) return { err: (await resp.text()).slice(0, 300), status: resp.status };
      const j = await resp.json();
      const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      try { const p = JSON.parse(cleaned); return { items: Array.isArray(p.exercises) ? p.exercises : [] }; }
      catch { return { items: [] }; }
    }

    let result = await callLovable();
    if ("err" in result && (result.status === 402 || result.status === 429 || result.status >= 500)) {
      const g = await callGoogle();
      if (!("err" in g)) result = g;
      else return new Response(JSON.stringify({ error: `AI ${result.status}/${g.status}`, detail: result.err + " | " + g.err }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    if ("err" in result) {
      return new Response(JSON.stringify({ error: `AI ${result.status}`, detail: result.err }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const items = result.items;
    if (!items.length) {
      return new Response(JSON.stringify({ error: "IA não retornou questões" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rows = items
      .filter((e) => e.question && Array.isArray(e.options) && e.options.length === 4)
      .slice(0, count)
      .map((e) => ({
        apostila_id: apostilaId,
        question: String(e.question).slice(0, 2000),
        options: e.options.map((o: any) => String(o).slice(0, 400)),
        correct_answer: letterFromOption(String(e.correct_answer ?? "A"), e.options),
        explanation: String(e.explanation ?? "").slice(0, 1500),
        question_type: "objective",
      }));

    if (!rows.length) {
      return new Response(JSON.stringify({ error: "Questões inválidas" }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insErr } = await admin.from("exercises").insert(rows).select("id");
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, inserted: inserted?.length ?? 0, apostilaId }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
