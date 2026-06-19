#!/usr/bin/env node

const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { backupSummary, seal, unseal } = require("./lib/backup-format");

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

function encryptionSecret() {
  const secret = process.env.BACKUP_ENCRYPTION_KEY || "";
  if (secret.length < 24) throw new Error("BACKUP_ENCRYPTION_KEY must contain at least 24 characters");
  return secret;
}

async function verify(file) {
  const envelope = JSON.parse(await readFile(file, "utf8"));
  const backup = unseal(envelope, encryptionSecret());
  console.log(JSON.stringify({
    ok: true,
    file: path.resolve(file),
    createdAt: envelope.createdAt,
    checksum: envelope.payloadSha256 || "legacy-envelope",
    ...backupSummary(backup),
  }, null, 2));
}

async function createBackup() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 15_000),
    query_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 60_000),
    statement_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS || 60_000),
    ssl: /localhost|127\.0\.0\.1/i.test(databaseUrl) || process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
  });
  try {
    const [records, metadata, legacy] = await Promise.all([
      pool.query("select collection, record_id, owner_id, payload, created_at, updated_at from agencyreport_records order by collection, record_id"),
      pool.query("select key, value, updated_at from agencyreport_metadata order by key"),
      pool.query("select key, value, updated_at from agencyreport_store order by key"),
    ]);
    const payload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      records: records.rows,
      metadata: metadata.rows,
      legacy: legacy.rows,
    };
    const outputDir = path.resolve(process.env.BACKUP_OUTPUT_DIR || path.join(root, "backups"));
    await mkdir(outputDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const output = path.join(outputDir, `agencyreport-${stamp}.backup.enc.json`);
    await writeFile(output, JSON.stringify(seal(payload, encryptionSecret())), { encoding: "utf8", mode: 0o600 });
    await verify(output);
  } finally {
    await pool.end().catch(() => {});
  }
}

const verifyIndex = process.argv.indexOf("--verify");
if (verifyIndex >= 0) {
  const file = process.argv[verifyIndex + 1];
  if (!file) throw new Error("Pass a backup file after --verify");
  verify(file).catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  });
} else {
  createBackup().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }));
    process.exitCode = 1;
  });
}
