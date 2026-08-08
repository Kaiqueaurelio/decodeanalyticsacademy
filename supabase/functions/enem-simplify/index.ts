import { getCorsHeaders } from "../_shared/cors.ts";
// Enriches ENEM apostilas with a plain-language "Descomplicado" intro section.
// Admin-only. Idempotent: skips apostilas already containing the marker.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireUser } from "../_shared/auth-guard.ts";


const MARKER = "<!-- enem-simplified-v1 -->";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function simplify(title: string, content: string): Promise<string> {
  const excerpt = content.slice(0, 12000);
  const prompt = `Você é uma professora carinhosa que explica ENEM para uma criança de 8 anos.
Baseado no conteúdo abaixo da apostila "${title}", escreva uma seção em Markdown chamada "## 🧒 Explicando de forma bem simples" com:

1. **Do que se trata (em 3 frases curtas)** — como se contasse para uma criança.
2. **Analogias do dia a dia** — 4-6 comparações com coisas simples (bolo, videogame, brincadeira, futebol, YouTube).
3. **Os 5 pontos mais importantes** — cada um em UMA frase curta, sem palavras difíceis. Se usar palavra técnica, explique entre parênteses.
4. **Como isso cai no ENEM** — 3 dicas práticas do que a banca costuma perguntar, em linguagem simples.
5. **Miniglossário fácil** — 6 termos com definição de 1 linha, formato "**Palavra:** significado simples".
6. **Truque de memorização** — 1 mnemônico ou frase-âncora divertida.

Regras: português BR, tom acolhedor, frases curtas, zero jargão sem explicação, use emojis com moderação (2-3 por subseção). Não repita o título da apostila. Não escreva introduções tipo "aqui está" — vá direto ao conteúdo.

CONTEÚDO DA APOSTILA:
${excerpt}`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI ${r.status}: ${t.slice(0, 300)}`);
  }
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty AI response");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const auth = await requireUser(req, getCorsHeaders(req), { requireAdmin: true });
  if (!auth.ok) return auth.response;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const body = await req.json().catch(() => ({}));
  const onlyId: string | undefined = body?.apostila_id;

  let q = admin.from("apostilas").select("id,title,content").eq("category", "ENEM");
  if (onlyId) q = q.eq("id", onlyId);
  const { data: rows, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });

  const results: any[] = [];
  for (const row of rows ?? []) {
    try {
      const content = row.content ?? "";
      if (content.includes(MARKER)) {
        results.push({ id: row.id, title: row.title, status: "skipped" });
        continue;
      }
      if (content.length < 400) {
        results.push({ id: row.id, title: row.title, status: "too-short" });
        continue;
      }
      const simple = await simplify(row.title, content);
      const newContent = `${MARKER}\n\n${simple}\n\n---\n\n${content}`;
      const { error: upErr } = await admin.from("apostilas").update({ content: newContent }).eq("id", row.id);
      if (upErr) throw upErr;
      results.push({ id: row.id, title: row.title, status: "enriched", added: simple.length });
    } catch (e) {
      results.push({ id: row.id, title: row.title, status: "error", error: String(e).slice(0, 300) });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
});
