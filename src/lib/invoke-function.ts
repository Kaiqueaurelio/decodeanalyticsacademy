import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccessToken } from "@/lib/auth-session";
import { toast } from "sonner";

export interface InvokeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Toast title shown on error. Defaults to "Falha na função". */
  errorTitle?: string;
  /** When false, suppresses the toast (caller handles UI). Default true. */
  showToast?: boolean;
}

export interface InvokeResult<T> {
  data: T | null;
  error: InvokeError | null;
}

export interface InvokeError {
  endpoint: string;
  status: number | null;
  requestId: string | null;
  message: string;
  bodyText: string | null;
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**
 * Wrapper around supabase.functions.invoke that surfaces HTTP status,
 * endpoint and request id on failures. Keeps the same return shape
 * { data, error } so existing call sites can be migrated incrementally.
 */
export async function invokeFunction<T = unknown>(
  name: string,
  options: InvokeOptions = {},
): Promise<InvokeResult<T>> {
  const endpoint = `${FUNCTIONS_BASE}/${name}`;
  const { body, headers, errorTitle = "Falha na função", showToast = true } = options;

  try {
    // Reaproveita o token mantido pelo AuthProvider — evita várias chamadas
    // paralelas a getSession() que disputam o LockManager interno do gotrue-js.
    let accessToken = getCurrentAccessToken();
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token ?? null;
    }

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...headers,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const requestId =
      res.headers.get("sb-request-id") ||
      res.headers.get("x-request-id") ||
      res.headers.get("cf-ray");

    const text = await res.text();
    let parsed: any = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      const serverMsg =
        (parsed && (parsed.error || parsed.message)) ||
        text?.slice(0, 200) ||
        res.statusText;

      const err: InvokeError = {
        endpoint: `/functions/v1/${name}`,
        status: res.status,
        requestId,
        message: serverMsg,
        bodyText: text || null,
      };

      if (showToast) {
        toast.error(errorTitle, {
          description: formatErrorDescription(err),
          duration: 9000,
        });
      }
      // eslint-disable-next-line no-console
      console.error(`[invokeFunction] ${name} failed`, err);
      return { data: null, error: err };
    }

    return { data: (parsed ?? (text as unknown)) as T, error: null };
  } catch (e: any) {
    const err: InvokeError = {
      endpoint: `/functions/v1/${name}`,
      status: null,
      requestId: null,
      message: e?.message || "Erro de rede",
      bodyText: null,
    };
    if (showToast) {
      toast.error(errorTitle, {
        description: formatErrorDescription(err),
        duration: 9000,
      });
    }
    // eslint-disable-next-line no-console
    console.error(`[invokeFunction] ${name} network error`, e);
    return { data: null, error: err };
  }
}

export function formatErrorDescription(err: InvokeError): string {
  const parts = [
    err.status ? `HTTP ${err.status}` : "Sem resposta",
    err.endpoint,
    err.requestId ? `req: ${err.requestId.slice(0, 12)}` : null,
    err.message ? `— ${err.message}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
