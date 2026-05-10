-- Sistema de anúncios in-app
CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link_url text NOT NULL,
  ad_type text NOT NULL DEFAULT 'banner',
  position integer NOT NULL DEFAULT 0,
  display_duration integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  target_pages text[] NOT NULL DEFAULT ARRAY['all']::text[],
  view_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_ad_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ad_type NOT IN ('banner','popup','sidebar','inline','footer') THEN
    RAISE EXCEPTION 'invalid ad_type: %', NEW.ad_type;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_ad_type_trg ON public.ads;
CREATE TRIGGER validate_ad_type_trg BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.validate_ad_type();

DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active ads" ON public.ads FOR SELECT TO authenticated
  USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage ads" ON public.ads FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert ad views" ON public.ad_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins view ad_views" ON public.ad_views FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert ad clicks" ON public.ad_clicks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins view ad_clicks" ON public.ad_clicks FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_ads_active_type ON public.ads(is_active, ad_type, position);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad ON public.ad_views(ad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad ON public.ad_clicks(ad_id, created_at DESC);