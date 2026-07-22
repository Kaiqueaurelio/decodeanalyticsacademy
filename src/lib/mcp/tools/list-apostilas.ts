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
  name: "list_apostilas",
  title: "Listar apostilas",
  description: "Lista apostilas publicadas visíveis para o usuário autenticado, opcionalmente filtradas por disciplina/categoria ou busca textual no título.",
  inputSchema: {
    search: z.string().optional().describe("Filtro textual no título."),
    category: z.string().optional().describe("Categoria/disciplina."),
    limit: z.number().int().min(1).max(50).optional().describe("Máximo de itens (padrão 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    let q = sb(ctx).from("apostilas").select("id,title,category,course,semester,published,updated_at").eq("published", true).order("updated_at", { ascending: false }).limit(limit ?? 20);
    if (search) q = q.ilike("title", `%${search}%`);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
