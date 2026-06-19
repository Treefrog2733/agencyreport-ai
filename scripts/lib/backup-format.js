const { createHash, randomBytes, createCipheriv, createDecipheriv } = require("node:crypto");
const { gzipSync, gunzipSync } = require("node:zlib");

function deriveKey(secret) {
  if (String(secret || "").length < 24) throw new Error("BACKUP_ENCRYPTION_KEY must contain at least 24 characters");
  return createHash("sha256").update(secret).digest();
}

function payloadBytes(payload) {
  return Buffer.from(JSON.stringify(payload));
}

function payloadChecksum(payload) {
  return createHash("sha256").update(payloadBytes(payload)).digest("hex");
}

function validateBackupPayload(backup) {
  if (!backup || typeof backup !== "object") throw new Error("Backup payload must be an object");
  if (backup.schemaVersion !== 2) throw new Error(`Unsupported schema version: ${backup.schemaVersion}`);
  if (!Array.isArray(backup.records) || !Array.isArray(backup.metadata) || !Array.isArray(backup.legacy)) {
    throw new Error("Backup payload is incomplete");
  }
  const identities = new Set();
  backup.records.forEach((record, index) => {
    if (!record || typeof record !== "object" || !record.collection || !record.record_id || !record.payload || typeof record.payload !== "object") {
      throw new Error(`Invalid backup record at index ${index}`);
    }
    const identity = `${record.collection}\u0000${record.record_id}`;
    if (identities.has(identity)) throw new Error(`Duplicate backup record: ${record.collection}/${record.record_id}`);
    identities.add(identity);
  });
  backup.metadata.forEach((record, index) => {
    if (!record || typeof record !== "object" || !record.key) throw new Error(`Invalid metadata record at index ${index}`);
  });
  backup.legacy.forEach((record, index) => {
    if (!record || typeof record !== "object" || !record.key) throw new Error(`Invalid legacy record at index ${index}`);
  });
  return backup;
}

function seal(payload, secret) {
  validateBackupPayload(payload);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(gzipSync(payloadBytes(payload))), cipher.final()]);
  return {
    format: "agencyreport-backup-v1",
    algorithm: "aes-256-gcm+gzip",
    createdAt: new Date().toISOString(),
    payloadSha256: payloadChecksum(payload),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function unseal(envelope, secret) {
  if (envelope?.format !== "agencyreport-backup-v1" || envelope.algorithm !== "aes-256-gcm+gzip") {
    throw new Error("Unsupported backup format");
  }
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const compressed = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
  const backup = validateBackupPayload(JSON.parse(gunzipSync(compressed).toString("utf8")));
  if (envelope.payloadSha256 && payloadChecksum(backup) !== envelope.payloadSha256) {
    throw new Error("Backup payload checksum mismatch");
  }
  return backup;
}

function backupSummary(backup) {
  const collections = backup.records.reduce((result, record) => {
    result[record.collection] = (result[record.collection] || 0) + 1;
    return result;
  }, {});
  return {
    schemaVersion: backup.schemaVersion,
    exportedAt: backup.exportedAt,
    records: backup.records.length,
    metadata: backup.metadata.length,
    legacy: backup.legacy.length,
    collections,
  };
}

module.exports = {
  backupSummary,
  payloadChecksum,
  seal,
  unseal,
  validateBackupPayload,
};
