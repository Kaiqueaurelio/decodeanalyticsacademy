-- Calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT NOT NULL DEFAULT 'prova',
  subject TEXT,
  source_pdf_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view events"
ON public.calendar_events FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Admins can insert events"
ON public.calendar_events FOR INSERT
TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events"
ON public.calendar_events FOR UPDATE
TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events"
ON public.calendar_events FOR DELETE
TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_calendar_events_date ON public.calendar_events(event_date);

-- Storage bucket for cronograma PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('calendar-pdfs', 'calendar-pdfs', false);

CREATE POLICY "Admins can upload calendar PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'calendar-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read calendar PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'calendar-pdfs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete calendar PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'calendar-pdfs' AND has_role(auth.uid(), 'admin'::app_role));