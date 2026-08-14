/**
 * Cliente REST minimalista (PostgREST) usado nos testes de regressao de seguranca.
 * Usa apenas a chave publica (anon) — nunca a service role.
 */
const URL = process.env.VITE_SUPABASE_URL || "https://gynguskgysompgcajunc.supabase.co";
const ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5bmd1c2tneXNvbXBnY2FqdW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTIxODAsImV4cCI6MjA5MTE4ODE4MH0.LidDO7DzGz4MHV0-azsjSNRLVUvZicxfLpmt4WStCoM";

export interface RestResult {
  status: number;
  body: any;
  /** true quando a request foi negada (401/403/404) ou retornou zero linhas. */
  denied: boolean;
}

export async function restSelect(
  table: string,
  query = "select=*&limit=1",
  token?: string,
): Promise<RestResult> {
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      Accept: "application/json",
    },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const empty = Array.isArray(body) && body.length === 0;
  return { status: res.status, body, denied: !res.ok || empty };
}

export async function rpc(fn: string, args: Record<string, unknown>, token?: string): Promise<RestResult> {
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token || ANON}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, denied: !res.ok };
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.access_token ?? null;
}
