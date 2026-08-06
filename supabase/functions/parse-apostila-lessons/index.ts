// Parser: pega o `content` markdown existente da apostila e explode em
// módulos (H1) → capítulos (H2) → lições (H3). Se não houver H3 dentro de um H2,
// o próprio H2 vira uma única lição com todo o corpo. Se não houver H1, cria
// um módulo "Conteúdo" único. Idempotente: se `replace=true` limpa a árvore
// anterior antes de inserir. Nunca apaga o campo `content` original.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireUser } from "../_shared/auth-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Lesson = { title: string; content: string };
type Chapter = { title: string; summary?: string; lessons: Lesson[] };
type Module = { title: string; description?: string; chapters: Chapter[] };

function slugTrim(s: string, n = 140) {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

function estimateMinutes(text: string): number {
  // ~230 palavras/min; devolve entre 3 e 45.
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(45, Math.round(words / 230)));
}

function parseMarkdown(md: string): Module[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const modules: Module[] = [];
  let currentModule: Module | null = null;
  let currentChapter: Chapter | null = null;
  let currentLesson: Lesson | null = null;
  let buffer: string[] = [];

  const flushLesson = () => {
    if (currentLesson && currentChapter) {
      currentLesson.content = buffer.join("\n").trim();
      currentChapter.lessons.push(currentLesson);
    }
    buffer = [];
    currentLesson = null;
  };

  const openChapterWithImplicitLesson = (title: string) => {
    // Se aparecer conteúdo antes de qualquer H3, precisamos de uma lição
    // padrão para não perder texto.
    currentLesson = { title: "Visão geral", content: "" };
  };

  for (const raw of lines) {
    const line = raw;
    const h1 = /^#\s+(.+)$/.exec(line);
    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);

    if (h1) {
      // Novo módulo
      flushLesson();
      if (currentChapter && currentChapter.lessons.length === 0) {
        // Capítulo vazio: descarta
      }
      currentModule = { title: slugTrim(h1[1]), chapters: [] };
      modules.push(currentModule);
      currentChapter = null;
      continue;
    }
    if (h2) {
      flushLesson();
      if (!currentModule) {
        currentModule = { title: "Conteúdo", chapters: [] };
        modules.push(currentModule);
      }
      currentChapter = { title: slugTrim(h2[1]), lessons: [] };
      currentModule.chapters.push(currentChapter);
      openChapterWithImplicitLesson(currentChapter.title);
      continue;
    }
    if (h3) {
      flushLesson();
      if (!currentModule) {
        currentModule = { title: "Conteúdo", chapters: [] };
        modules.push(currentModule);
      }
      if (!currentChapter) {
        currentChapter = { title: currentModule.title, lessons: [] };
        currentModule.chapters.push(currentChapter);
      }
      currentLesson = { title: slugTrim(h3[1]), content: "" };
      continue;
    }
    // Linha comum: acumula
    if (currentLesson) {
      buffer.push(line);
    } else if (currentChapter) {
      // Ainda não abrimos lição explícita → cria uma "Visão geral"
      currentLesson = { title: "Visão geral", content: "" };
      buffer.push(line);
    } else {
      // Conteúdo solto no topo → cria módulo+capítulo+lição padrão
      if (!currentModule) {
        currentModule = { title: "Conteúdo", chapters: [] };
        modules.push(currentModule);
      }
      currentChapter = { title: "Introdução", lessons: [] };
      currentModule.chapters.push(currentChapter);
      currentLesson = { title: "Visão geral", content: "" };
      buffer.push(line);
    }
  }
  flushLesson();
  // Limpa capítulos vazios / lições vazias
  for (const m of modules) {
    m.chapters = m.chapters.filter((c) => c.lessons.some((l) => l.content.trim().length > 0));
    for (const c of m.chapters) {
      c.lessons = c.lessons.filter((l) => l.content.trim().length > 0);
    }
  }
  return modules.filter((m) => m.chapters.length > 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders, { requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const { apostila_id, replace } = await req.json();
    if (!apostila_id) {
      return new Response(JSON.stringify({ error: "apostila_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: apostila, error: aErr } = await admin
      .from("apostilas")
      .select("id, title, content")
      .eq("id", apostila_id)
      .single();
    if (aErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const md = (apostila.content as string) || "";
    if (md.trim().length < 40) {
      return new Response(JSON.stringify({ error: "Conteúdo insuficiente para estruturar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (replace) {
      // Deletar em lote usando o apostila_id direto se o schema permitir,
      // ou coletando IDs para evitar timeout em deleções muito grandes.
      const { error: delErr } = await admin
        .from("apostila_modules")
        .delete()
        .eq("apostila_id", apostila_id);

      if (delErr) {
        console.error("Erro ao limpar módulos existentes:", delErr);
        // Não falhamos o processo inteiro se a limpeza falhar por causa de FKS,
        // mas tentamos seguir.
      }
    }

    const modules = parseMarkdown(md);
    let moduleCount = 0;
    let chapterCount = 0;
    let lessonCount = 0;

    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi];
      const { data: modRow, error: mErr } = await admin
        .from("apostila_modules")
        .insert({
          apostila_id,
          order_index: mi,
          title: mod.title,
          description: mod.description ?? null,
        })
        .select("id")
        .single();
      if (mErr || !modRow) throw new Error(`Falha inserindo módulo: ${mErr?.message}`);
      moduleCount++;

      for (let ci = 0; ci < mod.chapters.length; ci++) {
        const ch = mod.chapters[ci];
        const chapterMinutes = ch.lessons.reduce(
          (acc, l) => acc + estimateMinutes(l.content),
          0,
        );
        const { data: chapRow, error: cErr } = await admin
          .from("apostila_chapters")
          .insert({
            module_id: modRow.id,
            order_index: ci,
            title: ch.title,
            summary: ch.summary ?? null,
            estimated_minutes: chapterMinutes,
          })
          .select("id")
          .single();
        if (cErr || !chapRow) throw new Error(`Falha inserindo capítulo: ${cErr?.message}`);
        chapterCount++;

        const lessonRows = ch.lessons.map((l, li) => ({
          chapter_id: chapRow.id,
          order_index: li,
          title: l.title,
          content_md: l.content,
          estimated_minutes: estimateMinutes(l.content),
          content_status: "ready",
          difficulty: "iniciante",
        }));
        if (lessonRows.length) {
          const { error: lErr } = await admin.from("apostila_lessons").insert(lessonRows);
          if (lErr) throw new Error(`Falha inserindo lições: ${lErr.message}`);
          lessonCount += lessonRows.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        modules: moduleCount,
        chapters: chapterCount,
        lessons: lessonCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
