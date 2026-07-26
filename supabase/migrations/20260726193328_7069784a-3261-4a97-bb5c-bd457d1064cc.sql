ALTER TABLE public.sponsor_leads
  ADD COLUMN IF NOT EXISTS cta_id text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text;

CREATE TABLE IF NOT EXISTS public.sponsor_funnel_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension text NOT NULL DEFAULT 'plan',
  key text NOT NULL,
  stage text NOT NULL DEFAULT 'negociacao',
  min_rate integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dimension, key, stage)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_funnel_thresholds TO authenticated;
GRANT ALL ON public.sponsor_funnel_thresholds TO service_role;

ALTER TABLE public.sponsor_funnel_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage funnel thresholds"
ON public.sponsor_funnel_thresholds
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsor_funnel_thresholds_updated_at
BEFORE UPDATE ON public.sponsor_funnel_thresholds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();