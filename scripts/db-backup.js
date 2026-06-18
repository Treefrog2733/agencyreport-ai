#!/usr/bin/env node

const { createHash, randomBytes, createCipheriv, createDecipheriv } = require("node:crypto");
const { gzipSync, gunzipSync } = require("node:zlib");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
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

function encryptionKey() {
  const secret = process.env.BACKUP_ENCRYPTION_KEY || "";
  if (secret.length < 24) throw new Error("BACKUP_ENCRYPTION_KEY must contain at least 24 characters");
  return createHash("sha256").update(secret).digest();
}

function seal(data) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(gzipSync(Buffer.from(JSON.stringify(data)))), cipher.final()]);
  return {
    format: "agencyreport-backup-v1",
    algorithm: "aes-256-gcm+gzip",
    createdAt: new Date().toISOString(),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function unseal(envelope) {
  if (envelope.format !== "agencyreport-backup-v1") throw new Error("Unsupported backup format");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const compressed = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
  return JSON.parse(gunzipSync(compressed).toString("utf8"));
}

async function verify(file) {
  const envelope = JSON.parse(await readFile(file, "utf8"));
  const backup = unseal(envelope);
  if (!Array.isArray(backup.records) || !Array.isArray(backup.metadata)) throw new Error("Backup payload is incomplete");
  console.log(JSON.stringify({
    ok: true,
    file: path.resolve(file),
    createdAt: envelope.createdAt,
    records: backup.records.length,
    metadata: backup.metadata.length,
  }, null, 2));
}

async function createBackup() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
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
    await writeFile(output, JSON.stringify(seal(payload)), { encoding: "utf8", mode: 0o600 });
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
