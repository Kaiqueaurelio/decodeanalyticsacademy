import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const key = (body as { key?: string }).key ?? "";
    if (!key || key !== Deno.env.get("INTERNAL_SEED_KEY")) {
      return json({ error: "unauthorized" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];

    // 1) Novas capas v3: nome do arquivo = id da apostila
    const { data: files, error: listError } = await admin.storage
      .from("apostila-covers")
      .list("v3", { limit: 200 });
    if (listError) return json({ error: listError.message }, 500);

    for (const file of files ?? []) {
      if (!file.name.endsWith(".jpg")) continue;
      const id = file.name.replace(/\.jpg$/, "");
      const { data: signed, error: signError } = await admin.storage
        .from("apostila-covers")
        .createSignedUrl(`v3/${file.name}`, TEN_YEARS);
      if (signError || !signed?.signedUrl) {
        results.push({ id, ok: false, error: signError?.message });
        continue;
      }
      const { error: updateError } = await admin
        .from("apostilas")
        .update({ cover_url: signed.signedUrl })
        .eq("id", id);
      results.push({ id, ok: !updateError, error: updateError?.message });
    }

    // 2) Capas ENEM antigas em URL pública (bucket privado -> 400)
    const { data: enemRows } = await admin
      .from("apostilas")
      .select("id, cover_url")
      .like("cover_url", "%/object/public/apostila-covers/%");

    for (const row of enemRows ?? []) {
      const marker = "/object/public/apostila-covers/";
      const raw = String(row.cover_url).split(marker)[1] ?? "";
      const path = decodeURIComponent(raw.split("?")[0]);
      if (!path) continue;
      const { data: signed, error: signError } = await admin.storage
        .from("apostila-covers")
        .createSignedUrl(path, TEN_YEARS);
      if (signError || !signed?.signedUrl) {
        results.push({ id: row.id, ok: false, error: signError?.message });
        continue;
      }
      const { error: updateError } = await admin
        .from("apostilas")
        .update({ cover_url: signed.signedUrl })
        .eq("id", row.id);
      results.push({ id: row.id, ok: !updateError, error: updateError?.message });
    }

    return json({ updated: results.filter((r) => r.ok).length, results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unknown" }, 500);
  }
});
