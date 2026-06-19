#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.CONNECTOR_SMOKE_PORT || 4402);
const baseUrl = `http://127.0.0.1:${port}`;
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-connector-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));
const child = spawn(process.execPath, ["server.js"], { cwd: testRoot, windowsHide: true, env: { ...process.env, PORT: String(port), NODE_ENV: "test", DATABASE_URL: "", WORKER_SECRET: "connector-smoke-secret" } });
const csv = "channel,spend,clicks,conversions,revenue\nSearch,100,50,5,500";

async function waitForServer() {
  for (let index = 0; index < 80; index += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Connector smoke server did not start");
}

async function call(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, item: body.item ?? body.items ?? body };
}

async function createTenant(name) {
  const email = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const password = "ConnectorSmoke123!";
  const registered = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, legalAccepted: true, legalVersion: "legal-2026-06-18" }) });
  await call("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registered.item.verificationToken }) });
  const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  return { user: login.item.user, headers: { authorization: `Bearer ${login.item.token}` } };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

async function run() {
  await waitForServer();
  const tenantA = await createTenant("connector-a");
  const tenantB = await createTenant("connector-b");
  const valid = await call("/api/data-sources/test", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "csv", csv }) });
  const invalid = await call("/api/data-sources/test", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "csv", csv: "name,value\nA,1" }) });
  const localUrl = await call("/api/data-sources/test", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "sheets", url: "http://127.0.0.1/private" }) });
  const foreignUrl = await call("/api/data-sources/test", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "google_sheets", url: "https://example.com/data.csv" }) });
  const malformedSheet = await call("/api/data-sources/test", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "google_sheets", url: "https://docs.google.com/not-a-sheet" }) });
  const source = await call("/api/data-sources", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ type: "manual_csv", csv, clientName: "Tenant A" }) });
  const foreignSync = await call("/api/data-sources/sync", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ sourceId: source.item.id, type: "manual_csv", csv }) });
  const ownSync = await call("/api/data-sources/sync", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ sourceId: source.item.id, type: "manual_csv", csv }) });
  const aSyncs = await call("/api/data-syncs", { headers: tenantA.headers });
  const bSyncs = await call("/api/data-syncs", { headers: tenantB.headers });

  assert(valid.response.ok && valid.item.rowCount === 1 && valid.item.provider === "manual_csv", "CSV aliases normalize and valid report data passes");
  assert(invalid.response.status === 400, "CSV without report columns is rejected");
  assert(localUrl.response.status === 400 && localUrl.body.code === "DATA_SOURCE_INVALID", "localhost URL is rejected before fetch");
  assert(foreignUrl.response.status === 400 && foreignUrl.body.code === "DATA_SOURCE_INVALID", "non-Google URL is rejected before fetch");
  assert(malformedSheet.response.status === 400, "malformed Google Sheets URL is rejected");
  assert(foreignSync.response.status === 404 && foreignSync.body.code === "DATA_SOURCE_NOT_FOUND", "tenant cannot sync another tenant's source");
  assert(ownSync.response.ok && ownSync.item.ownerId === tenantA.user.id, "data sync retains tenant ownership");
  assert(aSyncs.item.length === 1 && bSyncs.item.length === 0, "sync history is tenant-isolated");
}

run().catch((error) => { console.error(`FAIL ${error.message}`); process.exitCode = 1; }).finally(() => child.kill());
