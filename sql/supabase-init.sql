create table if not exists public.agencyreport_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agencyreport_store enable row level security;

-- The app connects with the database connection string, not the public anon key.
-- Keep this table private; do not add public RLS policies for browser access.
