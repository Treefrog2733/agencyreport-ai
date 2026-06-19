#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { backupSummary, unseal } = require("./lib/backup-format");

const root = path.resolve(__dirname, "..");
loadLocalEnv();

function loadLocalEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;
  readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const split = trimmed.indexOf("=");
    if (split < 1) return;
    const key = trimmed.slice(0, split).trim();
    let value = trimmed.slice(split + 1).trim();
    if (Object.prototype.hasOwnProperty.call(process.env, key)) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  });
}

function fileArgument() {
  const flagIndex = process.argv.indexOf("--file");
  const candidate = flagIndex >= 0 ? process.argv[flagIndex + 1] : process.argv[2];
  if (!candidate) throw new Error("Pass an encrypted backup file with --file <path>");
  return path.resolve(candidate);
}

async function insertJsonRecords(client, table, records, definition, columns) {
  if (!records.length) return;
  await client.query(
    `insert into ${table} (${columns.join(", ")}) select ${columns.join(", ")} from json_to_recordset($1::json) as item(${definition})`,
    [JSON.stringify(records)]
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const encryptionSecret = process.env.BACKUP_ENCRYPTION_KEY || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const file = fileArgument();
  const envelope = JSON.parse(await readFile(file, "utf8"));
  const backup = unseal(envelope, encryptionSecret);
  const { Pool } = require("pg");
  const localDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 15_000),
    query_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 60_000),
    statement_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 60_000),
    ssl: localDatabase || process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  let drill;
  try {
    await client.query("begin");
    await client.query(`
      create temporary table agencyreport_restore_records (
        collection text not null,
        record_id text not null,
        owner_id text,
        payload jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null,
        primary key (collection, record_id)
      ) on commit drop;
      create temporary table agencyreport_restore_metadata (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null
      ) on commit drop;
      create temporary table agencyreport_restore_legacy (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null
      ) on commit drop;
    `);
    await insertJsonRecords(
      client,
      "agencyreport_restore_records",
      backup.records,
      "collection text, record_id text, owner_id text, payload jsonb, created_at timestamptz, updated_at timestamptz",
      ["collection", "record_id", "owner_id", "payload", "created_at", "updated_at"]
    );
    await insertJsonRecords(
      client,
      "agencyreport_restore_metadata",
      backup.metadata,
      "key text, value jsonb, updated_at timestamptz",
      ["key", "value", "updated_at"]
    );
    await insertJsonRecords(
      client,
      "agencyreport_restore_legacy",
      backup.legacy,
      "key text, value jsonb, updated_at timestamptz",
      ["key", "value", "updated_at"]
    );
    const recordCount = await client.query("select count(*)::int as count from agencyreport_restore_records");
    const metadataCount = await client.query("select count(*)::int as count from agencyreport_restore_metadata");
    const legacyCount = await client.query("select count(*)::int as count from agencyreport_restore_legacy");
    const collections = await client.query("select collection, count(*)::int as count from agencyreport_restore_records group by collection order by collection");
    if (recordCount.rows[0].count !== backup.records.length
      || metadataCount.rows[0].count !== backup.metadata.length
      || legacyCount.rows[0].count !== backup.legacy.length) {
      throw new Error("Restore drill row counts do not match the backup payload");
    }
    drill = {
      ok: true,
      file,
      checksum: envelope.payloadSha256 || "legacy-envelope",
      ...backupSummary(backup),
      restoredCollections: Object.fromEntries(collections.rows.map((row) => [row.collection, row.count])),
      transaction: "rolled-back",
      productionDataChanged: false,
    };
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
    await pool.end().catch(() => {});
  }
  console.log(JSON.stringify(drill, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
