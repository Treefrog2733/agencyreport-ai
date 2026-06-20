const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL || "";
const sslEnabled = process.env.DATABASE_SSL !== "false";

function loadLocalEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

async function main() {
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add your PostgreSQL connection string to .env or the hosting environment.");
    process.exitCode = 1;
    return;
  }

  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch {
    console.error("The pg package is missing. Run npm install before checking the database. On a hosting platform, dependencies will be installed from package.json. In this local Codex runtime, npm is not available, so use Supabase SQL Editor with sql/supabase-init.sql or install Node.js/npm locally.");
    process.exitCode = 1;
    return;
  }

  const isLocal = /localhost|127\.0\.0\.1/i.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: !isLocal && sslEnabled ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.query(`
      create table if not exists agencyreport_store (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists agencyreport_records (
        collection text not null,
        record_id text not null,
        owner_id text,
        payload jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        primary key (collection, record_id)
      );
      create index if not exists agencyreport_records_owner_idx
        on agencyreport_records (owner_id, collection);
      create index if not exists agencyreport_records_updated_idx
        on agencyreport_records (updated_at desc);
      create index if not exists agencyreport_reports_owner_month_idx
        on agencyreport_records (owner_id, ((payload->>'month')))
        where collection = 'reports';
      create unique index if not exists agencyreport_auth_users_email_uidx
        on agencyreport_records (lower(payload->>'email'))
        where collection = 'auth_users';
      create unique index if not exists agencyreport_auth_sessions_hash_uidx
        on agencyreport_records ((payload->>'tokenHash'))
        where collection = 'auth_sessions';
      create unique index if not exists agencyreport_billing_token_uidx
        on agencyreport_records ((payload->>'token'))
        where collection = 'billing_intents';
      create table if not exists agencyreport_metadata (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      )
      ;
      do $$ begin
        if not exists (select 1 from pg_constraint where conname = 'agencyreport_records_owner_matches_payload') then
          alter table agencyreport_records add constraint agencyreport_records_owner_matches_payload
            check (owner_id is not distinct from nullif(payload->>'ownerId', ''));
        end if;
      end $$
    `);
    const version = await pool.query("select version()");
    const store = await pool.query("select key, updated_at from agencyreport_store order by key");
    const records = await pool.query("select collection, count(*)::int as count from agencyreport_records group by collection order by collection");
    const schema = await pool.query("select value from agencyreport_metadata where key = 'schema_version'");
    const indexes = await pool.query(`select indexname from pg_indexes where schemaname = 'public' and tablename = 'agencyreport_records' order by indexname`);
    const constraints = await pool.query(`select conname, convalidated from pg_constraint where conrelid = 'agencyreport_records'::regclass order by conname`);
    const integrity = await pool.query(`
      select
        count(*) filter (where owner_id is distinct from nullif(payload->>'ownerId', ''))::int as owner_mismatches,
        count(*) filter (where not jsonb_typeof(payload) = 'object')::int as invalid_payloads
      from agencyreport_records
    `);
    const requiredConnectorIndexes = [
      "agencyreport_oauth_state_hash_uidx",
      "agencyreport_connector_owner_provider_uidx",
      "agencyreport_source_owner_external_uidx",
      "agencyreport_sync_jobs_owner_status_idx",
      "agencyreport_metrics_owner_source_date_idx",
    ];
    const indexNames = indexes.rows.map((row) => row.indexname);
    const schemaVersion = Number(schema.rows[0]?.value || 0);
    const integrityState = integrity.rows[0];
    const ok = schemaVersion >= 4
      && requiredConnectorIndexes.every((name) => indexNames.includes(name))
      && integrityState.owner_mismatches === 0
      && integrityState.invalid_payloads === 0;
    console.log(JSON.stringify({
      ok,
      ssl: !isLocal && sslEnabled,
      postgres: version.rows[0].version,
      normalized: true,
      schemaVersion: schema.rows[0]?.value || null,
      recordRows: records.rows.reduce((total, row) => total + row.count, 0),
      collections: records.rows,
      indexes: indexNames,
      missingConnectorIndexes: requiredConnectorIndexes.filter((name) => !indexNames.includes(name)),
      constraints: constraints.rows,
      integrity: integrityState,
      storeRows: store.rowCount,
      keys: store.rows.map((row) => ({ key: row.key, updatedAt: row.updated_at })),
    }, null, 2));
    if (!ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
