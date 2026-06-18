create table if not exists public.agencyreport_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agencyreport_store enable row level security;

create table if not exists public.agencyreport_records (
  collection text not null,
  record_id text not null,
  owner_id text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, record_id)
);

create index if not exists agencyreport_records_owner_idx
  on public.agencyreport_records (owner_id, collection);

create index if not exists agencyreport_records_updated_idx
  on public.agencyreport_records (updated_at desc);

create table if not exists public.agencyreport_metadata (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agencyreport_records enable row level security;
alter table public.agencyreport_metadata enable row level security;

-- The app connects with the database connection string, not the public anon key.
-- Keep this table private; do not add public RLS policies for browser access.
