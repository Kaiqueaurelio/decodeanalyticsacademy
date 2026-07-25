// Edge function: Ella — assistente admin com poder de criar/editar/excluir
// no app via tool calling no Lovable AI Gateway.
// redeploy trigger
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
// Prioriza velocidade: Gemini 3.5 Flash (agentic, tool-calling forte, baixa latência).
// Fallback para o Flash preview em caso de quota.
const MODEL = "google/gemini-3.5-flash";
const FALLBACK_MODEL = "google/gemini-3-flash-preview";
const SECOND_FALLBACK_MODEL = "google/gemini-2.5-flash";

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



// ---------- Tool executor (server-side, com service role) ----------
async function executeTool(name: string, args: any, admin: ReturnType<typeof createClient>, ctx: { userId: string; authHeader: string }) {
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
      default:
        return { ok: false, error: `Tool desconhecida: ${name}` };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro inesperado na tool." };
  }
}

const SYSTEM_PROMPT = `Você é a **Ella Ribeiro**, copiloto executiva do Decode Analytics Academy.
Personalidade: brasileira, elegante, direta, com humor sutil e altíssima competência técnica. Trata o admin como parceiro estratégico, não como usuário genérico.

PODERES REAIS: você executa criar, editar, excluir, gerar capa IA, gerar exercícios em lote, publicar avisos, criar eventos, adicionar materiais e navegar no app — sempre via as tools disponíveis. Nunca finja executar; ou chama a tool ou explica por quê não.

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

Foco: ambiente acadêmico de tecnologia (Ciência da Computação, Sistemas de Informação, Engenharia da Computação).
Proibido: mencionar "IA", "Lovable", "modelo de linguagem", "Gemini", ou qualquer tema de hacking/pentest. Você é a Ella, ponto.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

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

    const READ_ONLY_TOOLS = new Set(["search_app", "get_apostila", "navigate_to", "list_rss_feeds", "list_free_courses"]);
    const availableTools = isAdmin ? (tools as any[]) : (tools as any[]).filter((t) => READ_ONLY_TOOLS.has(t.function.name));

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
- Você NÃO cria, edita ou apaga conteúdo — se pedirem, explique que só o administrador pode.

Proibido: mencionar "IA", "modelo de linguagem", "Lovable", "Gemini" ou qualquer coisa de hacking/pentest.`;
    }

    const messages: ChatMsg[] = [
      { role: "system", content: systemContent + (routeCtx ? `\n\nContexto atual: ${routeCtx}` : "") },
      ...incoming.map((m) => ({ role: m.role as any, content: m.content })),
    ];

    const executedTools: any[] = [];
    const MAX_STEPS = 8;

    let currentModel = MODEL;
    for (let step = 0; step < MAX_STEPS; step++) {
      let res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ model: currentModel, messages, tools: availableTools, tool_choice: "auto" }),
      });

      // Fallback em cascata para manter velocidade em picos de quota.
      if ((res.status === 429 || res.status === 503) && currentModel !== SECOND_FALLBACK_MODEL) {
        currentModel = currentModel === MODEL ? FALLBACK_MODEL : SECOND_FALLBACK_MODEL;
        res = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({ model: currentModel, messages, tools: availableTools, tool_choice: "auto" }),
        });
      }

      if (res.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições, tente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados — adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!res.ok) {
        const text = await res.text();
        return new Response(JSON.stringify({ error: `Gateway ${res.status}: ${text.slice(0, 300)}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

      const toolCalls = msg.tool_calls ?? [];
      if (!toolCalls.length) {
        return new Response(
          JSON.stringify({ reply: msg.content ?? "", actions: executedTools }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Executa tool calls em paralelo — grande ganho de latência quando o modelo pede várias.
      const parsedCalls = toolCalls.map((tc: any) => {
        let parsed: any = {};
        try { parsed = JSON.parse(tc.function.arguments || "{}"); } catch { parsed = {}; }
        return { tc, parsed };
      });
      const results = await Promise.all(
        parsedCalls.map(({ tc, parsed }: any) => executeTool(tc.function.name, parsed, adminClient, { userId, authHeader })),
      );
      for (let i = 0; i < parsedCalls.length; i++) {
        const { tc, parsed } = parsedCalls[i];
        const result = results[i];
        executedTools.push({ name: tc.function.name, args: parsed, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result).slice(0, 2500),
        });
      }
    }

    return new Response(
      JSON.stringify({ reply: "Limite de passos atingido. Tente reformular.", actions: executedTools }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
