-- Ensure all apostilas have subject field (using category as fallback if subject column doesn't exist yet, but wait, the user's SQL says ADD COLUMN IF NOT EXISTS subject)
-- Wait, in Supabase types I saw 'category' and 'teacher', but not 'subject'. 
-- Actually, the user's SQL migration script should be applied first.

-- 1. Create content integrity tracking table
CREATE TABLE IF NOT EXISTS public.workbook_content_integrity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id UUID NOT NULL REFERENCES public.apostilas(id) ON DELETE CASCADE,
  content_hash VARCHAR(255),
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_complete BOOLEAN DEFAULT false,
  missing_chapters INTEGER DEFAULT 0,
  missing_exercises INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'unknown'
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workbook_content_integrity TO authenticated;
GRANT ALL ON public.workbook_content_integrity TO service_role;

-- 2. Create backup tracking table
CREATE TABLE IF NOT EXISTS public.content_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name VARCHAR(255),
  backup_timestamp TIMESTAMP WITH TIME ZONE,
  workbook_count INTEGER,
  content_block_count INTEGER,
  exercise_count INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_backups TO authenticated;
GRANT ALL ON public.content_backups TO service_role;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_integrity_workbook ON public.workbook_content_integrity(workbook_id);
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON public.content_backups(backup_timestamp DESC);

-- 4. Note: I will NOT alter 'apostilas' table directly via RPC if possible, 
-- but I need 'subject' for the restoration logic. 
-- I'll check if it already exists or if I should use 'category'.
-- Based on the user's prompt, they WANT a 'subject' column.

ALTER TABLE public.apostilas
ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'General';

GRANT SELECT, UPDATE ON public.apostilas TO authenticated;
