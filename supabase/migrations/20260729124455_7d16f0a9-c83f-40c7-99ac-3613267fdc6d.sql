-- ── Registros de uso (1 linha por mensagem enviada à assistente) ────────────
CREATE TABLE public.ella_usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ella_usage_user_time ON public.ella_usage_events (user_id, created_at DESC);

GRANT SELECT ON public.ella_usage_events TO authenticated;
GRANT ALL ON public.ella_usage_events TO service_role;

ALTER TABLE public.ella_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver os registros de uso"
ON public.ella_usage_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ── Bloqueios temporários ───────────────────────────────────────────────────
CREATE TABLE public.ella_user_blocks (
  user_id uuid NOT NULL PRIMARY KEY,
  blocked_until timestamptz,
  reason text,
  denial_count integer NOT NULL DEFAULT 0,
  denial_window_start timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ella_user_blocks TO authenticated;
GRANT ALL ON public.ella_user_blocks TO service_role;

ALTER TABLE public.ella_user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver os bloqueios"
ON public.ella_user_blocks FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuário vê o próprio bloqueio"
ON public.ella_user_blocks FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE TRIGGER update_ella_user_blocks_updated_at
BEFORE UPDATE ON public.ella_user_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Verificação de limite (chamada apenas pelo servidor) ────────────────────
CREATE OR REPLACE FUNCTION public.ella_rate_check(
  _user_id uuid,
  _window_limit integer DEFAULT 30,
  _window_seconds integer DEFAULT 300,
  _daily_limit integer DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _blocked_until timestamptz;
  _block_reason text;
  _window_count integer;
  _daily_count integer;
  _oldest timestamptz;
BEGIN
  SELECT blocked_until, reason INTO _blocked_until, _block_reason
  FROM public.ella_user_blocks WHERE user_id = _user_id;

  IF _blocked_until IS NOT NULL AND _blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'kind', 'blocked',
      'reason', COALESCE(_block_reason, 'Acesso temporariamente suspenso.'),
      'retry_after_seconds', CEIL(EXTRACT(EPOCH FROM (_blocked_until - now())))::int
    );
  END IF;

  SELECT COUNT(*), MIN(created_at) INTO _window_count, _oldest
  FROM public.ella_usage_events
  WHERE user_id = _user_id
    AND created_at > now() - make_interval(secs => _window_seconds);

  IF _window_count >= _window_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'kind', 'rate_window',
      'reason', 'Muitas mensagens em pouco tempo.',
      'retry_after_seconds', GREATEST(
        CEIL(EXTRACT(EPOCH FROM (_oldest + make_interval(secs => _window_seconds) - now())))::int, 1)
    );
  END IF;

  SELECT COUNT(*) INTO _daily_count
  FROM public.ella_usage_events
  WHERE user_id = _user_id AND created_at > now() - interval '24 hours';

  IF _daily_count >= _daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'kind', 'rate_daily',
      'reason', 'Limite diário de mensagens atingido.',
      'retry_after_seconds', 3600
    );
  END IF;

  INSERT INTO public.ella_usage_events (user_id) VALUES (_user_id);

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining_window', _window_limit - _window_count - 1,
    'remaining_day', _daily_limit - _daily_count - 1
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ella_rate_check(uuid, integer, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.ella_rate_check(uuid, integer, integer, integer) TO service_role;

-- ── Registro de ação negada + bloqueio automático ───────────────────────────
CREATE OR REPLACE FUNCTION public.ella_register_denial(
  _user_id uuid,
  _threshold integer DEFAULT 5,
  _window_seconds integer DEFAULT 900,
  _block_seconds integer DEFAULT 900
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
  _start timestamptz;
  _until timestamptz;
BEGIN
  INSERT INTO public.ella_user_blocks (user_id, denial_count, denial_window_start)
  VALUES (_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE
  SET denial_count = CASE
        WHEN public.ella_user_blocks.denial_window_start IS NULL
          OR public.ella_user_blocks.denial_window_start < now() - make_interval(secs => _window_seconds)
        THEN 1 ELSE public.ella_user_blocks.denial_count + 1 END,
      denial_window_start = CASE
        WHEN public.ella_user_blocks.denial_window_start IS NULL
          OR public.ella_user_blocks.denial_window_start < now() - make_interval(secs => _window_seconds)
        THEN now() ELSE public.ella_user_blocks.denial_window_start END
  RETURNING denial_count, denial_window_start INTO _count, _start;

  IF _count >= _threshold THEN
    _until := now() + make_interval(secs => _block_seconds);
    UPDATE public.ella_user_blocks
    SET blocked_until = _until,
        reason = 'Bloqueio temporário após várias ações não autorizadas.',
        denial_count = 0,
        denial_window_start = NULL
    WHERE user_id = _user_id;

    RETURN jsonb_build_object('blocked', true, 'blocked_until', _until, 'denials', _count);
  END IF;

  RETURN jsonb_build_object('blocked', false, 'denials', _count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ella_register_denial(uuid, integer, integer, integer) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.ella_register_denial(uuid, integer, integer, integer) TO service_role;