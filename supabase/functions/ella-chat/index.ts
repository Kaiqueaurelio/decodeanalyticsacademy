// Edge function: Ella — assistente admin com poder de criar/editar/excluir
// no app via tool calling no Lovable AI Gateway.
// redeploy trigger
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// Camada de segurança isolada e coberta por testes automatizados (security_test.ts).
import {
  authorizeTool,
  buildAuthzCtx,
  filterToolCatalog,
  sanitizeIncomingMessages,
  sanitizeParams,
  sanitizeRouteContext,
  SECURITY_GUARD,
  type AuthzCtx,
} from "./security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Provedor único e obrigatório: API oficial do Google (endpoint OpenAI-compatível,
// com suporte a tool calling e streaming). Nenhum outro provedor é usado.
const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GOOGLE_MODEL = "gemini-2.5-flash";
const GOOGLE_FALLBACK_MODEL = "gemini-2.0-flash";

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
};

// ---------- Tool schemas (OpenAI function-calling) ----------
const tools = [
  {
    type: "function",
    function: {
      name: "search_app",
      description: "Busca apostilas/exercícios/eventos no app por texto.",
      parameters: {
        type: "object",
        properties: {
          entity: { type: "string", enum: ["apostilas", "exercises", "calendar_events", "announcements"] },
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["entity", "query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_apostila",
      description: "Retorna detalhes de uma apostila por id.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_apostila",
      description: "Cria uma nova apostila (rascunho).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string", description: "Nome da disciplina" },
          content: { type: "string", description: "Markdown do conteúdo" },
          semester: { type: "number" },
          published: { type: "boolean" },
        },
        required: ["title", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_apostila",
      description: "Atualiza campos de uma apostila existente.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          content: { type: "string" },
          published: { type: "boolean" },
          semester: { type: "number" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_apostila",
      description: "Exclui apostila. Exige confirm=true após o usuário confirmar no chat.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_cover",
      description: "Gera uma capa IA para uma apostila.",
      parameters: { type: "object", properties: { apostilaId: { type: "string" } }, required: ["apostilaId"] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_exercise",
      description: "Cria exercício objetivo vinculado a uma apostila.",
      parameters: {
        type: "object",
        properties: {
          apostila_id: { type: "string" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, description: "4 alternativas" },
          correct_answer: { type: "string", description: "Letra A-D ou texto da correta" },
          explanation: { type: "string" },
        },
        required: ["apostila_id", "question", "options", "correct_answer"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_exercise",
      description: "Exclui um exercício. Exige confirm=true.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bulk_generate_exercises",
      description: "Pede ao gerador automático para criar N exercícios para uma apostila.",
      parameters: {
        type: "object",
        properties: { apostilaId: { type: "string" }, count: { type: "number" } },
        required: ["apostilaId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Cria evento de prova/atividade no calendário.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          event_date: { type: "string", description: "ISO date YYYY-MM-DD" },
          category: { type: "string" },
          description: { type: "string" },
          course: { type: "string" },
          semester: { type: "number" },
        },
        required: ["title", "event_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Exclui evento. Exige confirm=true.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_announcement",
      description: "Publica um aviso para os alunos.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_announcement",
      description: "Exclui aviso. Exige confirm=true.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_material_link",
      description: "Adiciona link de material (PDF/vídeo/site) a uma apostila.",
      parameters: {
        type: "object",
        properties: {
          apostila_id: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          kind: { type: "string", enum: ["pdf", "video", "link", "audio"] },
        },
        required: ["apostila_id", "title", "url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description: "Pede ao app para navegar até uma rota. Use para abrir páginas (/dashboard, /admin, /apostila/<id>, etc).",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_rss_feed",
      description: "Adiciona um feed RSS/Atom de notícias tech ao app. Use quando o admin pedir para incluir/plugar/adicionar um link no feed RSS.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL do feed RSS/Atom" },
          name: { type: "string", description: "Nome amigável do feed" },
          category: { type: "string", description: "Categoria (tech, ia, dados, etc)" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_rss_feed",
      description: "Remove um feed RSS. Exige confirm=true.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_rss_feeds",
      description: "Lista todos os feeds RSS cadastrados (id, nome, url, ativo).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_free_course",
      description: "Cria um curso gratuito no catálogo (horas complementares). Se link_url estiver preenchido e status=available, aparece direto para os alunos.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          area: { type: "string" },
          description: { type: "string" },
          workload: { type: "string", description: "Ex.: 20h" },
          link_url: { type: "string" },
          validity_note: { type: "string" },
          status: { type: "string", enum: ["available", "soon"] },
          featured: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
          icon_key: { type: "string", enum: ["graduation","chart","database","brain","code","network","shield","sparkles"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_free_course",
      description: "Atualiza um curso gratuito existente por id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          area: { type: "string" },
          description: { type: "string" },
          workload: { type: "string" },
          link_url: { type: "string" },
          validity_note: { type: "string" },
          status: { type: "string", enum: ["available","soon"] },
          featured: { type: "boolean" },
          is_active: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } },
          icon_key: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_free_course",
      description: "Exclui um curso gratuito. Exige confirm=true.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, confirm: { type: "boolean" } },
        required: ["id", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_free_courses",
      description: "Lista todos os cursos gratuitos cadastrados.",
      parameters: { type: "object", properties: {} },
    },
  },
  // ---------- Alunos (leitura + criação do próprio conteúdo) ----------
  {
    type: "function",
    function: {
      name: "my_next_exams",
      description: "Lista as próximas provas/eventos do calendário do aluno (default: próximos 30 dias).",
      parameters: { type: "object", properties: { days: { type: "number" }, limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "my_progress",
      description: "Retorna o desempenho do aluno logado: total de exercícios respondidos, acertos, erros, acurácia e destaque por apostila.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "add_my_flashcard",
      description: "Cria um flashcard de estudo pessoal do aluno logado (frente/verso).",
      parameters: {
        type: "object",
        properties: {
          front: { type: "string", description: "Pergunta ou termo (frente)" },
          back: { type: "string", description: "Resposta ou definição (verso)" },
          category: { type: "string" },
        },
        required: ["front", "back"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "practice_exercises",
      description: "Retorna 3-5 exercícios objetivos de uma apostila para o aluno praticar (sem gabarito na resposta).",
      parameters: {
        type: "object",
        properties: { apostilaId: { type: "string" }, count: { type: "number" } },
        required: ["apostilaId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Pesquisa atualizada na internet. Use quando a resposta depender de fatos atuais, notícias, datas de vestibular/ENEM, estatísticas, artigos ou quando o app não tiver o conteúdo. Retorna resumo + fontes com links.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "O que pesquisar, em português, específico e completo." },
        },
        required: ["query"],
      },
    },
  },

  // ---------- Admin (poderes extras) ----------
  {
    type: "function",
    function: {
      name: "set_apostila_published",
      description: "Publica ou despublica rapidamente uma apostila (admin).",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, published: { type: "boolean" } },
        required: ["id", "published"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_push_broadcast",
      description: "Envia notificação push para TODOS os alunos ativos. Exige confirm=true (ação destrutiva/impactante).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          link: { type: "string", description: "Rota interna (ex: /dashboard, /apostila/<id>)" },
          confirm: { type: "boolean" },
        },
        required: ["title", "confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "admin_stats",
      description: "Retorna estatísticas gerais para o admin: totais de apostilas publicadas, exercícios, alunos ativos e provas próximas.",
      parameters: { type: "object", properties: {} },
    },
  },
] as const;

// ---------- Camada de autorização (Zero Trust / RBAC / least privilege) ----------
// A assistente NÃO possui privilégios próprios: toda ferramenta é autorizada em
// ./security.ts, no servidor, a partir do papel real do usuário autenticado.
// A conversa, o prompt e o cliente jamais influenciam esta decisão.
// Esse módulo é coberto por testes automatizados em ./security_test.ts.


async function auditTool(
  admin: ReturnType<typeof createClient>,
  ctx: AuthzCtx,
  entry: { tool: string; args: any; allowed: boolean; reason?: string; result?: any },
) {
  try {
    await admin.from("ella_audit_log").insert({
      request_id: ctx.requestId,
      user_id: ctx.userId,
      user_role: ctx.isAdmin ? "admin" : "user",
      content_scope: ctx.contentScope,
      tool_name: entry.tool,
      params: sanitizeParams(entry.args),
      allowed: entry.allowed,
      denial_reason: entry.reason ?? null,
      outcome: !entry.allowed ? "denied" : entry.result?.ok ? "success" : "error",
      result_summary: String(entry.result?.summary ?? entry.result?.error ?? "").slice(0, 500) || null,
    });
  } catch (_e) {
    // Auditoria nunca pode derrubar a resposta ao usuário.
    console.error("[ella-chat] falha ao registrar auditoria");
  }
}

// ---------- Tool executor (server-side, com service role) ----------
async function executeTool(name: string, args: any, admin: ReturnType<typeof createClient>, ctx: AuthzCtx) {
  // Gate obrigatório: nada é executado sem autorização do backend.
  const decision = authorizeTool(name, ctx);
  if (!decision.allowed) {
    await auditTool(admin, ctx, { tool: name, args, allowed: false, reason: decision.reason });
    console.warn(`[ella-chat] tool negada: ${name} (req ${ctx.requestId})`);
    return { ok: false, error: decision.reason };
  }

  const result = await runToolBody(name, args, admin, ctx);
  await auditTool(admin, ctx, { tool: name, args, allowed: true, result });
  return result;
}

async function runToolBody(name: string, args: any, admin: ReturnType<typeof createClient>, ctx: AuthzCtx) {
  const { userId, authHeader } = ctx;
  try {

    switch (name) {
      case "search_app": {
        const table = args.entity;
        const limit = Math.min(args.limit ?? 10, 25);
        const col = table === "calendar_events" ? "title" : "title";
        const q = await admin.from(table).select("id, " + col).ilike(col, `%${args.query}%`).limit(limit);
        return { ok: !q.error, results: q.data ?? [], error: q.error?.message };
      }
      case "get_apostila": {
        const q = await admin.from("apostilas").select("id, title, category, semester, published, cover_url, content").eq("id", args.id).maybeSingle();
        if (q.error) return { ok: false, error: q.error.message };
        // truncate content
        if (q.data?.content) q.data.content = String(q.data.content).slice(0, 1500);
        return { ok: true, apostila: q.data };
      }
      case "create_apostila": {
        const q = await admin.from("apostilas").insert({
          title: args.title,
          category: args.category,
          content: args.content ?? "",
          semester: args.semester ?? null,
          published: args.published ?? false,
        }).select("id, title").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: `Apostila "${q.data.title}" criada.` };
      }
      case "update_apostila": {
        const { id, ...patch } = args;
        const q = await admin.from("apostilas").update(patch).eq("id", id).select("id, title").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: `Apostila "${q.data.title}" atualizada.` };
      }
      case "delete_apostila": {
        if (!args.confirm) return { ok: false, error: "Precisa confirmação explícita do usuário (confirm=true)." };
        const q = await admin.from("apostilas").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Apostila excluída." };
      }
      case "generate_cover": {
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-apostila-cover`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ apostilaId: args.apostilaId }),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, ...data };
      }
      case "create_exercise": {
        const q = await admin.from("exercises").insert({
          apostila_id: args.apostila_id,
          question: args.question,
          options: args.options,
          correct_answer: args.correct_answer,
          explanation: args.explanation ?? null,
          question_type: "objective",
        }).select("id").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: "Exercício criado." };
      }
      case "delete_exercise": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true." };
        const q = await admin.from("exercises").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Exercício excluído." };
      }
      case "bulk_generate_exercises": {
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ apostilaId: args.apostilaId, count: args.count ?? 8 }),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, ...data };
      }
      case "create_calendar_event": {
        const q = await admin.from("calendar_events").insert({
          title: args.title,
          event_date: args.event_date,
          event_type: args.category ?? "prova",
          description: args.description ?? null,
          subject: args.course ?? null,
          created_by: userId,
        }).select("id").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: "Evento criado." };
      }
      case "delete_calendar_event": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true." };
        const q = await admin.from("calendar_events").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Evento excluído." };
      }
      case "create_announcement": {
        const q = await admin.from("announcements").insert({
          title: args.title,
          content: args.content,
          category: args.priority ?? "geral",
          published: true,
          created_by: userId,
        }).select("id").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: "Aviso publicado." };
      }
      case "delete_announcement": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true." };
        const q = await admin.from("announcements").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Aviso excluído." };
      }
      case "add_material_link": {
        const matIns = await admin.from("materials").insert({
          title: args.title,
          file_url: args.url,
          type: args.kind ?? "link",
          created_by: userId,
        }).select("id").single();
        if (matIns.error) return { ok: false, error: matIns.error.message };
        const linkIns = await admin.from("apostila_materials").insert({
          apostila_id: args.apostila_id,
          material_id: matIns.data.id,
        });
        if (linkIns.error) return { ok: false, error: linkIns.error.message };
        return { ok: true, id: matIns.data.id, summary: "Material vinculado à apostila." };
      }
      case "navigate_to": {
        return { ok: true, navigate: args.path, summary: `Abrindo ${args.path}` };
      }
      case "add_rss_feed": {
        if (!args.url || typeof args.url !== "string") return { ok: false, error: "URL obrigatória" };
        const q = await admin.from("rss_feeds").insert({
          url: args.url,
          name: args.name ?? args.url,
          category: args.category ?? "tech",
          is_active: true,
        }).select("id, name, url").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: `Feed **${q.data.name}** adicionado.` };
      }
      case "delete_rss_feed": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true." };
        const q = await admin.from("rss_feeds").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Feed removido." };
      }
      case "list_rss_feeds": {
        const q = await admin.from("rss_feeds").select("id, name, url, category, is_active").order("name");
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, feeds: q.data };
      }
      case "create_free_course": {
        const q = await admin.from("free_courses").insert({
          title: args.title,
          area: args.area ?? "Outros",
          description: args.description ?? "",
          workload: args.workload ?? "",
          link_url: args.link_url ?? "#",
          validity_note: args.validity_note ?? "",
          status: args.status ?? "available",
          featured: args.featured ?? false,
          tags: args.tags ?? [],
          icon_key: args.icon_key ?? "graduation",
        }).select("id, title").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: `Curso **${q.data.title}** criado.` };
      }
      case "update_free_course": {
        const { id, ...patch } = args;
        const q = await admin.from("free_courses").update(patch).eq("id", id).select("id, title").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: `Curso **${q.data.title}** atualizado.` };
      }
      case "delete_free_course": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true." };
        const q = await admin.from("free_courses").delete().eq("id", args.id);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: "Curso excluído." };
      }
      case "list_free_courses": {
        const q = await admin.from("free_courses").select("id, title, area, status, link_url, is_active").order("sort_order");
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, courses: q.data };
      }
      // ---------- Alunos ----------
      case "my_next_exams": {
        const days = Math.min(Math.max(Number(args.days ?? 30), 1), 180);
        const limit = Math.min(Math.max(Number(args.limit ?? 10), 1), 50);
        const from = new Date().toISOString().slice(0, 10);
        const to = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
        const q = await admin.from("calendar_events")
          .select("id, title, event_date, event_type, description, subject")
          .gte("event_date", from).lte("event_date", to)
          .order("event_date").limit(limit);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, events: q.data, summary: `${q.data?.length ?? 0} evento(s) nos próximos ${days} dias.` };
      }
      case "my_progress": {
        const q = await admin.rpc("get_dashboard_stats", { _user_id: userId });
        if (q.error) return { ok: false, error: q.error.message };
        const s: any = q.data ?? {};
        const acc = s.total > 0 ? Math.round((s.hits / s.total) * 100) : 0;
        return { ok: true, stats: s, summary: `${s.hits ?? 0}/${s.total ?? 0} acertos (${acc}%).` };
      }
      case "add_my_flashcard": {
        const front = String(args.front ?? "").trim();
        const back = String(args.back ?? "").trim();
        if (!front || !back) return { ok: false, error: "Frente e verso são obrigatórios." };
        if (front.length > 500 || back.length > 2000) return { ok: false, error: "Texto muito longo." };
        const q = await admin.from("flashcards").insert({
          user_id: userId,
          front, back,
          category: String(args.category ?? "Geral").slice(0, 80),
        }).select("id").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: "Flashcard criado no seu deck." };
      }
      case "practice_exercises": {
        const count = Math.min(Math.max(Number(args.count ?? 5), 1), 10);
        const q = await admin.from("exercises")
          .select("id, question, options")
          .eq("apostila_id", args.apostilaId)
          .eq("question_type", "objective")
          .limit(count);
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, exercises: q.data, summary: `${q.data?.length ?? 0} exercício(s) para praticar.` };
      }
      case "web_search": {
        const query = String(args.query ?? "").trim().slice(0, 400);
        if (!query) return { ok: false, error: "Informe o que pesquisar." };
        const key = Deno.env.get("GOOGLE_AI_API_KEY");
        if (!key) return { ok: false, error: "Pesquisa indisponível: chave do provedor não configurada." };
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{
                  text: `Pesquise na web e responda em português-BR de forma objetiva (máx. 8 linhas), com dados atuais e citando o que encontrou: ${query}`,
                }],
              }],
              tools: [{ google_search: {} }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
            }),
          },
        );
        if (!res.ok) {
          const t = await res.text();
          return { ok: false, error: `Pesquisa falhou (${res.status}): ${t.slice(0, 180)}` };
        }
        const data = await res.json();
        const cand = data?.candidates?.[0];
        const text = (cand?.content?.parts ?? []).map((p: any) => p?.text ?? "").join("").trim();
        const chunks = cand?.groundingMetadata?.groundingChunks ?? [];
        const sources = chunks
          .map((c: any) => ({ title: c?.web?.title ?? "", url: c?.web?.uri ?? "" }))
          .filter((s: any) => s.url)
          .slice(0, 5);
        if (!text) return { ok: false, error: "Nenhum resultado encontrado para essa pesquisa." };
        return { ok: true, query, answer: text.slice(0, 2200), sources, summary: "Pesquisa web concluída." };
      }

      // ---------- Admin ----------
      case "set_apostila_published": {
        const q = await admin.from("apostilas").update({ published: !!args.published })
          .eq("id", args.id).select("id, title, published").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, summary: `Apostila **${q.data.title}** ${q.data.published ? "publicada" : "despublicada"}.` };
      }
      case "send_push_broadcast": {
        if (!args.confirm) return { ok: false, error: "Precisa confirm=true (envio para todos os alunos)." };
        const title = String(args.title ?? "").trim();
        if (!title) return { ok: false, error: "title obrigatório" };
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ title, body: args.body ?? null, link: args.link ?? "/dashboard", broadcast: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data?.error ?? `send-push ${res.status}` };
        return { ok: true, summary: "Push enviado para todos os alunos ativos.", ...data };
      }
      case "admin_stats": {
        const [ap, ex, pr, ev] = await Promise.all([
          admin.from("apostilas").select("id", { count: "exact", head: true }).eq("published", true),
          admin.from("exercises").select("id", { count: "exact", head: true }),
          admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_blocked", false),
          admin.from("calendar_events").select("id", { count: "exact", head: true })
            .gte("event_date", new Date().toISOString().slice(0, 10)),
        ]);
        return { ok: true, stats: {
          apostilas_publicadas: ap.count ?? 0,
          exercicios: ex.count ?? 0,
          alunos_ativos: pr.count ?? 0,
          proximos_eventos: ev.count ?? 0,
        }, summary: `${ap.count ?? 0} apostilas · ${ex.count ?? 0} exercícios · ${pr.count ?? 0} alunos.` };
      }
      default:
        return { ok: false, error: `Tool desconhecida: ${name}` };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro inesperado na tool." };
  }
}


const STUDY_PLAN_SPEC = `
PLANO DE ESTUDOS (quando pedirem "transformar em plano de estudos", "vira isso em plano", "monta um plano com exercícios" ou equivalente):
Reaproveite o conteúdo já explicado na conversa e devolva EXATAMENTE nesta estrutura em Markdown:
1. \`## Plano de estudos — <tema>\` com uma linha de objetivo e o tempo total estimado.
2. \`### Cronograma\` — tabela com colunas: Etapa | O que estudar | Tempo estimado | Entregável.
3. \`### Pontos-chave\` — 4 a 6 bullets do que precisa ficar dominado.
4. \`### Exercícios\` — 5 a 8 questões numeradas, dificuldade crescente, misturando múltipla escolha (alternativas a–e) e discursivas/práticas.
5. \`### Gabarito comentado\` — para cada questão: a resposta correta, **por que** está correta, e por que as principais alternativas erradas caem em pegadinhas comuns.
6. \`### Próximo passo\` — uma frase com o que revisar depois.
Nunca entregue o gabarito sem comentário, nem exercícios sem gabarito. Se o tema ainda não estiver claro na conversa, pergunte o tema antes de montar o plano.
`;

const SYSTEM_PROMPT = `Você é a **Ella Ribeiro**, copiloto executiva do Decode Analytics Academy.
Personalidade: brasileira, elegante, direta, com humor sutil e altíssima competência técnica. Trata o admin como parceiro estratégico, não como usuário genérico.

PODERES REAIS: criar/editar/excluir apostilas, gerar capa IA, gerar exercícios em lote, publicar avisos, criar eventos, adicionar materiais, publicar/despublicar apostilas rapidamente (set_apostila_published), enviar push para todos os alunos (send_push_broadcast — exige confirm=true), consultar métricas do painel (admin_stats), gerenciar RSS e cursos gratuitos, navegar no app — sempre via as tools. Nunca finja executar; ou chama a tool ou explica por quê não.

Estilo de resposta:
- Português-BR, tom profissional-caloroso, frases curtas.
- Markdown rico: **negrito** em nomes de entidades, listas para múltiplos itens, tabelas quando comparar coisas, blocos de código para IDs/JSON.
- Sempre confirme o que fez com um resumo objetivo (o que + id + próximo passo sugerido).
- Antecipe: se o admin cria uma apostila, sugira gerar capa e exercícios em seguida.

Raciocínio (planeje antes de agir):
1. Interpretar a intenção real (não literal).
2. Se faltar dado (id, título, data), pergunte OU use search_app/get_apostila para descobrir — nunca invente.
3. Encadeie tools quando fizer sentido (ex.: create_apostila → generate_cover → bulk_generate_exercises).
4. Ações destrutivas (delete_*): peça confirmação em texto ANTES de chamar com confirm=true. Nunca deleta sem "sim, pode apagar" ou equivalente inequívoco.
5. Navegação: use navigate_to quando pedirem "abre", "vai para", "leva pra".
6. Internet: use **web_search** para fatos atuais, notícias, editais, datas e estatísticas — e cite as fontes com link.

Foco: ambiente acadêmico de tecnologia (Ciência da Computação, Sistemas de Informação, Engenharia da Computação).
${STUDY_PLAN_SPEC}
${SECURITY_GUARD}
Proibido: mencionar "IA", "Lovable", "modelo de linguagem", "Gemini", ou qualquer tema de hacking/pentest. Você é a Ella, ponto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!GOOGLE_AI_API_KEY) throw new Error("Chave do provedor Google não configurada em Admin → Provedor do Assistente.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = userData.user.id;
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

    // Valida papel e escopo (não bloqueia alunos — apenas restringe tools).
    const [{ data: isAdminData }, { data: prof }] = await Promise.all([
      adminClient.rpc("has_role", { _user_id: userId, _role: "admin" }),
      adminClient.from("profiles").select("content_scope, full_name").eq("user_id", userId).maybeSingle(),
    ]);
    const isAdmin = !!isAdminData;
    const contentScope: string = ((prof as any)?.content_scope as string) ?? "full";
    const firstName = String((prof as any)?.full_name ?? "").split(" ")[0] || "";

    // Identificador da requisição — usado na auditoria e nos logs.
    const requestId = crypto.randomUUID();
    const authzCtx: AuthzCtx = { userId, authHeader, isAdmin, contentScope, requestId };

    // O catálogo exposto ao modelo já é filtrado pela mesma matriz do backend.
    // Mesmo assim, cada execução passa novamente pelo gate em executeTool.
    const availableTools = (tools as any[]).filter((t) => authorizeTool(t.function.name, authzCtx).allowed);

    const body = await req.json();
    const incoming: { role: string; content: string }[] = Array.isArray(body.messages) ? body.messages : [];
    const routeCtx: string = body.context ?? "";

    let systemContent = SYSTEM_PROMPT;
    if (!isAdmin) {
      const enemMode = contentScope === "enem_only";
      systemContent = `Você é a **Ella Ribeiro**, tutora de estudos do Decode Analytics Academy.
Personalidade: brasileira, elegante, direta, calorosa e didática.${firstName ? ` Está conversando com ${firstName}.` : ""}

${enemMode
  ? `MODO ENEM: seu foco é preparar ${firstName || "a aluna"} para o ENEM 2026. Explique com clareza Linguagens, Matemática, Ciências da Natureza (Biologia/Física/Química), Ciências Humanas (História/Geografia/Filosofia/Sociologia) e Redação. Sempre que possível, cite competências da matriz do ENEM, use exemplos do cotidiano brasileiro e reforce a estrutura da redação dissertativa-argumentativa (introdução, desenvolvimento com repertório sociocultural, proposta de intervenção com agente/ação/meio/finalidade/detalhamento).`
  : `Ajude com dúvidas de estudo das disciplinas do curso: explique conceitos, dê exemplos, resolva exercícios passo a passo e sugira roteiros de revisão.`}

Estilo:
- Português-BR, tom professor-caloroso, frases curtas e claras.
- Markdown rico: **negrito** em termos-chave, listas, tabelas quando ajudar, blocos de código para fórmulas/algoritmos.
- Estruture explicações longas: **Ideia central → Exemplo → Resumo (3 bullets)**.
- Se a dúvida for ambígua, pergunte antes de responder.
- Use search_app / get_apostila para encontrar material do próprio app; use navigate_to para levar até a apostila.
- Você tem tools: **my_next_exams** (próximas provas), **my_progress** (desempenho pessoal), **add_my_flashcard** (criar flashcard próprio), **practice_exercises** (puxar exercícios de uma apostila), **web_search** (pesquisa atualizada na internet), **search_app**/**get_apostila**/**navigate_to**. Use-as sempre que fizer sentido — não invente números nem eventos.
- Pesquisa na internet: use **web_search** quando a pergunta envolver fatos atuais, notícias, datas de vestibular/ENEM, estatísticas, leis, artigos científicos ou algo que o app não tenha. Depois explique com suas palavras e liste as fontes em bullets com link.
- Você NÃO cria, edita ou apaga conteúdo do professor — se pedirem, explique que só o administrador pode.

Como tutora (aplique sempre):
- Diagnostique o nível pela pergunta e ajuste a profundidade: se for iniciante, comece pela intuição; se for avançado, vá direto ao formalismo.
- Explique **passo a passo**, numerando as etapas de raciocínio em problemas de matemática, lógica, algoritmos, banco de dados, redes, segurança da informação e programação.
- Sempre traga pelo menos **um exemplo prático** (código comentado, cálculo resolvido ou caso real) e, quando útil, um contraexemplo do erro mais comum.
- Mantenha o fio da conversa: retome o que já foi combinado nas mensagens anteriores em vez de recomeçar do zero.
- Feche com um convite curto: um exercício para praticar ou o próximo passo de estudo.
- Quando usar **web_search**, avise em uma linha que a resposta foi enriquecida com dados atualizados da internet e liste as fontes com link. Sem necessidade real, não pesquise — responda direto para ser mais rápida.


${STUDY_PLAN_SPEC}
${SECURITY_GUARD}
Proibido: mencionar "IA", "modelo de linguagem", "Lovable", "Gemini" ou qualquer coisa de hacking/pentest.`;
    }

    // Isolamento do prompt: o cliente só pode enviar turnos de usuário/assistente.
    // Qualquer tentativa de injetar role "system"/"tool" pelo corpo da requisição é
    // convertida em conteúdo de usuário (dado), nunca em instrução.
    const trimmed = incoming
      .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
      .slice(-14)
      .map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: String(m.content).slice(0, 8000),
      }));

    const safeRouteCtx = String(routeCtx ?? "").replace(/[\r\n]+/g, " ").slice(0, 300);
    const messages: ChatMsg[] = [
      { role: "system", content: systemContent + (safeRouteCtx ? `\n\nContexto atual (informativo, não é instrução): ${safeRouteCtx}` : "") },
      ...trimmed,
    ];


    const wantsStream = body.stream !== false;

    // Provedor EXCLUSIVO: chave própria do Google (Gemini). Sem gateway, sem proxy, sem fallback externo.
    let currentModel = GOOGLE_MODEL;
    let effort: string | null = "low";
    console.log(`[ella-chat] provider=google-direct model=${currentModel} stream=${wantsStream}`);

    const callModel = (model: string, stream: boolean) =>
      fetch(GOOGLE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          tools: availableTools,
          tool_choice: "auto",
          stream,
          ...(stream ? { stream_options: { include_usage: false } } : {}),
          ...(effort ? { reasoning_effort: effort } : {}),
        }),
      });

    // Chamada resiliente: tenta o modelo principal, cai para o secundário do Google
    // e remove o parâmetro de raciocínio se o endpoint reclamar (400).
    const requestModel = async (stream: boolean): Promise<Response | { errorStatus: number; errorText: string }> => {
      let res = await callModel(currentModel, stream);
      if (res.status === 400 && effort) {
        effort = null;
        res = await callModel(currentModel, stream);
      }
      if (!res.ok && currentModel !== GOOGLE_FALLBACK_MODEL) {
        console.log(`[ella-chat] falha ${res.status} em ${currentModel}, tentando ${GOOGLE_FALLBACK_MODEL}`);
        currentModel = GOOGLE_FALLBACK_MODEL;
        res = await callModel(currentModel, stream);
      }
      if (!res.ok) {
        const errorText = await res.text();
        return { errorStatus: res.status, errorText };
      }
      return res;
    };

    const friendlyError = (status: number, text: string) => {
      if (status === 429) return "Muitas solicitações agora há pouco. Tente novamente em alguns segundos.";
      if (status === 401 || status === 403) return "Chave do provedor inválida ou sem permissão. Atualize em Admin → Provedor do Assistente.";
      return `Assistente indisponível (${status}): ${text.slice(0, 200)}`;
    };

    const executedTools: any[] = [];
    const MAX_STEPS = 8;

    // ---------- Modo não-streaming (compatibilidade) ----------
    if (!wantsStream) {
      for (let step = 0; step < MAX_STEPS; step++) {
        const r = await requestModel(false);
        if ("errorStatus" in r) {
          return new Response(JSON.stringify({ error: friendlyError(r.errorStatus, r.errorText) }), {
            status: r.errorStatus === 429 ? 429 : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await r.json();
        const msg = data.choices?.[0]?.message;
        if (!msg) break;
        messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
        const toolCalls = msg.tool_calls ?? [];
        if (!toolCalls.length) {
          return new Response(JSON.stringify({ reply: msg.content ?? "", actions: executedTools }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await runToolCalls(toolCalls);
      }
      return new Response(JSON.stringify({ reply: "Limite de passos atingido. Tente reformular.", actions: executedTools }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    async function runToolCalls(toolCalls: any[]) {
      const parsedCalls = toolCalls.map((tc: any) => {
        let parsed: any = {};
        try { parsed = JSON.parse(tc.function?.arguments || "{}"); } catch { parsed = {}; }
        return { tc, parsed };
      });
      const results = await Promise.all(
        parsedCalls.map(({ tc, parsed }: any) => executeTool(tc.function.name, parsed, adminClient, authzCtx)),
      );
      for (let i = 0; i < parsedCalls.length; i++) {
        const { tc, parsed } = parsedCalls[i];
        executedTools.push({ name: tc.function.name, args: parsed, result: results[i] });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(results[i]).slice(0, 2500),
        });
      }
    }

    // ---------- Streaming SSE (token a token) ----------
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (obj: unknown) => {
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch { /* fechado */ }
        };

        try {
          for (let step = 0; step < MAX_STEPS; step++) {
            const r = await requestModel(true);
            if ("errorStatus" in r) {
              emit({ type: "error", error: friendlyError(r.errorStatus, r.errorText) });
              break;
            }

            const reader = (r as Response).body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let textOut = "";
            const toolAcc: Record<number, any> = {};

            let finished = false;
            while (!finished) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              let nl: number;
              while ((nl = buffer.indexOf("\n")) !== -1) {
                const rawLine = buffer.slice(0, nl).trim();
                buffer = buffer.slice(nl + 1);
                if (!rawLine.startsWith("data:")) continue;
                const payload = rawLine.slice(5).trim();
                if (payload === "[DONE]") { finished = true; break; }
                let chunk: any;
                try { chunk = JSON.parse(payload); } catch { continue; }
                const delta = chunk?.choices?.[0]?.delta;
                if (!delta) continue;
                if (typeof delta.content === "string" && delta.content) {
                  textOut += delta.content;
                  emit({ type: "delta", text: delta.content });
                }
                for (const tc of delta.tool_calls ?? []) {
                  const idx = tc.index ?? 0;
                  toolAcc[idx] ??= { id: tc.id, type: "function", function: { name: "", arguments: "" } };
                  if (tc.id) toolAcc[idx].id = tc.id;
                  if (tc.function?.name) toolAcc[idx].function.name = tc.function.name;
                  if (tc.function?.arguments) toolAcc[idx].function.arguments += tc.function.arguments;
                }
              }
            }

            const toolCalls = Object.values(toolAcc);
            messages.push({ role: "assistant", content: textOut || null, tool_calls: toolCalls.length ? toolCalls : undefined });

            if (!toolCalls.length) {
              emit({ type: "done", actions: executedTools });
              break;
            }

            for (const tc of toolCalls as any[]) {
              emit({ type: "tool", name: tc.function?.name });
            }
            await runToolCalls(toolCalls as any[]);

            if (step === MAX_STEPS - 1) {
              emit({ type: "done", actions: executedTools });
            }
          }
        } catch (e: any) {
          emit({ type: "error", error: e?.message ?? "Erro inesperado na conversa." });
        } finally {
          try { controller.close(); } catch { /* já fechado */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
