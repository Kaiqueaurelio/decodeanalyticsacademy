CREATE TABLE public.security_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  severity text NOT NULL DEFAULT 'warn',
  user_id uuid,
  user_role text,
  content_scope text,
  tool_name text,
  reason text,
  request_id text,
  source text NOT NULL DEFAULT 'ella-chat',
  occurrences integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT security_notifications_kind_check CHECK (kind IN ('authz_denied','privilege_escalation','scope_violation')),
  CONSTRAINT security_notifications_severity_check CHECK (severity IN ('warn','critical'))
);

GRANT SELECT, UPDATE ON public.security_notifications TO authenticated;
GRANT ALL ON public.security_notifications TO service_role;

ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security notifications"
  ON public.security_notifications
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can acknowledge security notifications"
  ON public.security_notifications
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX security_notifications_created_at_idx
  ON public.security_notifications (created_at DESC);
CREATE INDEX security_notifications_open_idx
  ON public.security_notifications (acknowledged, severity, created_at DESC);
CREATE INDEX security_notifications_user_idx
  ON public.security_notifications (user_id, tool_name, created_at DESC);

CREATE TRIGGER update_security_notifications_updated_at
  BEFORE UPDATE ON public.security_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Impede que um administrador altere o conteúdo original do alerta:
-- pela aplicação só é permitido marcar como lido/tratado.
CREATE OR REPLACE FUNCTION public.protect_security_notification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.kind := OLD.kind;
  NEW.severity := OLD.severity;
  NEW.user_id := OLD.user_id;
  NEW.user_role := OLD.user_role;
  NEW.content_scope := OLD.content_scope;
  NEW.tool_name := OLD.tool_name;
  NEW.reason := OLD.reason;
  NEW.request_id := OLD.request_id;
  NEW.source := OLD.source;
  NEW.occurrences := OLD.occurrences;
  NEW.metadata := OLD.metadata;
  NEW.created_at := OLD.created_at;
  IF NEW.acknowledged AND NOT OLD.acknowledged THEN
    NEW.acknowledged_by := auth.uid();
    NEW.acknowledged_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_security_notifications
  BEFORE UPDATE ON public.security_notifications
  FOR EACH ROW EXECUTE FUNCTION public.protect_security_notification_fields();

-- Conta alertas em aberto (usado pelo badge do painel admin).
CREATE OR REPLACE FUNCTION public.count_open_security_notifications()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.has_role(auth.uid(), 'admin') THEN (
      SELECT jsonb_build_object(
        'total', COUNT(*)::int,
        'critical', COUNT(*) FILTER (WHERE severity = 'critical')::int
      )
      FROM public.security_notifications
      WHERE acknowledged = false
    )
    ELSE jsonb_build_object('total', 0, 'critical', 0)
  END;
$$;