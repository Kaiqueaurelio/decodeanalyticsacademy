CREATE TABLE public.sponsor_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  site text,
  plan text,
  goal text,
  period text,
  budget text,
  notes text,
  channel text NOT NULL DEFAULT 'form',
  source text NOT NULL DEFAULT 'anuncie',
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.sponsor_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_leads TO authenticated;
GRANT ALL ON public.sponsor_leads TO service_role;

ALTER TABLE public.sponsor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a sponsor lead"
  ON public.sponsor_leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage sponsor leads"
  ON public.sponsor_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update sponsor leads"
  ON public.sponsor_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete sponsor leads"
  ON public.sponsor_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_sponsor_leads_updated_at
  BEFORE UPDATE ON public.sponsor_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sponsor_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.sponsor_leads(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'nota',
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_lead_events TO authenticated;
GRANT ALL ON public.sponsor_lead_events TO service_role;

ALTER TABLE public.sponsor_lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sponsor lead events"
  ON public.sponsor_lead_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_sponsor_leads_created_at ON public.sponsor_leads (created_at DESC);
CREATE INDEX idx_sponsor_lead_events_lead ON public.sponsor_lead_events (lead_id, created_at DESC);