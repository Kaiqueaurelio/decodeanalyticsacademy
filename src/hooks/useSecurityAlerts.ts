import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type SecurityAlertKind = 'authz_denied' | 'privilege_escalation' | 'scope_violation';

export type SecurityAlert = {
  id: string;
  kind: SecurityAlertKind;
  severity: 'warn' | 'critical';
  user_id: string | null;
  user_role: string | null;
  content_scope: string | null;
  tool_name: string | null;
  reason: string | null;
  request_id: string | null;
  source: string | null;
  occurrences: number;
  metadata: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
};

export const ALERT_LABEL: Record<SecurityAlertKind, string> = {
  privilege_escalation: 'Escalada de privilégio',
  authz_denied: 'Autorização negada',
  scope_violation: 'Escopo de conteúdo',
};

export const ALERT_HINT: Record<SecurityAlertKind, string> = {
  privilege_escalation: 'Um usuário sem perfil de administrador tentou executar uma ação restrita.',
  authz_denied: 'Foi solicitada uma ação que não existe no catálogo autorizado do servidor.',
  scope_violation: 'Um usuário tentou acessar conteúdo fora do escopo liberado para a conta dele.',
};

/**
 * Alertas de segurança do administrador.
 * A leitura é protegida por regras no banco: contas de aluno não recebem nada,
 * mesmo que a consulta seja disparada. O tempo real avisa na hora de tentativas
 * críticas (escalada de privilégio ou repetição suspeita).
 */
export function useSecurityAlerts(options: { enabled?: boolean; notify?: boolean } = {}) {
  const { enabled = true, notify = false } = options;
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('security_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) {
      setError('Não foi possível carregar os alertas de segurança.');
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as unknown as SecurityAlert[];
    rows.forEach((r) => seen.current.add(r.id));
    setAlerts(rows);
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('security-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'security_notifications' },
        (payload) => {
          const row = payload.new as unknown as SecurityAlert | undefined;
          if (!row?.id) return;
          setAlerts((prev) => {
            const rest = prev.filter((a) => a.id !== row.id);
            return [row, ...rest].slice(0, 200);
          });
          const isNew = !seen.current.has(row.id);
          seen.current.add(row.id);
          if (!notify) return;
          if (row.acknowledged) return;
          if (!isNew && row.severity !== 'critical') return;
          const label = ALERT_LABEL[row.kind] ?? 'Alerta de segurança';
          const description = `${row.tool_name ?? 'ação'} · ${row.reason ?? 'ação bloqueada pelo servidor'}`;
          if (row.severity === 'critical') toast.error(label, { description });
          else toast.warning(label, { description });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, notify]);

  const acknowledge = useCallback(async (id: string, value = true) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: value } : a)));
    const { error: err } = await supabase
      .from('security_notifications')
      .update({ acknowledged: value })
      .eq('id', id);
    if (err) {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: !value } : a)));
      toast.error('Não foi possível atualizar o alerta.');
    }
  }, []);

  const acknowledgeAll = useCallback(async () => {
    const open = alerts.filter((a) => !a.acknowledged).map((a) => a.id);
    if (open.length === 0) return;
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    const { error: err } = await supabase
      .from('security_notifications')
      .update({ acknowledged: true })
      .in('id', open);
    if (err) {
      toast.error('Não foi possível marcar todos como tratados.');
      void load();
    }
  }, [alerts, load]);

  const openCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  return { alerts, loading, error, reload: load, acknowledge, acknowledgeAll, openCount, criticalCount };
}
