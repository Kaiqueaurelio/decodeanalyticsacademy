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
  name: "get_apostila",
  title: "Ler apostila",
  description: "Retorna o conteúdo completo (markdown/HTML) e metadados de uma apostila pelo id.",
  inputSchema: {
    id: z.string().uuid().describe("UUID da apostila."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const { data, error } = await sb(ctx).from("apostilas").select("*").eq("id", id).maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Apostila não encontrada" }], isError: true };
    return {
      content: [{ type: "text", text: `# ${data.title}\n\n${data.content ?? ""}` }],
      structuredContent: { apostila: data },
    };
  },
});
