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
      create table if not exists agencyreport_metadata (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    const version = await pool.query("select version()");
    const store = await pool.query("select key, updated_at from agencyreport_store order by key");
    const records = await pool.query("select collection, count(*)::int as count from agencyreport_records group by collection order by collection");
    const schema = await pool.query("select value from agencyreport_metadata where key = 'schema_version'");
    console.log(JSON.stringify({
      ok: true,
      ssl: !isLocal && sslEnabled,
      postgres: version.rows[0].version,
      normalized: true,
      schemaVersion: schema.rows[0]?.value || null,
      recordRows: records.rows.reduce((total, row) => total + row.count, 0),
      collections: records.rows,
      storeRows: store.rowCount,
      keys: store.rows.map((row) => ({ key: row.key, updatedAt: row.updated_at })),
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
