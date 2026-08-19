-- Advanced Gamification Migration: Streaks, Badges, and Leaderboard
create table if not exists public.user_streaks (
    user_id uuid primary key references auth.users(id) on delete cascade,
    current_streak integer default 0,
    longest_streak integer default 0,
    last_activity_date date default current_date,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.user_badges (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    badge_key text not null,
    badge_title text not null,
    badge_description text,
    icon text default '🏆',
    unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, badge_key)
);

-- Enable RLS
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;

create policy "Users can view their own streaks" on public.user_streaks for select using (auth.uid() = user_id);
create policy "Users can update their own streaks" on public.user_streaks for all using (auth.uid() = user_id);

create policy "Users can view their own badges" on public.user_badges for select using (auth.uid() = user_id);
create policy "System can insert badges" on public.user_badges for insert with check (true);

-- Leaderboard view or function
create or replace function public.get_leaderboard()
returns table (
    user_id uuid,
    full_name text,
    xp integer,
    current_streak integer
) 
language sql
security definer
as $$
    select 
        p.id as user_id,
        coalesce(p.full_name, 'Estudante Decode') as full_name,
        coalesce(p.xp, 0) as xp,
        coalesce(s.current_streak, 0) as current_streak
    from public.profiles p
    left join public.user_streaks s on s.user_id = p.id
    order by xp desc, current_streak desc
    limit 20;
$$;
