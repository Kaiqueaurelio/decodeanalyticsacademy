ALTER TABLE public.security_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'security_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.security_notifications;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.count_open_security_notifications() FROM anon;