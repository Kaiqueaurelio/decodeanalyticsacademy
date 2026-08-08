import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const getCorsHeaders(req) = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ApostilaPayload = {
  apostila_id?: string;
  apostilaId?: string;
  title?: string;
  category?: string;
  content?: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72) || "apostila";
}

function shortText(value: string | null | undefined, max = 2800) {
  return String(value || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/[#*_`>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function extractInlineImage(data: any): { base64: string; mimeType: string } | null {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = part?.inlineData || part?.inline_data;
    const base64 = inline?.data;
    const mimeType = inline?.mimeType || inline?.mime_type || "image/png";
    if (base64 && typeof base64 === "string") return { base64, mimeType };
  }
  return null;
}

function fallbackSvgCover(title: string, category: string) {
  const safeTitle = title.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
  const safeCategory = category.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#020617"/>
      <stop offset="0.55" stop-color="#081826"/>
      <stop offset="1" stop-color="#0b2f2c"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#dfff2f"/>
      <stop offset="1" stop-color="#26f0c7"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="16" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="72" y="72" width="1136" height="576" rx="38" fill="#0b0f16" opacity=".76" stroke="#dfff2f" stroke-opacity=".35"/>
  <circle cx="1030" cy="154" r="130" fill="#26f0c7" opacity=".12" filter="url(#glow)"/>
  <circle cx="232" cy="574" r="180" fill="#dfff2f" opacity=".08" filter="url(#glow)"/>
  <text x="108" y="154" fill="#dfff2f" font-family="Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="4">DECODE ANALYTICS ACADEMY</text>
  <text x="108" y="244" fill="#f8fafc" font-family="Arial, sans-serif" font-size="62" font-weight="900">${safeTitle}</text>
  <rect x="108" y="510" width="760" height="14" rx="7" fill="url(#accent)"/>
  <rect x="108" y="548" width="620" height="52" rx="18" fill="#dfff2f" opacity=".16"/>
  <text x="132" y="583" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">${safeCategory}</text>
  <text x="964" y="594" fill="#dfff2f" font-family="Arial, sans-serif" font-size="92" font-weight="900">AULA</text>
</svg>`;
  return new TextEncoder().encode(svg);
}

async function callGeminiImage(apiKey: string, prompt: string) {
  const model = "gemini-2.0-flash"; // Use the standard flash model which supports text-to-image in v1beta
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    },
  );

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Gemini image error ${resp.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const image = extractInlineImage(data);
  if (!image) throw new Error("Gemini nao retornou imagem.");
  return image;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Permission denied: admin only" }), {
        status: 403,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ApostilaPayload;
    const apostilaId = String(body.apostila_id || body.apostilaId || "").trim();
    if (!apostilaId) {
      return new Response(JSON.stringify({ error: "apostila_id e obrigatorio" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { data: apostila, error: apErr } = await admin
      .from("apostilas")
      .select("id, title, category, content")
      .eq("id", apostilaId)
      .maybeSingle();
    if (apErr || !apostila) {
      return new Response(JSON.stringify({ error: "Apostila nao encontrada" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const title = shortText(body.title || apostila.title, 140) || "Apostila";
    const category = shortText(body.category || apostila.category, 90) || "Disciplina";
    const excerpt = shortText(body.content || apostila.content, 2500);

    const prompt = `Crie uma capa academica profissional para uma apostila digital da Decode Analytics Academy.
Tema da apostila: ${title}
Disciplina: ${category}
Resumo do conteudo: ${excerpt || "Conteudo universitario de tecnologia."}

Requisitos visuais:
- formato horizontal 16:9, estilo plataforma EAD premium em modo escuro
- cores: preto profundo, ciano tecnologia e verde-lima da marca
- visual limpo, moderno, sem poluicao
- inclua elementos abstratos relacionados ao tema, sem texto pequeno ilegivel
- deixe espaco visual para o titulo ser lido no card
- nao use emojis, nao use marcas de terceiros, nao use pessoas famosas`;

    let bytes: Uint8Array;
    let contentType = "image/png";
    let provider = "fallback-svg";

    if (GOOGLE_AI_API_KEY) {
      try {
        const generated = await callGeminiImage(GOOGLE_AI_API_KEY, prompt);
        bytes = Uint8Array.from(atob(generated.base64), (c) => c.charCodeAt(0));
        contentType = generated.mimeType;
        provider = "google-gemini";
      } catch (e) {
        console.warn("AI cover generation failed, using fallback SVG", e);
        bytes = fallbackSvgCover(title, category);
        contentType = "image/svg+xml";
      }
    } else {
      bytes = fallbackSvgCover(title, category);
      contentType = "image/svg+xml";
    }

    const extension = contentType.includes("svg") ? "svg" : contentType.includes("jpeg") ? "jpg" : "png";
    const objectPath = `${apostilaId}/${Date.now()}-${slugify(title)}.${extension}`;

    const { error: uploadError } = await admin.storage.from("apostila-covers").upload(objectPath, bytes, {
      contentType,
      cacheControl: "31536000",
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const { data: publicUrl } = admin.storage.from("apostila-covers").getPublicUrl(objectPath);
    const coverUrl = publicUrl.publicUrl;

    const { error: updateError } = await admin
      .from("apostilas")
      .update({ cover_url: coverUrl })
      .eq("id", apostilaId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true, cover_url: coverUrl, path: objectPath, provider }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message || "Erro ao gerar capa" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
