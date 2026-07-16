#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
loadLocalEnv();

function loadLocalEnv() {
  const file = path.join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf("=");
    if (!trimmed || trimmed.startsWith("#") || separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

function argument(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function connectionOptions(databaseUrl) {
  return {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 15_000,
    query_timeout: 60_000,
    statement_timeout: 60_000,
    ssl: /localhost|127\.0\.0\.1/i.test(databaseUrl) || process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const destination = (argument("--url", process.env.SITES_MIGRATION_URL || "")).replace(/\/$/, "");
  const secret = process.env.SITES_MIGRATION_SECRET || "";
  const siteAuthorization = process.env.SITES_AUTHORIZATION_TOKEN || "";
  const limit = Number(argument("--limit", "0"));
  const dryRun = process.argv.includes("--dry-run");
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  if (!dryRun && (!/^https?:\/\//.test(destination) || !secret)) {
    throw new Error("Set SITES_MIGRATION_URL and SITES_MIGRATION_SECRET, or use --dry-run");
  }
  if (limit && (!Number.isInteger(limit) || limit < 1)) throw new Error("--limit must be a positive integer");

  const { Pool } = require("pg");
  const pool = new Pool(connectionOptions(databaseUrl));
  try {
    const count = await pool.query("select count(*)::int as count from agencyreport_records");
    const query = `select collection, record_id, owner_id, payload, created_at, updated_at
      from agencyreport_records order by collection, record_id${limit ? " limit $1" : ""}`;
    const result = await pool.query(query, limit ? [limit] : []);
    const records = result.rows.map((row) => ({
      collection: row.collection,
      recordId: row.record_id,
      ownerId: row.owner_id,
      payload: row.payload,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
    const summary = { sourceRecords: count.rows[0].count, selectedRecords: records.length, batches: Math.ceil(records.length / 100), dryRun };
    if (dryRun) {
      console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
      return;
    }

    const snapshot = crypto.randomUUID();
    let imported = 0;
    for (let offset = 0; offset < records.length; offset += 100) {
      const batch = records.slice(offset, offset + 100);
      const response = await fetch(`${destination}/api/migration/import`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
          ...(siteAuthorization ? { "OAI-Sites-Authorization": `Bearer ${siteAuthorization}` } : {}),
        },
        body: JSON.stringify({ batchId: `postgresql:${snapshot}:${offset / 100}`, source: "postgresql", records: batch }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(`Batch ${offset / 100} failed: ${body.error || response.status}`);
      imported += Number(body.imported || 0);
    }
    console.log(JSON.stringify({ ok: true, ...summary, imported }, null, 2));
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
