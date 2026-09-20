-- Prevent direct access to answer keys and explanations from the client table.
-- Students continue reading only question content and their submitted state.
revoke select on table public.weekly_simulado_answers from anon, authenticated;

grant select (
  id,
  simulado_id,
  user_id,
  question_index,
  exercise_id,
  apostila_id,
  subject,
  question,
  options,
  selected_answer,
  is_correct,
  answered_at,
  created_at
) on public.weekly_simulado_answers to authenticated;
