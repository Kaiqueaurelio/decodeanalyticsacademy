-- Migration: secure_exercises_rls
-- Description: Restricts RLS on exercises table to prevent direct SELECT of sensitive columns like correct_answer/explanation/reference_answer, and introduces a column-safe approach.

-- 1. Create a secure view or update RLS policy on exercises table
-- If correct_answer, explanation, reference_answer columns exist in exercises, let's create a secure table or restrict access via RLS.
-- Since Supabase RLS cannot restrict specific columns directly in standard table policies without views or separate tables,
-- we follow the recommendation: move sensitive columns or restrict the table.

DO $$ 
BEGIN
    -- Check if sensitive columns exist in exercises table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exercises' 
        AND column_name = 'correct_answer'
    ) THEN
        -- Create secure table for sensitive answers if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.exercise_answers (
            exercise_id UUID PRIMARY KEY REFERENCES public.exercises(id) ON DELETE CASCADE,
            correct_answer TEXT,
            explanation TEXT,
            reference_answer TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Enable RLS on exercise_answers
        ALTER TABLE public.exercise_answers ENABLE ROW LEVEL SECURITY;

        -- Strict RLS policy: No direct user access to exercise_answers (accessible only via SECURITY DEFINER functions)
        DROP POLICY IF EXISTS "No direct access to exercise answers" ON public.exercise_answers;
        CREATE POLICY "No direct access to exercise answers" ON public.exercise_answers
            FOR ALL USING (false);

        -- Migrate existing answers if columns are present in exercises
        INSERT INTO public.exercise_answers (exercise_id, correct_answer, explanation, reference_answer)
        SELECT id, correct_answer, explanation, reference_answer
        FROM public.exercises
        ON CONFLICT (exercise_id) DO NOTHING;

        -- Drop sensitive columns from exercises table so direct SELECT cannot expose them
        ALTER TABLE public.exercises DROP COLUMN IF EXISTS correct_answer;
        ALTER TABLE public.exercises DROP COLUMN IF EXISTS explanation;
        ALTER TABLE public.exercises DROP COLUMN IF EXISTS reference_answer;
    END IF;
END $$;

-- 2. Ensure secure RPC function to check exercise answer
CREATE OR REPLACE FUNCTION public.check_exercise_answer(
    p_exercise_id UUID,
    p_user_answer TEXT
)
RETURNS TABLE (
    is_correct BOOLEAN,
    correct_answer TEXT,
    explanation TEXT,
    reference_answer TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_correct_answer TEXT;
    v_explanation TEXT;
    v_reference_answer TEXT;
    v_is_correct BOOLEAN := false;
BEGIN
    -- Fetch sensitive answers securely from exercise_answers table
    SELECT ea.correct_answer, ea.explanation, ea.reference_answer
    INTO v_correct_answer, v_explanation, v_reference_answer
    FROM public.exercise_answers ea
    WHERE ea.exercise_id = p_exercise_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exercício não encontrado ou sem gabarito cadastrado.';
    END IF;

    -- Compare answer (case-insensitive trim or exact match depending on format)
    IF trim(lower(p_user_answer)) = trim(lower(v_correct_answer)) THEN
        v_is_correct := true;
    END IF;

    RETURN QUERY 
    SELECT v_is_correct, v_correct_answer, v_explanation, v_reference_answer;
END $$;

GRANT EXECUTE ON FUNCTION public.check_exercise_answer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_exercise_answer(UUID, TEXT) TO anon;
