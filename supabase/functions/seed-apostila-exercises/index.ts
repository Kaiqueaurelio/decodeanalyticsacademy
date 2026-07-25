// Seed exercises for a single apostila via Lovable AI.
// Auth: admin user JWT OR service-role bearer (para uso interno/batch).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI provider ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: uData, error: uErr } = await userClient.auth.getUser();
      if (uErr || !uData.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uData.user.id, _role: "admin" });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const apostilaId = String(body?.apostilaId ?? "").trim();
    const count = Math.min(Math.max(Number(body?.count ?? 8), 1), 15);
    const skipIfExists = body?.skipIfExists !== false; // default true

    if (!apostilaId) {
      return new Response(JSON.stringify({ error: "apostilaId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: apostila, error: apErr } = await admin
      .from("apostilas")
      .select("id, title, content, category")
      .eq("id", apostilaId)
      .maybeSingle();
    if (apErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (skipIfExists) {
      const { count: existing } = await admin
        .from("exercises")
        .select("id", { count: "exact", head: true })
        .eq("apostila_id", apostilaId);
      if ((existing ?? 0) > 0) {
        return new Response(JSON.stringify({ ok: true, skipped: true, existing }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const content = String(apostila.content ?? "").slice(0, 25000);
    if (content.trim().length < 60) {
      return new Response(JSON.stringify({ error: "Conteúdo insuficiente" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `Você é um examinador brasileiro estilo ENEM/vestibular. Gere EXATAMENTE ${count} questões objetivas de múltipla escolha (4 alternativas A-D), baseadas RIGOROSAMENTE no conteúdo. Distratores plausíveis, sem pegadinhas baratas. Explicação com 2-3 frases justificando pela apostila. Português-BR.`;
    const user = `Título: ${apostila.title}\nCategoria: ${apostila.category}\n\nConteúdo:\n${content}\n\nGere ${count} questões objetivas.`;

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [ { role: "system", content: system }, { role: "user", content: user } ],
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
                      correct_answer: { type: "string", description: "Letra A-D" },
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

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: `AI ${resp.status}`, detail: t.slice(0, 300) }), {
        status: resp.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await resp.json();
    const argsStr = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = null;
    try { parsed = JSON.parse(argsStr || "{}"); } catch { parsed = null; }
    const items: any[] = Array.isArray(parsed?.exercises) ? parsed.exercises : [];
    if (!items.length) {
      return new Response(JSON.stringify({ error: "IA não retornou questões" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inserted, error: insErr } = await admin.from("exercises").insert(rows).select("id");
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, inserted: inserted?.length ?? 0, apostilaId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
