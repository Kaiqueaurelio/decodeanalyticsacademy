// Edge function: chat didático restrito ao conteúdo da apostila
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Msg {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const apostilaId: string = body.apostilaId;
    const messages: Msg[] = Array.isArray(body.messages) ? body.messages : [];

    if (!apostilaId || messages.length === 0) {
      return new Response(JSON.stringify({ error: "apostilaId e messages são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Carrega a apostila (RLS garante que o aluno só pega publicadas)
    const { data: apostila, error: apErr } = await supabase
      .from("apostilas")
      .select("title, category, content")
      .eq("id", apostilaId)
      .maybeSingle();

    if (apErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trunca conteúdo para caber no contexto (~120k chars é seguro)
    const apostilaContent = (apostila.content || "").slice(0, 120000);

    const systemPrompt = `Você é um tutor didático da Decode Analytics Academy ajudando um aluno a estudar a apostila "${apostila.title}" (${apostila.category}).

REGRAS RIGOROSAS:
1. Você SÓ pode usar fatos, definições, exemplos e dados que estão no CONTEÚDO DA APOSTILA abaixo.
2. Você PODE explicar de forma diferente, dar analogias, reformular, simplificar e propor exercícios — desde que o conteúdo factual venha da apostila.
3. Se o aluno perguntar algo que NÃO está na apostila, responda exatamente: "Isso não está coberto nesta apostila. Sugiro consultar outro material ou perguntar ao professor." e depois indique tópicos relacionados que ESTÃO na apostila.
4. NÃO invente fatos, datas, autores, fórmulas, números ou citações que não estejam no conteúdo abaixo.
5. Sempre responda em português brasileiro, de forma clara, didática e amigável.
6. Use markdown (negrito, listas, código) para deixar as respostas legíveis.
7. Quando útil, cite o trecho/seção da apostila que embasa sua resposta.

==== CONTEÚDO DA APOSTILA ====
${apostilaContent}
==== FIM DO CONTEÚDO ====`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde um instante." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Avise o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Erro no provedor de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("apostila-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro inesperado" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
