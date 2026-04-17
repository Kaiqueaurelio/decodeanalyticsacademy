// Extracts calendar events (provas, trabalhos, atividades) from a PDF using Lovable AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env missing");

    // Validate auth + admin role
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pdfBase64, pdfUrl, imageBase64, imageMime, imageUrl, rawText, defaultSubject } = await req.json();
    if (!pdfBase64 && !pdfUrl && !imageBase64 && !imageUrl && !rawText) {
      return new Response(JSON.stringify({ error: "pdfBase64, pdfUrl, imageBase64, imageUrl or rawText required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const sysPrompt = `Você analisa cronogramas/planos de ensino acadêmicos (em PDF, imagem ou TEXTO BRUTO digitado/colado) e extrai TODOS os eventos avaliativos (provas, trabalhos, atividades, seminários, entregas).
Hoje é ${today}. Retorne datas no formato YYYY-MM-DD. Se houver hora, inclua em HH:MM. Se a data tiver só dia/mês, assuma o ano corrente ou próximo coerente. Se houver várias datas, retorne todas. Não invente datas. event_type deve ser um de: prova, trabalho, atividade, seminario, entrega, aula. Se a disciplina não estiver clara em cada item, use o defaultSubject fornecido. Aceite texto desorganizado/livre — interprete e estruture mesmo que mal formatado.`;

    const userContent: any[] = [
      { type: "text", text: `Extraia todos os eventos com data deste cronograma. defaultSubject="${defaultSubject ?? ""}".` },
    ];
    if (rawText) {
      userContent.push({ type: "text", text: `Texto bruto do cronograma:\n\n${rawText}` });
    } else if (pdfBase64) {
      userContent.push({ type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } });
    } else if (imageBase64) {
      const mime = imageMime || "image/png";
      userContent.push({ type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } });
    } else {
      userContent.push({ type: "image_url", image_url: { url: pdfUrl || imageUrl } });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_events",
            description: "Salva os eventos extraídos do cronograma",
            parameters: {
              type: "object",
              properties: {
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      event_date: { type: "string", description: "YYYY-MM-DD" },
                      event_time: { type: "string", description: "HH:MM ou vazio" },
                      event_type: { type: "string", enum: ["prova", "trabalho", "atividade", "seminario", "entrega", "aula"] },
                      subject: { type: "string" },
                    },
                    required: ["title", "event_date", "event_type"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["events"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_events" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let events: any[] = [];
    if (toolCall?.function?.arguments) {
      try { events = JSON.parse(toolCall.function.arguments).events ?? []; } catch (e) { console.error("parse args", e); }
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-calendar-events", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
