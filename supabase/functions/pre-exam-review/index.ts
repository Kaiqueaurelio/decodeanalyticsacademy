import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";


interface ReviewBundle {
  event: {
    id: string;
    title: string;
    event_date: string;
    event_type: string;
    subject: string | null;
    description: string | null;
    days_until: number;
  };
  weak_topics: Array<{ apostila_id: string; title: string; total: number; errors: number; accuracy: number }>;
  due_flashcards: Array<{ id: string; front: string; back: string; apostila_id: string | null }>;
  related_apostilas: Array<{ id: string; title: string; category: string; completed: boolean }>;
  ai_summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { eventId } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId obrigatório" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Evento
    const { data: ev } = await admin
      .from("calendar_events")
      .select("id,title,event_date,event_type,subject,description")
      .eq("id", eventId)
      .maybeSingle();

    if (!ev) {
      return new Response(JSON.stringify({ error: "Prova não encontrada" }), {
        status: 404, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const today = new Date();
    const examDate = new Date(ev.event_date + "T23:59:59");
    const daysUntil = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / 86400000));

    // 2) Apostilas relacionadas (match por subject/category fuzzy)
    const { data: allApostilas } = await admin
      .from("apostilas")
      .select("id,title,category")
      .eq("published", true);

    const subj = (ev.subject || ev.title || "").toLowerCase();
    const matching = (allApostilas ?? []).filter((a) => {
      const cat = (a.category || "").toLowerCase();
      return cat && (subj.includes(cat) || cat.includes(subj) ||
        (ev.title || "").toLowerCase().includes(cat));
    });
    const candidates = matching.length > 0 ? matching : (allApostilas ?? []).slice(0, 5);
    const candidateIds = candidates.map((a) => a.id);

    // 3) Completions
    const { data: comps } = await admin
      .from("apostila_completions")
      .select("apostila_id")
      .eq("user_id", userId)
      .in("apostila_id", candidateIds.length ? candidateIds : ["00000000-0000-0000-0000-000000000000"]);
    const completedSet = new Set((comps ?? []).map((c) => c.apostila_id));

    // 4) Tópicos fracos: respostas erradas em exercícios das apostilas relacionadas
    const { data: exsRaw } = await admin
      .from("exercises")
      .select("id,apostila_id")
      .in("apostila_id", candidateIds.length ? candidateIds : ["00000000-0000-0000-0000-000000000000"]);
    const exercises = exsRaw ?? [];
    const exIds = exercises.map((e) => e.id);

    const { data: ans } = await admin
      .from("answers")
      .select("exercise_id,is_correct")
      .eq("user_id", userId)
      .in("exercise_id", exIds.length ? exIds : ["00000000-0000-0000-0000-000000000000"]);

    const exToApostila = new Map(exercises.map((e) => [e.id, e.apostila_id]));
    const stats = new Map<string, { total: number; errors: number }>();
    for (const a of ans ?? []) {
      const apId = exToApostila.get(a.exercise_id);
      if (!apId) continue;
      const cur = stats.get(apId) ?? { total: 0, errors: 0 };
      cur.total += 1;
      if (!a.is_correct) cur.errors += 1;
      stats.set(apId, cur);
    }
    const weak_topics = candidates
      .map((a) => {
        const s = stats.get(a.id) ?? { total: 0, errors: 0 };
        const accuracy = s.total > 0 ? (s.total - s.errors) / s.total : 0;
        return { apostila_id: a.id, title: a.title, total: s.total, errors: s.errors, accuracy };
      })
      .filter((x) => x.total > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // 5) Flashcards atrasados das apostilas relacionadas
    const nowIso = new Date().toISOString();
    const { data: flashRaw } = await admin
      .from("flashcards")
      .select("id,front,back,apostila_id,next_review")
      .eq("user_id", userId)
      .lte("next_review", nowIso)
      .in("apostila_id", candidateIds.length ? candidateIds : ["00000000-0000-0000-0000-000000000000"])
      .order("next_review", { ascending: true })
      .limit(15);
    const due_flashcards = (flashRaw ?? []).map((f) => ({
      id: f.id, front: f.front, back: f.back, apostila_id: f.apostila_id,
    }));

    const related_apostilas = candidates.map((a) => ({
      id: a.id, title: a.title, category: a.category,
      completed: completedSet.has(a.id),
    }));

    // 6) Resumo IA dos pontos-chave (best-effort) — dual provider
    let ai_summary = "";
    let providerUsed: "google-direct" | "lovable-ai" | "none" = "none";

    if ((LOVABLE_API_KEY || GOOGLE_AI_API_KEY) && candidates.length > 0) {
      try {
        // Lê preferência
        const { data: settingRow } = await admin
          .from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
        const preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;

        const { data: contents } = await admin
          .from("apostilas")
          .select("title,content")
          .in("id", candidateIds.slice(0, 3));
        const corpus = (contents ?? [])
          .map((c) => `## ${c.title}\n${(c.content || "").slice(0, 4000)}`)
          .join("\n\n");

        const sysContent = "Você é um tutor que prepara alunos para provas. Gere um resumo enxuto em markdown com os 7-10 pontos mais cobrados em prova, fórmulas-chave e armadilhas comuns. Use bullets curtos e negrito nos termos. Máximo 400 palavras. Responda em português.";
        const userContent = `Prova: ${ev.title} (${ev.subject || "geral"}) em ${daysUntil} dias.\n\nMaterial relacionado:\n${corpus}`;

        const callGoogle = async (): Promise<string> => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: userContent }] }],
              systemInstruction: { parts: [{ text: sysContent }] },
              generationConfig: { temperature: 0.5, maxOutputTokens: 1500 },
            }),
          });
          if (!resp.ok) {
            console.error("Google pre-exam-review error", resp.status, (await resp.text()).slice(0, 300));
            return "";
          }
          const data = await resp.json();
          return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
        };

        const callLovable = async (): Promise<string> => {
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: sysContent },
                { role: "user", content: userContent },
              ],
            }),
          });
          if (!aiResp.ok) {
            console.error("AI gateway error", aiResp.status, await aiResp.text());
            return "";
          }
          const j = await aiResp.json();
          return j.choices?.[0]?.message?.content ?? "";
        };

        if (corpus.trim().length > 0) {
          if (preferGoogle && GOOGLE_AI_API_KEY) {
            ai_summary = await callGoogle();
            providerUsed = "google-direct";
            if (!ai_summary && LOVABLE_API_KEY) {
              ai_summary = await callLovable();
              providerUsed = "lovable-ai";
            }
          } else if (LOVABLE_API_KEY) {
            ai_summary = await callLovable();
            providerUsed = "lovable-ai";
            if (!ai_summary && GOOGLE_AI_API_KEY) {
              ai_summary = await callGoogle();
              providerUsed = "google-direct";
            }
          } else if (GOOGLE_AI_API_KEY) {
            ai_summary = await callGoogle();
            providerUsed = "google-direct";
          }
        }
      } catch (err) {
        console.error("AI summary error:", err);
      }
    }

    const bundle: ReviewBundle = {
      event: {
        id: ev.id,
        title: ev.title,
        event_date: ev.event_date,
        event_type: ev.event_type,
        subject: ev.subject,
        description: ev.description,
        days_until: daysUntil,
      },
      weak_topics,
      due_flashcards,
      related_apostilas,
      ai_summary,
    };

    return new Response(JSON.stringify({ ...bundle, provider: providerUsed }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "X-AI-Provider": providerUsed },
    });
  } catch (e) {
    console.error("pre-exam-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
