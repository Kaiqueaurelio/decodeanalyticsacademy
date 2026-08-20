-- Column-level protection for exercise answer fields
REVOKE SELECT ON public.exercises FROM authenticated;
REVOKE SELECT ON public.exercises FROM anon;

GRANT SELECT (id, apostila_id, question, options, created_at, type, min_chars, sort_order, question_type, allow_image_upload)
  ON public.exercises TO authenticated;

GRANT ALL ON public.exercises TO service_role;