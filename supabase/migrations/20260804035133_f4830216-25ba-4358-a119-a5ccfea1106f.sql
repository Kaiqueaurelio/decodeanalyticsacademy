-- Migration to mark 6th semester onwards as completed and seed teachers
-- This ensures the UI displays covers for future semesters as requested.

-- 1. Function to mark semesters 6+ as completed for a specific user
CREATE OR REPLACE FUNCTION public.complete_semesters_six_to_eight(_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- We mark them in the completion table
  INSERT INTO public.apostila_completions (user_id, apostila_id)
  SELECT _user_id, id
  FROM public.apostilas
  WHERE semester >= 6 AND published = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.complete_semesters_six_to_eight(UUID) TO authenticated;

-- 2. Update existing placeholder/admin defined apostilas for future semesters with teacher names
UPDATE public.apostilas SET teacher = 'Prof. Dr. Ricardo Silva' WHERE category ILIKE '%Sistemas Distribuidos%';
UPDATE public.apostilas SET teacher = 'Prof. Anderson Lima' WHERE category ILIKE '%Dispositivos Moveis%';
UPDATE public.apostilas SET teacher = 'Profa. Mariana Costa' WHERE category ILIKE '%Mineracao de Dados%';
UPDATE public.apostilas SET teacher = 'Prof. Carlos Oliveira' WHERE category ILIKE '%Seguranca da Informacao%';
UPDATE public.apostilas SET teacher = 'Prof. Roberto Santos' WHERE category ILIKE '%Cloud Computing%';
UPDATE public.apostilas SET teacher = 'Prof. Fabiano Gomes' WHERE category ILIKE '%Machine Learning%';
UPDATE public.apostilas SET teacher = 'Coordenacao CC' WHERE category ILIKE '%TCC%' OR category ILIKE '%APS%';
