#!/usr/bin/env node

const { backupSummary, seal, unseal, validateBackupPayload } = require("./lib/backup-format");

const secret = "backup-smoke-secret-at-least-24-characters";
const payload = {
  schemaVersion: 2,
  exportedAt: "2026-06-19T00:00:00.000Z",
  records: [
    {
      collection: "reports",
      record_id: "report-1",
      owner_id: "owner-1",
      payload: { id: "report-1", ownerId: "owner-1", month: "2026-06" },
      created_at: "2026-06-19T00:00:00.000Z",
      updated_at: "2026-06-19T00:00:00.000Z",
    },
  ],
  metadata: [{ key: "schema_version", value: 2, updated_at: "2026-06-19T00:00:00.000Z" }],
  legacy: [],
};

function rejects(callback) {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}

const envelope = seal(payload, secret);
const restored = unseal(envelope, secret);
const legacyEnvelope = { ...envelope };
delete legacyEnvelope.payloadSha256;
const tampered = { ...envelope, data: `${envelope.data.slice(0, -4)}AAAA` };
const duplicatePayload = { ...payload, records: [...payload.records, { ...payload.records[0] }] };
const summary = backupSummary(restored);
const checks = {
  roundTripPreservesPayload: JSON.stringify(restored) === JSON.stringify(payload),
  checksumIncluded: /^[a-f0-9]{64}$/.test(envelope.payloadSha256 || ""),
  legacyEnvelopeStillReadable: JSON.stringify(unseal(legacyEnvelope, secret)) === JSON.stringify(payload),
  summaryCountsCollections: summary.records === 1 && summary.collections.reports === 1,
  wrongKeyRejected: rejects(() => unseal(envelope, `${secret}-wrong`)),
  tamperingRejected: rejects(() => unseal(tampered, secret)),
  duplicateRecordsRejected: rejects(() => validateBackupPayload(duplicatePayload)),
  shortKeyRejected: rejects(() => seal(payload, "too-short")),
};

Object.entries(checks).forEach(([name, ok]) => console.log(`${ok ? "OK" : "FAIL"} ${name}`));
if (Object.values(checks).some((ok) => !ok)) process.exitCode = 1;
