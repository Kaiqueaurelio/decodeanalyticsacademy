import { getCorsHeaders } from "../_shared/cors.ts";
// Plano de Estudos Inteligente — geração e replanejamento assistido pela Ella.
//
// Segurança: exige usuário autenticado; o plano é sempre gravado com o user_id
// derivado do token (nunca do corpo da requisição). Ao ajustar um plano
// existente, a propriedade é verificada antes de qualquer escrita.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });

const LEVELS = ["iniciante", "intermediario", "avancado"] as const;

type Input = {
  mode?: "create" | "adjust" | "suggest";
  plan_id?: string;
  title?: string;
  goal?: string;
  area?: string;
  level?: string;
  subjects?: unknown;
  priorities?: unknown;
  hours_per_day?: unknown;
  days_per_week?: unknown;
  deadline?: string | null;
  notes?: string;
  suggestions?: unknown;
  version_note?: string;
};


function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function cleanText(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function validate(input: Input) {
  const subjects = Array.isArray(input.subjects)
    ? input.subjects.map((s) => cleanText(s, 80)).filter(Boolean).slice(0, 15)
    : [];
  const goal = cleanText(input.goal, 400);

  if (!goal) return { error: "Descreva o objetivo do plano de estudos." };
  if (subjects.length === 0) return { error: "Informe pelo menos uma disciplina." };

  const level = LEVELS.includes(String(input.level) as any) ? String(input.level) : "iniciante";
  const deadlineRaw = cleanText(input.deadline, 10);
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(deadlineRaw) ? deadlineRaw : null;

  const priorities = Array.isArray(input.priorities)
    ? input.priorities.map((p) => cleanText(p, 80)).filter(Boolean).slice(0, 15)
    : [];

  return {
    data: {
      title: cleanText(input.title, 120) || `Plano de estudos — ${subjects[0]}`,
      goal,
      area: cleanText(input.area, 120) || null,
      level,
      subjects,
      priorities,
      hours_per_day: clampNumber(input.hours_per_day, 0.5, 12, 2),
      days_per_week: Math.round(clampNumber(input.days_per_week, 1, 7, 5)),
      deadline,
      notes: cleanText(input.notes, 600),
    },
  };
}

const PLAN_SHAPE = `{
  "titulo": string,
  "objetivo_principal": string,
  "resumo": string,
  "disciplinas": [{ "nome": string, "prioridade": "alta"|"media"|"baixa", "ordem": number, "por_que": string }],
  "ordem_recomendada": [string],
  "carga_horaria": { "por_dia_horas": number, "por_semana_horas": number, "total_estimado_horas": number },
  "cronograma": [{
    "semana": number,
    "foco": string,
    "dias": [{
      "dia": string,
      "blocos": [{ "titulo": string, "disciplina": string, "tipo": "estudo"|"exercicios"|"revisao"|"simulado"|"descanso", "minutos": number, "descricao": string }]
    }]
  }],
  "metas": { "curto_prazo": [string], "medio_prazo": [string], "longo_prazo": [string] },
  "revisao": [string],
  "exercicios": [string],
  "pausas": [string],
  "previsao_conclusao": string,
  "recomendacoes_finais": [string]
}`;

function buildPrompt(cfg: any, extra: string) {
  return `Você é a Ella, tutora de estudos. Monte um PLANO DE ESTUDOS personalizado, realista e equilibrado.

Perfil do aluno:
- Objetivo: ${cfg.goal}
- Área/curso: ${cfg.area ?? "não informado"}
- Disciplinas: ${cfg.subjects.join(", ")}
- Prioridade declarada: ${cfg.priorities.length ? cfg.priorities.join(" > ") : "não informada"}
- Nível: ${cfg.level}
- Horas por dia: ${cfg.hours_per_day}
- Dias por semana: ${cfg.days_per_week}
- Data limite: ${cfg.deadline ?? "sem data definida"}
${cfg.notes ? `- Observações: ${cfg.notes}` : ""}
${extra}

Regras:
- Cronograma de 4 a 8 semanas, com exatamente ${cfg.days_per_week} dias de estudo por semana.
- A soma dos minutos dos blocos de cada dia deve ficar próxima de ${Math.round(cfg.hours_per_day * 60)} minutos.
- Inclua sempre revisão espaçada, blocos de exercícios e pausas (técnica Pomodoro: 25/5 e pausa longa a cada 4 ciclos).
- Distribua a carga respeitando a prioridade e o nível informados.
- Português do Brasil, linguagem clara e objetiva. Sem emojis.

Responda SOMENTE com um JSON válido, sem markdown e sem comentários, nesta forma:
${PLAN_SHAPE}`;
}

function extractJson(raw: string) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta sem JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generatePlan(prompt: string) {
  const key = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!key) throw new Error("Assistente indisponível: configuração ausente.");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    console.error("[smart-study-plan] falha na geração", res.status, detail.slice(0, 300));
    throw new Error("Não foi possível gerar o plano agora. Tente novamente em instantes.");
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";
  return extractJson(text);
}

