// Lista anúncios ativos validando o content_scope do usuário no servidor.
// Anúncios são recurso interno de alunos autenticados.
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth-guard.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ALLOWED_TYPES = new Set(["banner", "popup", "inline", "sidebar", "footer"]);
const ALLOWED_ORDER = new Set(["position", "created_at"]);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

type JsonRecord = Record<string, unknown>;

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampInt(raw: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, {
      ...corsHeaders,
      Allow: "GET, OPTIONS",
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (!auth.ok) return auth.response;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE) {
    console.error("list-ads is not configured");
    return json({ ads: [] }, 503, corsHeaders);
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("is_blocked,content_scope")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (profileError || profile?.is_blocked || profile?.content_scope === "enem_only") {
      return json({ ads: [] }, 200, corsHeaders);
    }

    const url = new URL(req.url);
    const adTypeRaw = url.searchParams.get("ad_type");
    const targetPage = url.searchParams.get("target_page");
    const adType = adTypeRaw && ALLOWED_TYPES.has(adTypeRaw) ? adTypeRaw : null;
    const orderRaw = url.searchParams.get("order");
    const orderBy = orderRaw && ALLOWED_ORDER.has(orderRaw) ? orderRaw : "position";
    const dir = url.searchParams.get("dir") === "desc" ? "desc" : "asc";
    const limit = clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 10_000);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const nowIso = new Date().toISOString();
    let query = admin
      .from("ads")
      .select("id,title,description,image_url,link_url,ad_type,position,display_duration,start_date,end_date,target_pages")
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order(orderBy, { ascending: dir === "asc" })
      .range(offset, offset + limit - 1);

    if (adType) query = query.eq("ad_type", adType);

    const { data: rows, error: rowsError } = await query;
    if (rowsError) throw new Error("Ad query failed");

    const finalAds = (rows ?? []).filter((ad: JsonRecord) => {
      const pages = ad.target_pages;
      if (targetPage && Array.isArray(pages) && pages.length > 0) {
        return pages.includes("all") || pages.includes(targetPage);
      }
      return true;
    });

    const stripped = finalAds.map(({ start_date: _start, end_date: _end, target_pages: _pages, ...rest }) => rest);
    return json({ ads: stripped, limit, offset, order: orderBy, dir }, 200, corsHeaders);
  } catch (error) {
    console.error("list-ads error", error instanceof Error ? error.name : "UnknownError");
    return json({ ads: [], error: "Falha ao carregar anúncios" }, 500, corsHeaders);
  }
});
