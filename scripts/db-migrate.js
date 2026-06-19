#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

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

function recordsFromLegacy(value) {
  return Object.entries(value || {}).flatMap(([collection, items]) => Array.isArray(items)
    ? items.filter((item) => item && item.id).map((item) => ({
      collection,
      record_id: String(item.id),
      owner_id: item.ownerId ? String(item.ownerId) : null,
      payload: item,
    }))
    : []);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const apply = process.argv.includes("--apply");
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: /localhost|127\.0\.0\.1/i.test(databaseUrl) || process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    const legacy = await client.query("select value from agencyreport_store where key = 'main'");
    const existing = await client.query("select count(*)::int as count from agencyreport_records");
    const records = recordsFromLegacy(legacy.rows[0]?.value || {});
    const summary = records.reduce((result, item) => {
      result[item.collection] = (result[item.collection] || 0) + 1;
      return result;
    }, {});
    if (!apply) {
      console.log(JSON.stringify({ ok: true, mode: "dry-run", existingRows: existing.rows[0].count, migrationRows: records.length, collections: summary }, null, 2));
      return;
    }
    if (existing.rows[0].count > 0) throw new Error("Normalized table is not empty; migration stopped to prevent overwriting data");
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('agencyreport-schema-migration'))");
    if (records.length) {
      await client.query(
        `insert into agencyreport_records (collection, record_id, owner_id, payload, created_at, updated_at)
         select item.collection, item.record_id, item.owner_id, item.payload, now(), now()
         from jsonb_to_recordset($1::jsonb)
           as item(collection text, record_id text, owner_id text, payload jsonb)`,
        [JSON.stringify(records)]
      );
    }
    await client.query(
      `insert into agencyreport_metadata (key, value, updated_at)
       values ('schema_version', '3'::jsonb, now()),
              ('legacy_migrated_at', to_jsonb(now()), now()),
              ('normalized_updated_at', to_jsonb(now()), now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`
    );
    await client.query("commit");
    console.log(JSON.stringify({ ok: true, mode: "applied", migratedRows: records.length, collections: summary, legacyPreserved: true }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
