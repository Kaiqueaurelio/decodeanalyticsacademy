
DROP POLICY IF EXISTS "System can insert alerts" ON public.security_alerts;
CREATE POLICY "Users can insert own alerts" ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
