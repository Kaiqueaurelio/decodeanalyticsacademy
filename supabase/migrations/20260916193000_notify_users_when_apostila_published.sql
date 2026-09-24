-- Notifica automaticamente os alunos quando uma apostila passa a estar publicada.
-- A notificação é criada no centro do sino; o Realtime existente entrega-a
-- imediatamente aos usuários conectados.

CREATE OR REPLACE FUNCTION public.notify_users_on_apostila_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_newly_published boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_newly_published := COALESCE(NEW.published, false);
  ELSIF TG_OP = 'UPDATE' THEN
    v_newly_published := NOT COALESCE(OLD.published, false)
      AND COALESCE(NEW.published, false);
  END IF;

  IF NOT v_newly_published OR NULLIF(trim(COALESCE(NEW.title, '')), '') IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT
    p.user_id,
    'Conteúdo novo postado na plataforma!',
    'A apostila "' || trim(NEW.title) || '" já está disponível para estudo.',
    'new_content',
    '/apostila/' || NEW.id::text
  FROM public.profiles p
  WHERE COALESCE(p.is_blocked, false) = false
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p.user_id
        AND ur.role = 'admin'::public.app_role
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_on_apostila_publish ON public.apostilas;

CREATE TRIGGER trg_notify_users_on_apostila_publish
AFTER INSERT OR UPDATE OF published ON public.apostilas
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_on_apostila_publish();

COMMENT ON FUNCTION public.notify_users_on_apostila_publish() IS
'Creates an in-app notification for non-admin active users when an apostila is newly published.';
