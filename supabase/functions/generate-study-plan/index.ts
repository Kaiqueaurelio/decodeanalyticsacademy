import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExamEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  subject: string | null;
}
interface Apostila {
  id: string;
  title: string;
  category: string;
}

/**
 * Distribui apostilas em até `daysAhead` dias antes da prova,
 * respeitando 1-3 apostilas/dia e priorizando provas mais próximas.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 21);
    const horizonStr = horizon.toISOString().slice(0, 10);

    // Próximas avaliações (até 21 dias)
    const { data: events } = await adminClient
      .from("calendar_events")
      .select("id,title,event_date,event_type,subject")
      .gte("event_date", todayStr)
      .lte("event_date", horizonStr)
      .in("event_type", ["prova", "trabalho", "entrega"])
      .order("event_date", { ascending: true });

    // Apostilas publicadas
    const { data: apostilas } = await adminClient
      .from("apostilas")
      .select("id,title,category")
      .eq("published", true);

    // Apostilas que o usuário já concluiu
    const { data: completions } = await adminClient
      .from("apostila_completions")
      .select("apostila_id")
      .eq("user_id", userId);
    const completedIds = new Set((completions ?? []).map((c) => c.apostila_id));

    // Apaga plano antigo a partir de hoje (recálculo)
    await adminClient.from("study_plans").delete()
      .eq("user_id", userId).gte("plan_date", todayStr);

    const inserts: any[] = [];
    const usedToday = new Map<string, number>(); // plan_date -> count
    const seen = new Set<string>(); // apostila_id agendado

    const eventList: ExamEvent[] = (events as ExamEvent[]) ?? [];
    const apList: Apostila[] = (apostilas as Apostila[]) ?? [];

    if (apList.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, message: "Nenhuma apostila publicada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Para cada prova: pegar apostilas da mesma matéria (subject ~ category) e distribuir nos dias úteis antes
    for (const ev of eventList) {
      const subj = (ev.subject || ev.title || "").toLowerCase();
      const matchingAp = apList.filter((a) => {
        const cat = (a.category || "").toLowerCase();
        return cat && (subj.includes(cat) || cat.includes(subj));
      });

      const candidates = matchingAp.length > 0 ? matchingAp : apList.slice(0, 3);

      const examDate = new Date(ev.event_date + "T12:00:00");
      const daysUntil = Math.max(1, Math.ceil((examDate.getTime() - today.getTime()) / 86400000));
      const studyWindow = Math.min(daysUntil, 7); // estuda no máx 7 dias antes
      const startOffset = Math.max(0, daysUntil - studyWindow);

      let dayCursor = startOffset;
      for (const ap of candidates) {
        if (seen.has(ap.id)) continue;
        if (completedIds.has(ap.id)) continue;

        // Acha um dia com < 3 apostilas
        let placed = false;
        for (let attempt = 0; attempt < studyWindow && !placed; attempt++) {
          const planDate = new Date(today);
          planDate.setDate(today.getDate() + dayCursor);
          const dateStr = planDate.toISOString().slice(0, 10);
          const used = usedToday.get(dateStr) ?? 0;
          if (used < 3) {
            inserts.push({
              user_id: userId,
              plan_date: dateStr,
              apostila_id: ap.id,
              apostila_title: ap.title,
              subject: ap.category,
              reason: `Preparar para ${ev.event_type === "prova" ? "prova" : ev.event_type} de ${ap.category} em ${daysUntil}d`,
              pomodoros: 2,
              related_event_id: ev.id,
              related_event_title: ev.title,
              related_event_date: ev.event_date,
              sort_order: used,
            });
            usedToday.set(dateStr, used + 1);
            seen.add(ap.id);
            placed = true;
          }
          dayCursor = (dayCursor + 1) % Math.max(1, studyWindow);
          if (dayCursor < startOffset) dayCursor = startOffset;
        }
      }
    }

    // 2) Preencher dias vazios (próximos 7 dias) com apostilas pendentes (estudo regular)
    for (let i = 0; i < 7; i++) {
      const planDate = new Date(today);
      planDate.setDate(today.getDate() + i);
      const dateStr = planDate.toISOString().slice(0, 10);
      const used = usedToday.get(dateStr) ?? 0;
      if (used >= 1) continue; // ao menos 1 por dia
      const next = apList.find((a) => !seen.has(a.id) && !completedIds.has(a.id));
      if (!next) break;
      inserts.push({
        user_id: userId,
        plan_date: dateStr,
        apostila_id: next.id,
        apostila_title: next.title,
        subject: next.category,
        reason: `Estudo regular de ${next.category}`,
        pomodoros: 1,
        sort_order: used,
      });
      usedToday.set(dateStr, used + 1);
      seen.add(next.id);
    }

    if (inserts.length > 0) {
      const { error } = await adminClient.from("study_plans").insert(inserts);
      if (error) {
        console.error("insert study_plans error", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      inserted: inserts.length,
      events: eventList.length,
      apostilas: apList.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
