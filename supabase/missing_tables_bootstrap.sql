-- Bootstrap generated from src/integrations/supabase/types.ts.
-- These tables were referenced by the migration history but had no CREATE TABLE statement.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public."activity_logs" (
  "action" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ip_address" text,
  "material_id" uuid,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."activity_logs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."categories" (
  "created_at" timestamptz NOT NULL,
  "icon" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "sort_order" integer NOT NULL
);
ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."downloads" (
  "downloaded_at" timestamptz NOT NULL,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "material_id" uuid NOT NULL,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."downloads" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."forum_posts" (
  "content" text NOT NULL,
  "created_at" timestamptz,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_public" boolean,
  "subject_id" uuid,
  "title" text NOT NULL,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."forum_posts" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."materials" (
  "category_id" uuid,
  "created_at" timestamptz NOT NULL,
  "created_by" text,
  "description" text,
  "file_path" text,
  "file_url" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "type" text NOT NULL
);
ALTER TABLE public."materials" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."security_alerts" (
  "alert_type" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "description" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "resolved" boolean NOT NULL,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."security_alerts" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."student_notes" (
  "apostila_id" uuid,
  "chapter_id" uuid,
  "content" text NOT NULL,
  "context_text" text,
  "created_at" timestamptz,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "position_data" jsonb,
  "updated_at" timestamptz,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."student_notes" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."study_goals" (
  "created_at" timestamptz,
  "current_value" integer,
  "end_date" date,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "metadata" jsonb,
  "metric" text NOT NULL,
  "start_date" date,
  "status" text,
  "target_value" integer NOT NULL,
  "type" text NOT NULL,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."study_goals" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."study_history" (
  "chapters_completed" integer,
  "created_at" timestamptz,
  "date" date NOT NULL,
  "exercises_completed" integer,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "time_spent_minutes" integer,
  "user_id" uuid NOT NULL,
  "xp_gained" integer
);
ALTER TABLE public."study_history" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."study_milestones" (
  "achieved_at" timestamptz,
  "category" text NOT NULL,
  "created_at" timestamptz,
  "description" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "requirement_type" text NOT NULL,
  "requirement_value" integer NOT NULL,
  "reward_data" jsonb,
  "reward_type" text,
  "title" text NOT NULL,
  "user_id" uuid NOT NULL
);
ALTER TABLE public."study_milestones" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."system_telemetry" (
  "created_at" timestamptz,
  "event_type" text NOT NULL,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payload" jsonb,
  "user_id" uuid
);
ALTER TABLE public."system_telemetry" ENABLE ROW LEVEL SECURITY;
