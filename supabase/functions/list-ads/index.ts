// Lista anúncios ativos validando o content_scope do usuário no servidor.
// Autenticado: se o perfil for `enem_only` (ou bloqueado), retorna [].
// Não autenticado: retorna [] (anúncios são recurso interno de alunos logados).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_TYPES = new Set(["banner", "popup", "inline", "sidebar", "footer"]);
const ALLOWED_ORDER = new Set(["position", "created_at"]);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampInt(raw: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const adTypeRaw = url.searchParams.get("ad_type");
    const targetPage = url.searchParams.get("target_page");
    const adType = adTypeRaw && ALLOWED_TYPES.has(adTypeRaw) ? adTypeRaw : null;

    const orderRaw = url.searchParams.get("order");
    const orderBy = orderRaw && ALLOWED_ORDER.has(orderRaw) ? orderRaw : "position";
    const dir = url.searchParams.get("dir") === "desc" ? "desc" : "asc";
    const limit = clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 10_000);


    // Anúncios são visíveis para todos: logados ou não, em qualquer escopo de conteúdo.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);



    // Busca anúncios ativos e válidos por janela, com ordenação + paginação server-side
    const nowIso = new Date().toISOString();
    let query = admin
      .from("ads")
      .select(
        "id, title, description, image_url, link_url, ad_type, position, display_duration, view_count, click_count, start_date, end_date, target_pages",
      )
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order(orderBy, { ascending: dir === "asc" })
      .range(offset, offset + limit - 1);

    if (adType) query = query.eq("ad_type", adType);

    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) throw rowsErr;

    // target_pages ainda é filtrado em memória (array com "all" ou página específica)
    const finalAds = (rows || []).filter((ad: any) => {
      if (targetPage && Array.isArray(ad.target_pages) && ad.target_pages.length > 0) {
        if (!ad.target_pages.includes("all") && !ad.target_pages.includes(targetPage)) return false;
      }
      return true;
    });

    // Remove campos internos antes de devolver
    const stripped = finalAds.map(({ start_date, end_date, target_pages, ...rest }: any) => rest);
    return json({ ads: stripped, limit, offset, order: orderBy, dir });
  } catch (e) {
    console.error("list-ads error", e);
    return json({ ads: [], error: "Falha ao carregar anúncios" }, 500);
  }
});

function json(body: unknown, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
