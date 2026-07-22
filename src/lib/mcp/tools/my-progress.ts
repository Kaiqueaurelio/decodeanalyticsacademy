import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "my_progress",
  title: "Meu progresso",
  description: "Retorna o resumo de gamificação do usuário: XP, nível, streak e apostilas concluídas.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const client = sb(ctx);
    const uid = ctx.getUserId();
    const [xp, streak, completions] = await Promise.all([
      client.from("user_xp").select("*").eq("user_id", uid).maybeSingle(),
      client.from("study_streaks").select("*").eq("user_id", uid).maybeSingle(),
      client.from("apostila_completions").select("apostila_id", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    const summary = {
      xp: xp.data ?? null,
      streak: streak.data ?? null,
      completed_apostilas: completions.count ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
