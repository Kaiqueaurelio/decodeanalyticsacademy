-- One-time server-side confirmation nonces for Ella high-impact actions.
create table if not exists public.ella_action_confirmations (
  nonce text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz not null default now()
);

create index if not exists ella_action_confirmations_user_idx
  on public.ella_action_confirmations(user_id, consumed_at desc);

create index if not exists ella_action_confirmations_expiry_idx
  on public.ella_action_confirmations(expires_at);

alter table public.ella_action_confirmations enable row level security;

revoke all on table public.ella_action_confirmations from anon, authenticated;

-- Cleanup is intentionally server-side only; the service role used by ella-chat
-- bypasses RLS and is the only actor expected to write this table.
