
DROP POLICY IF EXISTS "app_settings readable by all" ON public.app_settings;

CREATE POLICY "app_settings public read share url"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (key = 'share_app_url');

CREATE POLICY "app_settings admin read all"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

UPDATE public.app_settings
  SET value = to_jsonb('https://decodeanalyticsacademy.lovable.app/'::text)
  WHERE key = 'share_app_url';
