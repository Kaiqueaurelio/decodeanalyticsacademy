CREATE TABLE public.mention_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID NOT NULL,
  author_id UUID NOT NULL,
  context_type TEXT NOT NULL,
  context_id UUID NOT NULL,
  snippet TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_mention_notif_recipient ON public.mention_notifications(recipient_id, read, created_at DESC);

ALTER TABLE public.mention_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view own mentions"
ON public.mention_notifications FOR SELECT
TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Authenticated can create mentions as author"
ON public.mention_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id AND author_id <> recipient_id);

CREATE POLICY "Recipients can update own mentions"
ON public.mention_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Recipients can delete own mentions"
ON public.mention_notifications FOR DELETE
TO authenticated
USING (auth.uid() = recipient_id);

ALTER TABLE public.mention_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mention_notifications;