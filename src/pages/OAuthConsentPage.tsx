import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, XCircle } from "lucide-react";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  client?: { name?: string; redirect_uri?: string; client_uri?: string };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { redirect_url?: string; redirect_to?: string };
const oauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
    approveAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
    denyAuthorization: (id: string) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  };
}).oauth;

export default function OAuthConsentPage() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Requisição sem authorization_id.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("Servidor de autorização não retornou destino."); }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <XCircle className="h-8 w-8 text-destructive" />
          <h1 className="text-lg font-semibold">Não foi possível carregar a autorização</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "Aplicativo externo";

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Conectar {clientName}</h1>
            <p className="text-xs text-muted-foreground">Decode Analytics Academy</p>
          </div>
        </div>

        <p className="text-sm text-foreground">
          Isso permite que <strong>{clientName}</strong> use este app como você — chamando as ferramentas
          habilitadas enquanto sua sessão estiver ativa.
        </p>

        <ul className="text-sm space-y-1.5 text-muted-foreground list-disc list-inside">
          <li>Ler suas apostilas, avisos e calendário</li>
          <li>Consultar e criar seus flashcards</li>
          <li>Ver seu progresso e cursos gratuitos</li>
        </ul>

        <p className="text-xs text-muted-foreground">
          Isso não ignora as políticas de acesso do app. As permissões continuam controladas pelas regras do
          banco (RLS) do seu usuário.
        </p>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aprovar"}
          </Button>
        </div>
      </div>
    </main>
  );
}
