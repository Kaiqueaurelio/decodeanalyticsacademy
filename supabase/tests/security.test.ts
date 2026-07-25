// Testes automatizados de segurança e regressão.
// Cobre: RLS em tabelas sensíveis, storage LIST/GET, rate-limit da ra-login
// e revogação de EXECUTE em funções SECURITY DEFINER internas.
//
// Como rodar:
//   deno test -A supabase/tests/security.test.ts
//
// As variáveis vêm do .env raiz via dotenv/load.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

assert(SUPABASE_URL && ANON_KEY, "Faltam VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY no .env");

const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── RLS: anônimo NÃO deve ler tabelas sensíveis ──────────────────────────────
const SENSITIVE_TABLES = ["profiles", "user_roles", "answers", "user_xp", "security_alerts"] as const;

for (const table of SENSITIVE_TABLES) {
  Deno.test(`RLS: anon não lê ${table}`, async () => {
    const { data, error } = await anon.from(table).select("*").limit(1);
    // Ou o Supabase retorna erro de permissão, ou retorna array vazio (RLS filtra tudo).
    // O que NUNCA pode acontecer é retornar linhas.
    if (error) {
      assert(
        /permission|denied|row-level|policy/i.test(error.message),
        `Erro inesperado em ${table}: ${error.message}`,
      );
    } else {
      assertEquals(data?.length ?? 0, 0, `anon leu linhas de ${table}`);
    }
  });
}

// ── Storage: buckets públicos não podem ser LISTADOS por anon ────────────────
const PUBLIC_BUCKETS_NO_LIST = ["ads", "announcements", "apostila-covers"] as const;

for (const bucket of PUBLIC_BUCKETS_NO_LIST) {
  Deno.test(`Storage LIST: anon não lista bucket "${bucket}"`, async () => {
    const { data, error } = await anon.storage.from(bucket).list("", { limit: 5 });
    // Aceita: erro de permissão OU lista vazia. Rejeita: lista com itens.
    if (!error) {
      assertEquals(data?.length ?? 0, 0, `anon listou ${data?.length} objetos em ${bucket}`);
    }
  });
}

// ── Storage: bucket "books" deve ser privado (GET direto falha) ──────────────
Deno.test("Storage GET: bucket books é privado", async () => {
  // Tenta um path arbitrário — resposta esperada é 400/404/403, nunca 200 com bytes.
  const url = `${SUPABASE_URL}/storage/v1/object/public/books/probe-does-not-exist.pdf`;
  const res = await fetch(url);
  await res.arrayBuffer();
  assert(res.status >= 400, `books está acessível publicamente (status ${res.status})`);
});

// ── RPC: get_email_for_ra não pode ser chamada por anon/authenticated ───────
Deno.test("RPC: get_email_for_ra é restrita a service_role", async () => {
  const { error } = await anon.rpc("get_email_for_ra", { _ra: "TEST0001" });
  assert(error, "get_email_for_ra respondeu para anon — deveria negar EXECUTE");
  assert(
    /permission|denied|not allowed|does not exist/i.test(error!.message),
    `Erro inesperado: ${error!.message}`,
  );
});

// ── Edge function ra-login: rate-limit por IP ────────────────────────────────
Deno.test("ra-login: rate-limit dispara após 5 tentativas/min", async () => {
  const endpoint = `${SUPABASE_URL}/functions/v1/ra-login`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
  };
  // Dispara 7 tentativas com credencial inválida.
  let sawRateLimit = false;
  for (let i = 0; i < 7; i++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ra: `PENTEST${i}`, password: "wrong-pass" }),
    });
    await res.text();
    if (res.status === 429) {
      sawRateLimit = true;
      break;
    }
  }
  assert(sawRateLimit, "ra-login não devolveu 429 após múltiplas tentativas inválidas");
});

// ── Edge function ra-login: valida entrada ───────────────────────────────────
Deno.test("ra-login: rejeita payload inválido com 400", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ra-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ ra: "", password: "" }),
  });
  await res.text();
  assert([400, 401, 422].includes(res.status), `esperado 400/401/422, veio ${res.status}`);
});
