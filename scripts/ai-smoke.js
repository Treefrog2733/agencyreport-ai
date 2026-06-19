#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.AI_SMOKE_PORT || 4394);
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-ai-"));

function loadEnvValue(name) {
  if (process.env[name]) return process.env[name];
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;
    const line = fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${name}=`));
    if (!line) continue;
    const raw = line.slice(line.indexOf("=") + 1).trim();
    return raw.replace(/^(['\"])(.*)\1$/, "$2");
  }
  return "";
}

const apiKey = loadEnvValue("OPENAI_API_KEY") || loadEnvValue("AI_API_KEY");
if (!apiKey) {
  console.error("AI smoke failed: no configured API key");
  process.exit(1);
}

fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));

const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  stdio: ["ignore", "ignore", "pipe"],
  env: {
    ...process.env,
    PORT: String(port),
    DATABASE_URL: "",
    OPENAI_API_KEY: apiKey,
    AI_API_KEY: "",
    AI_PROVIDER: "openai",
    RESEND_API_KEY: "",
    EMAIL_PROVIDER: "mock",
    WORKER_SECRET: "ai-smoke-worker-secret",
    NODE_ENV: "test",
  },
});

let childError = "";
child.stderr.on("data", (chunk) => {
  childError = `${childError}${chunk}`.slice(-2000);
});

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`test server did not start${childError ? `: ${childError.trim()}` : ""}`);
}

async function request(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${body.message || body.error || response.status}`);
  return body.item ?? body.items ?? body;
}

function populated(value) {
  return typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) && value.length > 0;
}

async function run() {
  await waitForServer();
  const suffix = Date.now();
  const email = `ai-smoke-${suffix}@example.test`;
  const password = "AiSmokePassword123!";
  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "AI Smoke Agency",
      email,
      password,
      legalAccepted: true,
      legalVersion: "legal-2026-06-18",
    }),
  });
  await request("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token: registered.verificationToken }),
  });
  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const result = await request("/api/report/run", {
    method: "POST",
    headers: { authorization: `Bearer ${login.token}` },
    body: JSON.stringify({
      clientName: "AI Smoke Client",
      reportMonth: "2026-06",
      reportType: "ads",
      clientBrief: "Prioritize ROAS while protecting conversion volume.",
      metrics: { spend: 12000, revenue: 48000, roas: 4, conversions: 36, cpa: 333 },
      channels: [
        { name: "Search", spend: 8000, revenue: 36000, roas: 4.5 },
        { name: "Social", spend: 4000, revenue: 12000, roas: 3 },
      ],
    }),
  });

  const checks = {
    liveMode: result.mode === "live",
    openAiProvider: result.provider === "openai",
    summary: populated(result.summary),
    risks: populated(result.risks),
    nextActions: populated(result.nextActions),
    clientReplyDraft: populated(result.clientReplyDraft),
    usageConsumed: result.usage?.allowed === true && Boolean(result.usageEventId),
  };
  Object.entries(checks).forEach(([name, ok]) => console.log(`${ok ? "OK" : "FAIL"} ${name}`));
  if (result.mode !== "live" && result.providerError) {
    console.error(`AI provider error: ${result.providerError}`);
  }
  if (Object.values(checks).some((ok) => !ok)) process.exitCode = 1;
}

run()
  .catch((error) => {
    console.error(`AI smoke failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (child.exitCode == null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
