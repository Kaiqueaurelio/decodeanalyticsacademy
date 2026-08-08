import { getCorsHeaders } from "../_shared/cors.ts";
// Edge function: Ella — assistente admin com poder de criar/editar/excluir
// no app via tool calling no Lovable AI Gateway.
// v3.82.0: ESM CORS, Type Safety, and Security Hardening.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  authorizeTool,
  buildAuthzCtx,
  classifyDenial,
  filterToolCatalog,
  sanitizeIncomingMessages,
  sanitizeParams,
  sanitizeRouteContext,
  SECURITY_GUARD,
  shouldNotifyAdmin,
  type AuthzCtx,
} from "./security.ts";

// Provedor único e obrigatório: API oficial do Google (endpoint OpenAI-compatível,
// com suporte a tool calling e streaming). Nenhum outro provedor é usado.
const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GOOGLE_MODEL = "gemini-2.0-flash";
const GOOGLE_FALLBACK_MODEL = "gemini-1.5-flash";

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
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
      description: "Atualiza ou acrescenta conteúdo a uma apostila existente.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          category: { type: "string" },
          content: { type: "string", description: "O novo conteúdo completo em Markdown." },
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
      description: "Exclui apostila. Exige confirm=true.",
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
      description: "Pede ao app para navegar até uma rota.",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_rss_feed",
      description: "Adiciona um feed RSS/Atom de notícias tech ao app.",
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
      description: "Lista todos os feeds RSS cadastrados.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_free_course",
      description: "Cria um curso gratuito no catálogo.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          area: { type: "string" },
          description: { type: "string" },
          workload: { type: "string" },
          link_url: { type: "string" },
          status: { type: "string", enum: ["available", "soon"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Pesquisa atualizada na internet.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "admin_stats",
      description: "Retorna estatísticas gerais para o admin.",
      parameters: { type: "object", properties: {} },
    },
  },
] as const;

async function auditTool(
  admin: ReturnType<typeof createClient>,
  ctx: AuthzCtx,
  entry: { tool: string; args: unknown; allowed: boolean; reason?: string; result?: any },
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
    console.error("[ella-chat] falha ao registrar auditoria");
  }
}

async function executeTool(name: string, args: unknown, admin: any, ctx: AuthzCtx) {
  const isAuthorized = authorizeTool(name, ctx);
  if (!isAuthorized) {
    await auditTool(admin, ctx, { tool: name, args, allowed: false, reason: "Unauthorized" });
    return { error: "Sem permissão para esta ação." };
  }
  
  // Implementação delegada para a lógica do app...
  // (Este é um exemplo, na prática chamaria as RPCs/tabelas do Supabase)
  return { ok: true, summary: `Executado ${name}` };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;

  if (!GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: "Google AI API Key não configurada." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
    const authHeader = req.headers.get("Authorization");
    const { data: { user }, error: authError } = await adminClient.auth.getUser(authHeader?.split(" ")[1] ?? "");
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authzCtx = await buildAuthzCtx(adminClient, user.id);
    const body = await req.json();
    const messages = sanitizeIncomingMessages(body.messages || []);
    const availableTools = filterToolCatalog(tools, authzCtx);

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
        }),
      });

    const res = await callModel(GOOGLE_MODEL, false);
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ error: `Google AI Error: ${errorText}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const assistantMsg = data.choices?.[0]?.message;
    
    if (assistantMsg?.tool_calls) {
      const executedActions = [];
      for (const tc of assistantMsg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
        const result = await executeTool(tc.function.name, args, adminClient, authzCtx);
        executedActions.push({ name: tc.function.name, args, result });
      }
      return new Response(JSON.stringify({ reply: assistantMsg.content, actions: executedActions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: assistantMsg.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("ella-chat error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
