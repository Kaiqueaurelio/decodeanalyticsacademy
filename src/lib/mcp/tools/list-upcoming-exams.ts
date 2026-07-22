import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_upcoming_exams",
  title: "Próximas provas e eventos",
  description: "Lista os próximos eventos do calendário acadêmico (provas, entregas, avisos com data) a partir de hoje.",
  inputSchema: {
    days: z.number().int().min(1).max(180).optional().describe("Janela em dias a partir de hoje (padrão 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const today = new Date().toISOString();
    const end = new Date(Date.now() + (days ?? 30) * 86400000).toISOString();
    const { data, error } = await sb(ctx)
      .from("calendar_events")
      .select("id,title,subject,event_type,event_date,description")
      .gte("event_date", today)
      .lte("event_date", end)
      .order("event_date", { ascending: true })
      .limit(50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