// Transforma o cronograma do plano em tarefas marcáveis.
function planToTasks(plan: any, planId: string, userId: string) {
  const tasks: any[] = [];
  const weeks = Array.isArray(plan?.cronograma) ? plan.cronograma : [];
  weeks.forEach((week: any, wi: number) => {
    const days = Array.isArray(week?.dias) ? week.dias : [];
    days.forEach((day: any, di: number) => {
      const blocks = Array.isArray(day?.blocos) ? day.blocos : [];
      blocks.forEach((block: any, bi: number) => {
        if (block?.tipo === "descanso") return;
        tasks.push({
          plan_id: planId,
          user_id: userId,
          week_index: Number(week?.semana) || wi + 1,
          day_label: cleanText(day?.dia, 40) || `Dia ${di + 1}`,
          subject: cleanText(block?.disciplina, 80) || null,
          title: cleanText(block?.titulo, 200) || "Bloco de estudo",
          kind: ["estudo", "exercicios", "revisao", "simulado"].includes(block?.tipo) ? block.tipo : "estudo",
          duration_minutes: Math.round(clampNumber(block?.minutos, 5, 480, 60)),
          sort_order: wi * 1000 + di * 50 + bi,
        });
      });
    });
  });
  return tasks.slice(0, 400);
}

// ---------------------------------------------------------------------------
// Sinais de histórico do aluno (conclusão e progresso) usados pelas sugestões.
// Todas as leituras são filtradas pelo user_id derivado do token.
// ---------------------------------------------------------------------------
type PlanSignals = {
  totalTasks: number;
  doneTasks: number;
  pct: number;
  bySubject: { subject: string; total: number; done: number; pct: number }[];
  staleDays: number;
  apostilasConcluidas: number;
  exerciciosRespondidos: number;
  acertos: number;
  precisao: number;
  streakAtual: number;
  ultimaAtividade: string | null;
};

