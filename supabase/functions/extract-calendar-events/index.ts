import { getCorsHeaders } from "../_shared/cors.ts";
// Extracts calendar events (provas, trabalhos, atividades) from a PDF using Lovable AI or Google AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const getCorsHeaders(req) = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENTS_SCHEMA = {
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
      },
    },
  },
  required: ["events"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY && !GOOGLE_AI_API_KEY) throw new Error("Nenhum provedor de IA configurado");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env missing");

    // Validate auth + admin role
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Lê preferência preferGoogle
    let preferGoogle = false;
    try {
      const { data: settingRow } = await supabase
        .from("app_settings").select("value").eq("key", "ai_provider").maybeSingle();
      preferGoogle = !!(settingRow?.value as any)?.preferGoogle && !!GOOGLE_AI_API_KEY;
    } catch { /* ignore */ }

    const { pdfBase64, pdfUrl, imageBase64, imageMime, imageUrl, rawText, defaultSubject } = await req.json();
    if (!pdfBase64 && !pdfUrl && !imageBase64 && !imageUrl && !rawText) {
      return new Response(JSON.stringify({ error: "pdfBase64, pdfUrl, imageBase64, imageUrl or rawText required" }), {
        status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    const sysPrompt = `Você analisa cronogramas/planos de ensino acadêmicos (em PDF, imagem ou TEXTO BRUTO digitado/colado) e extrai TODOS os eventos avaliativos (provas, trabalhos, atividades, seminários, entregas).
Hoje é ${today}. Retorne datas no formato YYYY-MM-DD. Se houver hora, inclua em HH:MM. Se a data tiver só dia/mês, assuma o ano corrente ou próximo coerente. Se houver várias datas, retorne todas. Não invente datas. event_type deve ser um de: prova, trabalho, atividade, seminario, entrega, aula. Se a disciplina não estiver clara em cada item, use o defaultSubject fornecido. Aceite texto desorganizado/livre — interprete e estruture mesmo que mal formatado.`;

    const introText = `Extraia todos os eventos com data deste cronograma. defaultSubject="${defaultSubject ?? ""}".`;

    // ====== Google direto ======
    const callGoogle = async (): Promise<any[] | null> => {
      const parts: any[] = [{ text: introText }];
      if (rawText) {
        parts.push({ text: `Texto bruto do cronograma:\n\n${rawText}` });
      } else if (pdfBase64) {
        parts.push({ inlineData: { mimeType: "application/pdf", data: pdfBase64 } });
      } else if (imageBase64) {
        parts.push({ inlineData: { mimeType: imageMime || "image/png", data: imageBase64 } });
      } else {
        // Google não baixa URLs externos via inlineData; cai pro Lovable
        return null;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${encodeURIComponent(GOOGLE_AI_API_KEY!)}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          systemInstruction: { parts: [{ text: sysPrompt }] },
          tools: [{
            functionDeclarations: [{
              name: "save_events",
              description: "Salva os eventos extraídos do cronograma",
              parameters: EVENTS_SCHEMA,
            }],
          }],
          toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["save_events"] } },
          generationConfig: { temperature: 0.2 },
        }),
      });
      if (!resp.ok) {
        console.error("Google extract-events error", resp.status, (await resp.text()).slice(0, 300));
        return null;
      }
      const data = await resp.json();
      const fnCall = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall)?.functionCall;
      if (!fnCall?.args?.events) return null;
      return fnCall.args.events;
    };

    // ====== Lovable AI ======
    const callLovable = async (): Promise<any[] | { __status: number } | null> => {
      const userContent: any[] = [{ type: "text", text: introText }];
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
              parameters: { ...EVENTS_SCHEMA, additionalProperties: false },
            },
          }],
          tool_choice: { type: "function", function: { name: "save_events" } },
        }),
      });
      if (!aiResp.ok) return { __status: aiResp.status };
      const aiJson = await aiResp.json();
      const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return null;
      try { return JSON.parse(toolCall.function.arguments).events ?? []; } catch { return null; }
    };

    // ====== Estratégia dual ======
    let events: any[] | null = null;
    let providerUsed: "google-direct" | "lovable-ai" | "google-fallback" | "lovable-fallback" = "lovable-ai";

    if (preferGoogle && GOOGLE_AI_API_KEY) {
      events = await callGoogle();
      providerUsed = "google-direct";
      if (!events && LOVABLE_API_KEY) {
        const r = await callLovable();
        if (Array.isArray(r)) { events = r; providerUsed = "lovable-fallback"; }
      }
    } else if (LOVABLE_API_KEY) {
      const r = await callLovable();
      if (r && typeof r === "object" && "__status" in r) {
        if (GOOGLE_AI_API_KEY) {
          events = await callGoogle();
          providerUsed = "google-fallback";
        }
        if (!events) {
          const status = (r as any).__status;
          let msg = "Falha ao extrair eventos.";
          if (status === 429) msg = "Limite de requisições excedido. Tente novamente em alguns instantes.";
          else if (status === 402) msg = "Créditos da IA esgotados. Ative sua chave Google AI Studio em Admin → IA.";
          return new Response(JSON.stringify({ error: msg }), {
            status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          });
        }
      } else if (Array.isArray(r)) {
        events = r;
      }
    } else if (GOOGLE_AI_API_KEY) {
      events = await callGoogle();
      providerUsed = "google-direct";
    }

    return new Response(JSON.stringify({ events: events ?? [], provider: providerUsed }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "X-AI-Provider": providerUsed },
    });
  } catch (e) {
    console.error("extract-calendar-events", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
