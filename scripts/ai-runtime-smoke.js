#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const appPort = Number(process.env.AI_RUNTIME_SMOKE_PORT || 4395);
const providerPort = Number(process.env.AI_RUNTIME_PROVIDER_PORT || 4396);
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-ai-runtime-"));
let providerMode = "quota";

const provider = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    res.setHeader("content-type", "application/json");
    if (providerMode === "quota") {
      res.statusCode = 429;
      res.end(JSON.stringify({ error: { code: "insufficient_quota", message: "Quota exhausted for test" } }));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "Live provider recovered.",
            risks: ["Watch conversion quality."],
            nextActions: ["Shift budget toward the strongest channel."],
            clientReplyDraft: "The live AI analysis is available again.",
            confidence: 0.9,
          }),
        },
      }],
    }));
  });
});

fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));

const app = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  stdio: ["ignore", "ignore", "pipe"],
  env: {
    ...process.env,
    PORT: String(appPort),
    DATABASE_URL: "",
    OPENAI_API_KEY: "runtime-smoke-key",
    AI_PROVIDER: "openai",
    AI_BASE_URL: `http://127.0.0.1:${providerPort}/v1`,
    RESEND_API_KEY: "",
    EMAIL_PROVIDER: "mock",
    WORKER_SECRET: "ai-runtime-smoke-worker-secret",
    NODE_ENV: "test",
  },
});

let appError = "";
app.stderr.on("data", (chunk) => { appError = `${appError}${chunk}`.slice(-2000); });

async function waitFor(url) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`service did not start: ${url}${appError ? ` (${appError.trim()})` : ""}`);
}

async function request(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${appPort}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${body.message || body.error || response.status}`);
  return body.item ?? body.items ?? body;
}

function check(value, name) {
  console.log(`${value ? "OK" : "FAIL"} ${name}`);
  if (!value) process.exitCode = 1;
}

async function runReport(token) {
  return request("/api/report/run", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({
      clientName: "Runtime Status Client",
      reportMonth: "2026-06",
      clientBrief: "Validate provider degradation and recovery.",
      metrics: { spend: 1000, revenue: 4000, roas: 4, conversions: 10 },
      channels: [{ name: "Search", spend: 1000, revenue: 4000, roas: 4 }],
    }),
  });
}

async function run() {
  await new Promise((resolve, reject) => provider.listen(providerPort, "127.0.0.1", (error) => error ? reject(error) : resolve()));
  await waitFor(`http://127.0.0.1:${appPort}/api/health`);

  const suffix = Date.now();
  const email = `ai-runtime-${suffix}@example.test`;
  const password = "RuntimeSmokePassword123!";
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Runtime Smoke", email, password, legalAccepted: true, legalVersion: "legal-2026-06-18" }),
  });
  await request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registered.verificationToken }) });
  const login = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

  const fallback = await runReport(login.token);
  const degradedReadiness = await request("/api/readiness");
  const degradedHealth = await request("/api/health");
  const degradedAi = degradedReadiness.checks.find((item) => item.id === "ai");
  check(fallback.mode === "fallback", "quota failure uses rules fallback");
  check(degradedAi?.ok === false, "readiness marks AI degraded");
  check(degradedHealth.ai?.mode === "degraded", "health exposes degraded mode");
  check(degradedHealth.ai?.lastErrorCode === "quota_exceeded", "health exposes sanitized quota code");

  providerMode = "success";
  const live = await runReport(login.token);
  const recoveredReadiness = await request("/api/readiness");
  const recoveredHealth = await request("/api/health");
  const recoveredAi = recoveredReadiness.checks.find((item) => item.id === "ai");
  check(live.mode === "live", "provider recovery returns live AI output");
  check(recoveredAi?.ok === true, "readiness recovers after live success");
  check(recoveredHealth.ai?.mode === "live-ready", "health recovers to live-ready");
  check(recoveredHealth.ai?.runtimeStatus === "operational", "health records operational runtime status");
  check(recoveredHealth.ai?.lastErrorCode === null, "recovery clears public error code");
}

run()
  .catch((error) => {
    console.error(`AI runtime smoke failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app.exitCode == null) {
      app.kill();
      await new Promise((resolve) => app.once("exit", resolve));
    }
    await new Promise((resolve) => provider.close(resolve));
    fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
