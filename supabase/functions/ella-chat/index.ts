// Edge function: Ella — assistente admin com poder de criar/editar/excluir
// no app via tool calling no Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

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
          category: args.category ?? "prova",
          description: args.description ?? null,
          course: args.course ?? null,
          semester: args.semester ?? null,
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
          priority: args.priority ?? "medium",
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
        const q = await admin.from("materials").insert({
          apostila_id: args.apostila_id,
          title: args.title,
          url: args.url,
          kind: args.kind ?? "link",
        }).select("id").single();
        if (q.error) return { ok: false, error: q.error.message };
        return { ok: true, id: q.data.id, summary: "Material adicionado." };
      }
      case "navigate_to": {
        return { ok: true, navigate: args.path, summary: `Abrindo ${args.path}` };
      }
      default:
        return { ok: false, error: `Tool desconhecida: ${name}` };
    }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro inesperado na tool." };
  }
}

const SYSTEM_PROMPT = `Você é a Ella, copiloto admin do Decode Analytics Academy.
Você TEM PODERES REAIS para criar, editar, excluir e navegar no app via as funções (tools) disponíveis.

Regras:
- Responda sempre em português, tom direto e prático, estilo ChatGPT.
- Use markdown (listas, negrito, código quando útil).
- Para ações destrutivas (delete_*), peça confirmação ao usuário em uma resposta de texto ANTES de chamar a tool com confirm=true.
- Quando o usuário pedir para abrir uma página, use navigate_to.
- Não invente IDs — sempre use search_app ou get_apostila antes para descobrir o id correto.
- Após executar uma tool, responda ao usuário com um resumo claro do que foi feito.
- Se uma tool falhar, explique o erro e sugira próximo passo.
- Foco do app: ensino acadêmico (CC, SI, EC). Nunca mencione "IA", "Lovable" ou "hacking".`;

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

    // Valida admin
    const { data: isAdminData } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdminData) return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const incoming: { role: string; content: string }[] = Array.isArray(body.messages) ? body.messages : [];
    const routeCtx: string = body.context ?? "";

    const messages: ChatMsg[] = [
      { role: "system", content: SYSTEM_PROMPT + (routeCtx ? `\n\nContexto atual do usuário: ${routeCtx}` : "") },
      ...incoming.map((m) => ({ role: m.role as any, content: m.content })),
    ];

    const executedTools: any[] = [];
    const MAX_STEPS = 8;

    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: "auto" }),
      });

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

      for (const tc of toolCalls) {
        let parsed: any = {};
        try { parsed = JSON.parse(tc.function.arguments || "{}"); } catch { parsed = {}; }
        const result = await executeTool(tc.function.name, parsed, adminClient, { userId, authHeader });
        executedTools.push({ name: tc.function.name, args: parsed, result });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result).slice(0, 4000),
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
