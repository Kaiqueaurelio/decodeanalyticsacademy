// Testes de integração da edge function `list-ads`.
// Executa contra a função já deployada (via VITE_SUPABASE_URL do .env do projeto).
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/list-ads`;

function headers(extra: Record<string, string> = {}) {
  return { apikey: ANON_KEY, ...extra };
}

Deno.test("OPTIONS preflight responde 200 com CORS", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS", headers: headers() });
  await res.text();
  assertEquals(res.status, 200);
  assert(
    res.headers.get("access-control-allow-origin") !== null,
    "cabeçalho CORS ausente",
  );
});

Deno.test("Sem Authorization retorna { ads: [] } (usuário sem permissão)", async () => {
  const res = await fetch(FN_URL, { headers: headers() });
  const body = await res.json();
  assertEquals(res.status, 200);
  assert(Array.isArray(body.ads), "ads deve ser array");
  assertEquals(body.ads.length, 0);
});

Deno.test("JWT inválido é tratado como não autenticado e retorna []", async () => {
  const res = await fetch(FN_URL, {
    headers: headers({ Authorization: "Bearer invalido.jwt.token" }),
  });
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.ads.length, 0);
});

Deno.test("Parâmetros inválidos (ad_type/limit) são saneados sem erro", async () => {
  const res = await fetch(`${FN_URL}?ad_type=hackzone&limit=9999&offset=-5&order=drop`, {
    headers: headers(),
  });
  const body = await res.json();
  assertEquals(res.status, 200);
  assert(Array.isArray(body.ads));
});

Deno.test("Rede caindo (host inexistente) lança erro no cliente — front deve capturar", async () => {
  let threw = false;
  try {
    await fetch("https://host-que-nao-existe-abcxyz.invalid/functions/v1/list-ads");
  } catch {
    threw = true;
  }
  assert(threw, "fetch em host inválido deveria lançar");
});
