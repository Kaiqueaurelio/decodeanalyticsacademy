import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccessToken } from "@/lib/auth-session";

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface StreamHandlers {
  /** Chamado a cada pedaço de texto gerado. */
  onDelta?: (text: string) => void;
  /** Chamado quando uma ferramenta interna é acionada. */
  onTool?: (name: string) => void;
  /** Chamado no fim, com as ações executadas. */
  onDone?: (actions: any[]) => void;
}

export interface StreamResult {
  error: string | null;
}

/**
 * Consome uma edge function que responde em SSE (`text/event-stream`),
 * entregando o texto token a token. Se o servidor responder JSON comum
 * (fallback), o campo `reply` é entregue de uma vez.
 */
export async function streamFunction(
  name: string,
  body: unknown,
  handlers: StreamHandlers = {},
  signal?: AbortSignal,
): Promise<StreamResult> {
  try {
    let accessToken = getCurrentAccessToken();
    if (!accessToken) {
      const { data } = await supabase.auth.getSession();
      accessToken = data.session?.access_token ?? null;
    }

    const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") ?? "";

    if (!res.ok || !contentType.includes("text/event-stream")) {
      const text = await res.text();
      let parsed: any = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { /* texto puro */ }

      if (!res.ok) {
        return { error: parsed?.error || text.slice(0, 200) || `HTTP ${res.status}` };
      }
      // Resposta JSON (modo não-streaming)
      if (parsed?.reply) handlers.onDelta?.(String(parsed.reply));
      handlers.onDone?.(parsed?.actions ?? []);
      return { error: null };
    }

    if (!res.body) return { error: "Resposta vazia do servidor." };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let doneCalled = false;
    let errorMsg: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        let evt: any;
        try { evt = JSON.parse(payload); } catch { continue; }

        if (evt.type === "delta" && typeof evt.text === "string") handlers.onDelta?.(evt.text);
        else if (evt.type === "tool" && evt.name) handlers.onTool?.(String(evt.name));
        else if (evt.type === "done") { doneCalled = true; handlers.onDone?.(evt.actions ?? []); }
        else if (evt.type === "error") errorMsg = String(evt.error ?? "Erro no assistente.");
      }
    }

    if (!doneCalled && !errorMsg) handlers.onDone?.([]);
    return { error: errorMsg };
  } catch (e: any) {
    if (e?.name === "AbortError") return { error: null };
    return { error: e?.message || "Erro de rede" };
  }
}
