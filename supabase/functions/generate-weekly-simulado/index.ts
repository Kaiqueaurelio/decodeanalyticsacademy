import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const getCorsHeaders(req) = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUESTIONS_PER_SIMULADO = 20;

/**
 * Cria (ou retoma) o Simulado da Semana com 20 questões variadas, cobrindo várias disciplinas.
 * Estratégia:
 *  1. Verifica se já existe simulado em andamento — devolve.
 *  2. Senão, escolhe 20 questões objetivas no banco (exercises) priorizando:
 *     - matérias da próxima prova (calendar_events em até 14 dias)
 *     - apostilas com pomodoros recentes do usuário
 *     - distribuição justa entre disciplinas (até 4 por disciplina)
 *  3. Cria weekly_simulados + 20 weekly_simulado_answers vazios.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const force = !!body?.force;

    // 1) Simulado em andamento?
    if (!force) {
      const { data: inProgress } = await admin
        .from("weekly_simulados")
        .select("id, status, total_questions, started_at")
        .eq("user_id", userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (inProgress) {
        return new Response(JSON.stringify({ simulado_id: inProgress.id, resumed: true }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // 2) Provas próximas → matérias prioritárias
    const today = new Date();
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 14);
    const { data: events } = await admin
      .from("calendar_events")
      .select("subject, title, event_date")
      .gte("event_date", today.toISOString().slice(0, 10))
      .lte("event_date", horizon.toISOString().slice(0, 10))
      .in("event_type", ["prova", "trabalho", "entrega"]);

    const priorityCats = new Set<string>();
    (events ?? []).forEach((e: any) => {
      const v = (e.subject || e.title || "").toString().trim();
      if (v) priorityCats.add(v.toLowerCase());
    });

    // 3) Apostilas estudadas recentemente (pomodoros nas últimas 2 semanas)
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);
    const { data: pomos } = await admin
      .from("pomodoro_sessions")
      .select("apostila_id")
      .eq("user_id", userId)
      .gte("created_at", twoWeeksAgo.toISOString());
    const recentApostilaIds = new Set(
      (pomos ?? []).map((p: any) => p.apostila_id).filter(Boolean)
    );

    // 4) Pool de exercícios objetivos publicados
    const { data: pool } = await admin
      .from("exercises")
      .select("id, question, options, correct_answer, explanation, apostila_id, type, apostilas!inner(id, title, category, published)")
      .eq("type", "multiple_choice")
      .eq("apostilas.published", true)
      .limit(500);

    if (!pool || pool.length === 0) {
      return new Response(JSON.stringify({ error: "Ainda não há exercícios suficientes no banco para montar um simulado." }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 5) Score de prioridade
    const scored = pool.map((ex: any) => {
      const ap = ex.apostilas;
      const cat = (ap?.category || "Geral").toString();
      let score = Math.random(); // base aleatória pra variar
      if (priorityCats.has(cat.toLowerCase())) score += 5; // matéria de prova próxima
      if (recentApostilaIds.has(ap?.id)) score += 2; // apostila recente
      return { ...ex, _category: cat, _score: score };
    });

    scored.sort((a: any, b: any) => b._score - a._score);

    // 6) Diversidade: no máx 4 por disciplina, no máx 2 da mesma apostila
    const picked: any[] = [];
    const perSubject = new Map<string, number>();
    const perApostila = new Map<string, number>();

    for (const ex of scored) {
      if (picked.length >= QUESTIONS_PER_SIMULADO) break;
      const subj = ex._category;
      const ap = ex.apostila_id;
      if ((perSubject.get(subj) ?? 0) >= 4) continue;
      if ((perApostila.get(ap) ?? 0) >= 2) continue;
      picked.push(ex);
      perSubject.set(subj, (perSubject.get(subj) ?? 0) + 1);
      perApostila.set(ap, (perApostila.get(ap) ?? 0) + 1);
    }

    // 7) Se faltar (poucos exercícios), preenche relaxando a restrição
    if (picked.length < QUESTIONS_PER_SIMULADO) {
      for (const ex of scored) {
        if (picked.length >= QUESTIONS_PER_SIMULADO) break;
        if (picked.find((p) => p.id === ex.id)) continue;
        picked.push(ex);
      }
    }

    if (picked.length === 0) {
      return new Response(JSON.stringify({ error: "Sem exercícios disponíveis." }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 8) Cria o simulado
    const weekStart = (() => {
      const d = new Date(today);
      const dow = d.getDay(); // 0=dom
      d.setDate(d.getDate() - dow); // domingo da semana
      return d.toISOString().slice(0, 10);
    })();

    const { data: simulado, error: simErr } = await admin
      .from("weekly_simulados")
      .insert({
        user_id: userId,
        week_start: weekStart,
        status: "in_progress",
        total_questions: picked.length,
      })
      .select()
      .single();

    if (simErr || !simulado) {
      console.error("create simulado", simErr);
      return new Response(JSON.stringify({ error: "Não foi possível criar o simulado." }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 9) Insere as 20 questões
    const answers = picked.map((ex: any, idx: number) => ({
      simulado_id: simulado.id,
      user_id: userId,
      question_index: idx,
      exercise_id: ex.id,
      apostila_id: ex.apostila_id,
      subject: ex._category,
      question: ex.question,
      options: ex.options,
      correct_answer: ex.correct_answer,
      explanation: ex.explanation,
    }));

    const { error: ansErr } = await admin.from("weekly_simulado_answers").insert(answers);
    if (ansErr) {
      console.error("insert answers", ansErr);
      await admin.from("weekly_simulados").delete().eq("id", simulado.id);
      return new Response(JSON.stringify({ error: "Falha ao inserir questões." }), {
        status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      simulado_id: simulado.id,
      total: picked.length,
      subjects: Array.from(perSubject.keys()),
    }), { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-weekly-simulado error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
