-- Consolidates only truly redundant permissive policies. No access rule is broadened by this migration.
drop policy if exists "Admins manage ads" on public.ads;
drop policy if exists "Authenticated users can view comments v2" on public.apostila_comments;
drop policy if exists "Users can create their own shares" on public.apostila_shares;
drop policy if exists "Users can insert own apostila views" on public.apostila_views;
drop policy if exists "Admins can manage settings" on public.app_settings;
drop policy if exists "app_settings admin read all" on public.app_settings;
drop policy if exists "Only admins read app settings" on public.app_settings;
drop policy if exists "Admins manage fixed apostilas" on public.fixed_apostilas;
drop policy if exists "Users can view own badges" on public.user_badges;
drop policy if exists "Admins can read quiz_questions" on public.quiz_questions;
drop policy if exists "Only admins can read maintenance logs" on public.maintenance_logs;
drop policy if exists "Users can view their own streaks" on public.user_streaks;
drop policy if exists "Users can only read their own answers" on public.weekly_simulado_answers;
drop policy if exists "Users view own simulado answers" on public.weekly_simulado_answers;
drop policy if exists "Admins can view all testimonials" on public.testimonials;
