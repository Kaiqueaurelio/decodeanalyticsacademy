-- Restore global/student content that existed in the legacy Lovable database
-- but was absent after the Supabase migration. Every insert is idempotent.

insert into public.quiz_questions
  (id, quiz_id, type, question, description, is_required, points, options,
   correct_answer, image_url, explanation, position, created_at, match_options)
values
  ('32772f03-b799-4c9a-a328-e2e8550b6ed6', 'd44d417d-00dd-4e4d-992d-df0cdb2eb992',
   'multiple-choice', 'Qual a principal diferença entre a Máquina de Mealy e a de Moore?',
   null, true, 10,
   '[{"id":"a","texto":"Mealy associa a saída às transições, Moore aos estados"},{"id":"b","texto":"Moore é mais rápida que Mealy"},{"id":"c","texto":"Mealy não possui estados"},{"id":"d","texto":"Não há diferença técnica"}]'::jsonb,
   '"a"'::jsonb, null, null, 0, '2026-08-14T12:57:20.543661-03:00', null),
  ('08e168d6-04bb-41fd-8a47-93fd16adfa60', 'd44d417d-00dd-4e4d-992d-df0cdb2eb992',
   'true-false', 'Uma Máquina de Turing pode simular qualquer algoritmo computável.',
   null, true, 10, '[]'::jsonb, 'true'::jsonb, null, null, 1,
   '2026-08-14T12:57:20.543661-03:00', null),
  ('a7ffa489-0a6b-4dcd-a869-8f0361514424', '92fe8493-d723-4fd5-b324-a17c16379ffa',
   'multiple-select', 'Quais dos seguintes são modelos de computação clássicos?',
   null, true, 15,
   '[{"id":"ms1","texto":"Máquina de Turing","correta":true},{"id":"ms2","texto":"Autômato Finito","correta":true},{"id":"ms3","texto":"Rede Neural Convolucional","correta":false},{"id":"ms4","texto":"Cálculo Lambda","correta":true}]'::jsonb,
   null, null, null, 2, '2026-08-14T13:05:12.859636-03:00', null),
  -- The legacy row had a malformed 37-character UUID. Use the same value
  -- without its duplicated trailing character; no other row references it.
  ('51532aa6-8be8-47a9-be8c-8f69e4b4ded1', '92fe8493-d723-4fd5-b324-a17c16379ffa',
   'ordering', 'Ordene as complexidades da melhor para a pior:', null, true, 15,
   '[{"id":"o1","texto":"O(1)","ordem_correta":1},{"id":"o2","texto":"O(log n)","ordem_correta":2},{"id":"o3","texto":"O(n)","ordem_correta":3},{"id":"o4","texto":"O(n^2)","ordem_correta":4}]'::jsonb,
   null, null, null, 3, '2026-08-14T13:05:12.859636-03:00', null),
  ('99869cd5-272a-48ec-8d08-c7fe556ef4fe', '92fe8493-d723-4fd5-b324-a17c16379ffa',
   'matching', 'Associe o modelo à sua característica:', null, true, 20,
   '[{"id":"m1","texto":"Máquina de Turing","match_id":"r1"},{"id":"m2","texto":"Autômato Finito","match_id":"r2"}]'::jsonb,
   null, null, null, 4, '2026-08-14T13:05:12.859636-03:00',
   '[{"id":"r1","texto":"Memória infinita (fita)"},{"id":"r2","texto":"Memória finita (estados)"}]'::jsonb)
on conflict (id) do nothing;

insert into public.rss_feeds (url, source, enabled, sort_order)
values
  ('https://www.adrenaline.com.br/feed/', 'Adrenaline', true, 90),
  ('https://www.oficinadanet.com.br/rss', 'Oficina da Net', true, 100),
  ('https://pulsodaia.com.br/feed/', 'Pulso da IA', true, 110),
  ('https://novidades.ia.br/feed/', 'Novidades IA', true, 120),
  ('https://radar-ia.com/feed/', 'Radar IA', true, 130),
  ('https://algoritmodiario.com/feed', 'Algoritmo Diário', true, 140),
  ('https://www.linuxdescomplicado.com.br/feed/', 'Linux Descomplicado', true, 150),
  ('https://www.vivaolinux.com.br/backend.php', 'Viva o Linux', true, 160),
  ('https://www.bosontreinamentos.com.br/feed/', 'Bóson Treinamentos (Linux e Software Livre)', true, 170)
on conflict (url) do update set
  source = excluded.source,
  enabled = excluded.enabled,
  sort_order = excluded.sort_order;

-- These three cards belonged to the legacy administrator. Map them to the
-- administrator with the same RA in the new project rather than retaining an
-- invalid legacy auth UUID.
with admin_profile as (
  select user_id from public.profiles where upper(ra) = 'G802144' limit 1
)
insert into public.flashcards
  (id, user_id, apostila_id, front, back, difficulty, next_review, created_at,
   ease_factor, interval_days, repetitions, last_reviewed)
select v.id, p.user_id, null, v.front, v.back, v.difficulty, v.next_review,
       v.created_at, v.ease_factor, v.interval_days, v.repetitions, v.last_reviewed
from admin_profile p
cross join (values
  ('90efd476-85b3-4af6-9312-ba76a8246570'::uuid,
   '[Teste SRS] Qual algoritmo usamos?',
   'SM-2 (SuperMemo 2), criado por Piotr Wozniak.', 1,
   '2026-04-20T00:18:18.458-03:00'::timestamptz,
   '2026-04-16T22:38:42.2302-03:00'::timestamptz, 2.36, 1, 1,
   '2026-04-19T00:18:18.458-03:00'::timestamptz),
  ('e99cbd49-bbd7-4636-8164-4df805f090de'::uuid,
   '[Teste SRS] Qualidade 0 (Errei) → próxima revisão?',
   'Em ~10 minutos (intervalo zerado).', 2,
   '2026-04-20T00:18:28.935-03:00'::timestamptz,
   '2026-04-16T22:38:42.2302-03:00'::timestamptz, 2.5, 1, 1,
   '2026-04-19T00:18:28.936-03:00'::timestamptz),
  ('2dc398bc-fbc7-4141-940b-b0b34938a169'::uuid,
   '[Teste SRS] O que significa SRS?',
   'Spaced Repetition System (Sistema de Repetição Espaçada).', 2,
   '2026-04-25T00:18:41.318-03:00'::timestamptz,
   '2026-04-16T22:38:42.2302-03:00'::timestamptz, 2.5, 6, 2,
   '2026-04-19T00:18:41.319-03:00'::timestamptz)
) as v(id, front, back, difficulty, next_review, created_at, ease_factor,
       interval_days, repetitions, last_reviewed)
on conflict (id) do nothing;
