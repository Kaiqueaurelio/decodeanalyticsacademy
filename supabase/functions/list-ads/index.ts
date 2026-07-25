// Lista anúncios ativos validando o content_scope do usuário no servidor.
// Autenticado: se o perfil for `enem_only` (ou bloqueado), retorna [].
// Não autenticado: retorna [] (anúncios são recurso interno de alunos logados).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_TYPES = new Set(["banner", "popup", "inline", "sidebar", "footer"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const adTypeRaw = url.searchParams.get("ad_type");
    const targetPage = url.searchParams.get("target_page");
    const adType = adTypeRaw && ALLOWED_TYPES.has(adTypeRaw) ? adTypeRaw : null;

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ ads: [] });
    }

    // Valida JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice(7);
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return json({ ads: [] });
    }
    const userId = claims.claims.sub as string;

    // Verifica escopo com service role (não confia em RLS repetido)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("content_scope, is_blocked")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile || profile.is_blocked) return json({ ads: [] });

    const scope = profile.content_scope || "full";
    // Admin ignora o escopo (mesma regra da RLS)
    const { data: isAdminData } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (scope !== "full" && !isAdminData) {
      return json({ ads: [] });
    }

    // Busca anúncios ativos e válidos por janela
    const nowIso = new Date().toISOString();
    let query = admin
      .from("ads")
      .select(
        "id, title, description, image_url, link_url, ad_type, position, display_duration, view_count, click_count, start_date, end_date, target_pages",
      )
      .eq("is_active", true)
      .order("position", { ascending: true });

    const { data: rows, error: rowsErr } = await query;
    if (rowsErr) throw rowsErr;

    const now = new Date();
    const baseValid = (rows || []).filter((ad: any) => {
      if (ad.start_date && new Date(ad.start_date) > now) return false;
      if (ad.end_date && new Date(ad.end_date) < now) return false;
      if (targetPage && Array.isArray(ad.target_pages) && ad.target_pages.length > 0) {
        if (!ad.target_pages.includes("all") && !ad.target_pages.includes(targetPage)) return false;
      }
      return true;
    });

    let finalAds = baseValid;
    if (adType) {
      const matching = baseValid.filter((ad: any) => ad.ad_type === adType);
      finalAds = matching.length > 0 ? matching : baseValid;
    }

    // Remove campos internos antes de devolver
    const stripped = finalAds.map(({ start_date, end_date, target_pages, ...rest }: any) => rest);
    return json({ ads: stripped });
  } catch (e) {
    console.error("list-ads error", e);
    return json({ ads: [], error: "Falha ao carregar anúncios" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
