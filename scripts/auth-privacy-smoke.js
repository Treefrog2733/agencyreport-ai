#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.AUTH_PRIVACY_SMOKE_PORT || 4399);
const baseUrl = `http://127.0.0.1:${port}`;
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-auth-privacy-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));
const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  env: { ...process.env, PORT: String(port), NODE_ENV: "production", DATABASE_URL: "", EMAIL_PROVIDER: "mock", WORKER_SECRET: "auth-privacy-smoke-secret" },
});

async function waitForServer() {
  for (let index = 0; index < 80; index += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Auth privacy smoke server did not start");
}

async function post(pathname, body) {
  const response = await fetch(`${baseUrl}${pathname}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

async function run() {
  await waitForServer();
  const email = `privacy-${Date.now()}@example.test`;
  await post("/api/auth/register", { name: "Privacy Test", email, password: "PrivacySmoke123!", language: "zh", legalAccepted: true, legalVersion: "legal-2026-06-18" });
  const existingReset = await post("/api/auth/request-password-reset", { email, language: "zh" });
  const missingReset = await post("/api/auth/request-password-reset", { email: "missing@example.test", language: "zh" });
  const existingVerify = await post("/api/auth/resend-verification", { email, language: "en" });
  const missingVerify = await post("/api/auth/resend-verification", { email: "missing@example.test", language: "en" });
  const publicShape = (result) => JSON.stringify(result.body) === JSON.stringify({ item: { accepted: true } });
  assert(existingReset.status === 200 && missingReset.status === 200, "password reset requests use the same status");
  assert(publicShape(existingReset) && publicShape(missingReset), "password reset response does not reveal account existence");
  assert(existingVerify.status === 200 && missingVerify.status === 200, "verification resend requests use the same status");
  assert(publicShape(existingVerify) && publicShape(missingVerify), "verification resend response does not reveal account existence");
}

run().catch((error) => { console.error(`FAIL ${error.message}`); process.exitCode = 1; }).finally(() => child.kill());