async function collectSignals(
  admin: ReturnType<typeof createClient>,
  userId: string,
  planId: string,
  planUpdatedAt: string | null,
): Promise<PlanSignals> {
  const [tasksRes, completionsRes, answersRes, streakRes] = await Promise.all([
    admin
      .from("planos_estudo_tarefas")
      .select("subject, done, done_at, duration_minutes")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .limit(400),
    admin
      .from("apostila_completions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("answers")
      .select("is_correct")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(300),
    admin
      .from("study_streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const tasks = (tasksRes.data ?? []) as { subject: string | null; done: boolean; done_at: string | null }[];
  const map = new Map<string, { total: number; done: number }>();
  let lastDone: string | null = null;

  for (const t of tasks) {
    const key = t.subject || "Geral";
    const cur = map.get(key) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (t.done) {
      cur.done += 1;
      if (t.done_at && (!lastDone || t.done_at > lastDone)) lastDone = t.done_at;
    }
    map.set(key, cur);
  }

  const doneTasks = tasks.filter((t) => t.done).length;
  const answers = (answersRes.data ?? []) as { is_correct: boolean }[];
  const acertos = answers.filter((a) => a.is_correct).length;
  const reference = lastDone ?? planUpdatedAt;
  const staleDays = reference
    ? Math.max(0, Math.floor((Date.now() - new Date(reference).getTime()) / 86400000))
    : 0;

  return {
    totalTasks: tasks.length,
    doneTasks,
    pct: tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0,
    bySubject: [...map.entries()]
      .map(([subject, v]) => ({
        subject,
        total: v.total,
        done: v.done,
        pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
      }))
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 15),
    staleDays,
    apostilasConcluidas: completionsRes.count ?? 0,
    exerciciosRespondidos: answers.length,
    acertos,
    precisao: answers.length ? Math.round((acertos / answers.length) * 100) : 0,
    streakAtual: (streakRes.data as { current_streak?: number } | null)?.current_streak ?? 0,
    ultimaAtividade: lastDone,
  };
}

function signalsSummary(s: PlanSignals) {
  const bySubject = s.bySubject
    .map((x) => `${x.subject}: ${x.done}/${x.total} (${x.pct}%)`)
    .join("; ") || "sem atividades registradas";
  return `Histórico real do aluno:
- Progresso do plano: ${s.doneTasks}/${s.totalTasks} atividades (${s.pct}%).
- Progresso por disciplina: ${bySubject}.
- Dias desde a última atividade concluída: ${s.staleDays}.
- Apostilas concluídas na plataforma: ${s.apostilasConcluidas}.
- Exercícios respondidos (últimos 300): ${s.exerciciosRespondidos}, com ${s.precisao}% de acerto.
- Sequência de estudo atual: ${s.streakAtual} dia(s).`;
}

const SUGGESTION_SHAPE = `{
  "resumo": string,
  "sugestoes": [{
    "titulo": string,
    "motivo": string,
    "acao": "reforcar"|"reduzir"|"reordenar"|"revisar"|"ritmo",
    "disciplina": string,
    "impacto": "alto"|"medio"|"baixo",
    "instrucao": string
  }]
}`;

async function generateSuggestions(plan: any, s: PlanSignals) {
  const prompt = `Você é a Ella, tutora de estudos da plataforma. Analise o desempenho abaixo e proponha de 3 a 5 ajustes objetivos no plano de estudos do aluno.

Plano atual:
- Título: ${plan.title}
- Objetivo: ${plan.goal}
- Disciplinas: ${(plan.subjects ?? []).join(", ")}
- Nível: ${plan.level}
- Rotina: ${plan.hours_per_day}h/dia, ${plan.days_per_week} dias/semana
- Data limite: ${plan.deadline ?? "sem data definida"}

${signalsSummary(s)}

Regras:
- Cada sugestão precisa citar o dado que a justifica (percentual, disciplina ou dias parados).
- "instrucao" deve ser uma ordem curta e aplicável ao replanejamento do cronograma.
- Priorize disciplinas com menor percentual de conclusão e retome o ritmo se o aluno estiver parado.
- Português do Brasil, sem emojis, sem markdown.

Responda SOMENTE com JSON válido nesta forma:
${SUGGESTION_SHAPE}`;

  const raw = await generatePlan(prompt);
  const list = Array.isArray(raw?.sugestoes) ? raw.sugestoes : [];
  return {
    resumo: cleanText(raw?.resumo, 400),
    sugestoes: list.slice(0, 6).map((x: any) => ({
      titulo: cleanText(x?.titulo, 120) || "Ajuste sugerido",
      motivo: cleanText(x?.motivo, 300),
      acao: ["reforcar", "reduzir", "reordenar", "revisar", "ritmo"].includes(x?.acao) ? x.acao : "reforcar",
      disciplina: cleanText(x?.disciplina, 80),
      impacto: ["alto", "medio", "baixo"].includes(x?.impacto) ? x.impacto : "medio",
      instrucao: cleanText(x?.instrucao, 300),
    })),
  };
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) return json({ error: "Não autenticado" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = (await req.json().catch(() => ({}))) as Input;
    const mode = body.mode === "adjust" || body.mode === "suggest" ? body.mode : "create";

    // ---- Sugestões automáticas (somente leitura) ----
    if (mode === "suggest") {
      const planId = cleanText(body.plan_id, 60);
      if (!planId) return json({ error: "Plano não informado." }, 400);

      const { data: existing } = await admin
        .from("planos_estudo")
        .select("*")
        .eq("id", planId)
        .maybeSingle();
      if (!existing || existing.user_id !== userId) return json({ error: "Plano não encontrado." }, 404);

      const signals = await collectSignals(admin, userId, planId, existing.updated_at ?? null);
      const result = await generateSuggestions(existing, signals);
      return json({ ok: true, plan_id: planId, signals, ...result });
    }

    // ---- Ajuste de um plano existente (mantém histórico) ----
    if (mode === "adjust") {
      const planId = cleanText(body.plan_id, 60);
      if (!planId) return json({ error: "Plano não informado." }, 400);

      const { data: existing } = await admin
        .from("planos_estudo")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      // Verificação de propriedade — nunca confie no corpo da requisição.
      if (!existing || existing.user_id !== userId) return json({ error: "Plano não encontrado." }, 404);

      const merged = validate({
        title: body.title ?? existing.title,
        goal: body.goal ?? existing.goal,
        area: body.area ?? existing.area,
        level: body.level ?? existing.level,
        subjects: body.subjects ?? existing.subjects,
        priorities: body.priorities ?? existing.priorities,
        hours_per_day: body.hours_per_day ?? existing.hours_per_day,
        days_per_week: body.days_per_week ?? existing.days_per_week,
        deadline: body.deadline === undefined ? existing.deadline : body.deadline,
        notes: body.notes,
      });
      if ("error" in merged) return json({ error: merged.error }, 400);

      const signals = await collectSignals(admin, userId, planId, existing.updated_at ?? null);
      const applied = Array.isArray(body.suggestions)
        ? body.suggestions.map((s) => cleanText(s, 300)).filter(Boolean).slice(0, 8)
        : [];

      const progressNote = `\n${signalsSummary(signals)}
Reorganize o que falta, mantenha em revisão leve o que já foi bem absorvido e reequilibre a carga restante.${
        applied.length ? `\nAplique obrigatoriamente estes ajustes sugeridos:\n- ${applied.join("\n- ")}` : ""
      }`;
      const plan = await generatePlan(buildPrompt(merged.data, progressNote));
      const nextVersion = (existing.version ?? 1) + 1;

      const versionNote = cleanText(body.version_note, 300)
        || (applied.length
          ? `Ajuste automático da Ella (${applied.length} sugestão${applied.length > 1 ? "ões" : ""}): ${applied.join(" | ").slice(0, 220)}`
          : "Versão anterior ao replanejamento");

      // Guarda a versão anterior antes de sobrescrever.
      await admin.from("planos_estudo_versoes").insert({
        plan_id: planId,
        user_id: userId,
        version: existing.version ?? 1,
        plan: existing.plan,
        note: versionNote,
      });


      await admin
        .from("planos_estudo")
        .update({ ...merged.data, notes: undefined, plan, version: nextVersion })
        .eq("id", planId)
        .eq("user_id", userId);

      await admin.from("planos_estudo_tarefas").delete().eq("plan_id", planId).eq("user_id", userId);
      const tasks = planToTasks(plan, planId, userId);
      if (tasks.length) await admin.from("planos_estudo_tarefas").insert(tasks);

      return json({ ok: true, plan_id: planId, version: nextVersion, plan });
    }

    // ---- Criação ----
    const parsed = validate(body);
    if ("error" in parsed) return json({ error: parsed.error }, 400);

    const { count: planCount } = await admin
      .from("planos_estudo")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((planCount ?? 0) >= 20) {
      return json({ error: "Você atingiu o limite de 20 planos. Apague algum para criar outro." }, 400);
    }

    const plan = await generatePlan(buildPrompt(parsed.data, ""));
    const { notes: _notes, ...cfg } = parsed.data;

    const { data: created, error: insertError } = await admin
      .from("planos_estudo")
      .insert({ ...cfg, user_id: userId, plan, version: 1 })
      .select("id")
      .single();

    if (insertError || !created) {
      console.error("[smart-study-plan] falha ao salvar", insertError?.message);
      return json({ error: "Não foi possível salvar o plano." }, 500);
    }

    const tasks = planToTasks(plan, created.id, userId);
    if (tasks.length) await admin.from("planos_estudo_tarefas").insert(tasks);

    await admin.from("planos_estudo_versoes").insert({
      plan_id: created.id,
      user_id: userId,
      version: 1,
      plan,
      note: "Versão inicial",
    });

    return json({ ok: true, plan_id: created.id, version: 1, plan });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro inesperado";
    console.error("[smart-study-plan]", message);
    return json({ error: message }, 500);
  }
});
