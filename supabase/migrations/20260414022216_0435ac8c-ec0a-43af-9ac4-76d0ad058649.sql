
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS login_attempts integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_at timestamptz DEFAULT NULL;
