-- Hardening of public advertising surfaces.
-- Keeps public read access for ad media and active ad display, while making
-- management and analytics administrative-only.

DROP POLICY IF EXISTS "Authenticated users can upload to ads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own ads files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own ads files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload ads images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update ads images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete ads images" ON storage.objects;

CREATE POLICY "Admins can upload ads media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update ads media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete ads media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view ad views" ON public.ad_views;
DROP POLICY IF EXISTS "Anyone can view ad clicks" ON public.ad_clicks;
DROP POLICY IF EXISTS "Admins view ad_views" ON public.ad_views;
DROP POLICY IF EXISTS "Admins view ad_clicks" ON public.ad_clicks;

CREATE POLICY "Admins view ad views"
  ON public.ad_views
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view ad clicks"
  ON public.ad_clicks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.ad_views FROM anon, authenticated;
REVOKE SELECT ON public.ad_clicks FROM anon, authenticated;
GRANT SELECT ON public.ad_views TO authenticated;
GRANT SELECT ON public.ad_clicks TO authenticated;

COMMENT ON POLICY "Admins can upload ads media" ON storage.objects IS
  'Only authenticated administrators may upload ad media.';
COMMENT ON POLICY "Admins view ad views" ON public.ad_views IS
  'Ad impression analytics are administrative-only.';
COMMENT ON POLICY "Admins view ad clicks" ON public.ad_clicks IS
  'Ad click analytics are administrative-only.';
