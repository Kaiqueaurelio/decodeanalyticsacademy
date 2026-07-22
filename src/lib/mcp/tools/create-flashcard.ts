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
  name: "create_flashcard",
  title: "Criar flashcard",
  description: "Cria um novo flashcard (frente/verso) para o usuário autenticado.",
  inputSchema: {
    front: z.string().trim().min(1),
    back: z.string().trim().min(1),
    subject: z.string().trim().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  handler: async ({ front, back, subject }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("flashcards")
      .insert({ user_id: ctx.getUserId(), front, back, subject: subject ?? null })
      .select()
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Flashcard criado (${data?.id}).` }],
      structuredContent: { flashcard: data },
    };
  },
});
