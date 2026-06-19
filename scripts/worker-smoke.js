#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.WORKER_SMOKE_PORT || 4398);
const baseUrl = `http://127.0.0.1:${port}`;
const workerSecret = "worker-smoke-secret-at-least-24-chars";
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-worker-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));
const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "test",
    DATABASE_URL: "",
    OPENAI_API_KEY: "",
    AI_API_KEY: "",
    EMAIL_PROVIDER: "mock",
    WORKER_SECRET: workerSecret,
  },
});

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Worker smoke server did not start");
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, item: body.item ?? body.items ?? body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

async function run() {
  await waitForServer();
  const suffix = Date.now();
  const email = `worker-${suffix}@example.test`;
  const password = "WorkerSmoke123!";
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Worker Tenant", email, password, legalAccepted: true, legalVersion: "legal-2026-06-18" }),
  });
  await request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registered.item.verificationToken }) });
  const login = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const auth = { authorization: `Bearer ${login.item.token}` };
  const schedule = await request("/api/report/schedule", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ clientName: "Scheduled Client", reportMonth: "2026-06", kpis: ["ROAS", "CPA"], deliveryEmail: "delivery@example.test", nextRunAt: "2020-01-01T00:00:00.000Z" }),
  });
  const unauthorized = await request("/api/worker/run", { method: "POST" });
  const first = await request("/api/worker/run", { method: "POST", headers: { "x-worker-secret": workerSecret } });
  const second = await request("/api/worker/run", { method: "POST", headers: { "x-worker-secret": workerSecret } });
  const runs = await request("/api/ai-runs", { headers: auth });
  const jobs = await request("/api/email-jobs", { headers: auth });
  const schedules = await request("/api/schedules", { headers: auth });
  const run = runs.item.find((item) => item.scheduleId === schedule.item.id);
  const job = jobs.item.find((item) => item.scheduleId === schedule.item.id);
  const updatedSchedule = schedules.item.find((item) => item.id === schedule.item.id);

  assert(unauthorized.response.status === 401, "worker rejects requests without a secret");
  assert(first.response.ok && first.item.processed === 1, "worker processes one due schedule");
  assert(second.response.ok && second.item.processed === 0, "worker does not process the same schedule twice");
  assert(Array.isArray(first.item.aiRunIds) && first.item.aiRunIds.length === 1, "worker returns only AI run identifiers");
  assert(!JSON.stringify(first.item).includes("Scheduled Client"), "worker response does not leak client content");
  assert(run?.ownerId === login.item.user.id && run.mode === "scheduled-fallback", "scheduled AI result stays tenant-scoped and falls back safely");
  assert(job?.ownerId === login.item.user.id && job.status === "sent", "scheduled email is sent and tenant-scoped");
  assert(new Date(updatedSchedule.nextRunAt) > new Date(updatedSchedule.lastRunAt), "worker advances the next run time");
}

run()
  .catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => child.kill());
