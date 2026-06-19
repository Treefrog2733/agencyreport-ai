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

create index if not exists agencyreport_reports_owner_month_idx
  on public.agencyreport_records (owner_id, ((payload->>'month')))
  where collection = 'reports';

create unique index if not exists agencyreport_auth_users_email_uidx
  on public.agencyreport_records (lower(payload->>'email'))
  where collection = 'auth_users';

create unique index if not exists agencyreport_auth_sessions_hash_uidx
  on public.agencyreport_records ((payload->>'tokenHash'))
  where collection = 'auth_sessions';

create unique index if not exists agencyreport_billing_token_uidx
  on public.agencyreport_records ((payload->>'token'))
  where collection = 'billing_intents';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'agencyreport_records_owner_matches_payload') then
    alter table public.agencyreport_records add constraint agencyreport_records_owner_matches_payload
      check (owner_id is not distinct from nullif(payload->>'ownerId', ''));
  end if;
end $$;

create table if not exists public.agencyreport_metadata (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.agencyreport_records enable row level security;
alter table public.agencyreport_metadata enable row level security;

-- The app connects with the database connection string, not the public anon key.
-- Keep this table private; do not add public RLS policies for browser access.
