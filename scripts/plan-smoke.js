#!/usr/bin/env node

const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.PLAN_SMOKE_PORT || 4398);
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-plan-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));

const merchantId = "3002607";
const hashKey = "pwFHCqoQZGmho4w6";
const hashIv = "EkRm7iFT261dpevs";
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "test",
    DATABASE_URL: "",
    AI_PROVIDER: "fallback",
    PAYMENT_PROVIDER: "ecpay",
    ECPAY_MODE: "stage",
    ECPAY_MERCHANT_ID: merchantId,
    ECPAY_HASH_KEY: hashKey,
    ECPAY_HASH_IV: hashIv,
    APP_BASE_URL: baseUrl,
    RATE_LIMIT_MAX: "1000",
    AUTH_RATE_LIMIT_MAX: "1000",
    ECPAY_RETURN_URL: `${baseUrl}/api/billing/ecpay/return`,
    ECPAY_ORDER_RESULT_URL: `${baseUrl}/billing/ecpay/result`,
    ECPAY_CLIENT_BACK_URL: baseUrl,
    WORKER_SECRET: "plan-smoke-worker-secret",
  },
});

function encode(value) {
  return encodeURIComponent(String(value)).toLowerCase()
    .replaceAll("%20", "+").replaceAll("'", "%27").replaceAll("~", "%7e")
    .replaceAll("%2d", "-").replaceAll("%5f", "_").replaceAll("%2e", ".")
    .replaceAll("%21", "!").replaceAll("%2a", "*").replaceAll("%28", "(").replaceAll("%29", ")");
}

function checkMac(payload) {
  const values = Object.entries(payload)
    .filter(([key, value]) => key !== "CheckMacValue" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const raw = `HashKey=${hashKey}&${values.map(([key, value]) => `${key}=${value}`).join("&")}&HashIV=${hashIv}`;
  return crypto.createHash("sha256").update(encode(raw)).digest("hex").toUpperCase();
}

function hiddenFields(html) {
  return Object.fromEntries([...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)" \/>/g)]
    .map((match) => [match[1], match[2].replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#039;", "'")]));
}

async function waitForServer() {
  for (let index = 0; index < 80; index += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Plan smoke server did not start");
}

async function json(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`${pathname}: ${body.code || body.error || response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body.item ?? body.items ?? body;
}

async function registerUser(label) {
  const email = `plan-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const registered = await json("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: `Plan ${label}`, email, password: "PlanSmoke123!", legalAccepted: true, legalVersion: "legal-2026-06-18" }),
  });
  await json("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registered.verificationToken }) });
  const auth = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "PlanSmoke123!" }) });
  return { email, auth, headers: { authorization: `Bearer ${auth.token}` } };
}

async function activatePlan(user, plan) {
  const intent = await json("/api/billing/checkout", {
    method: "POST",
    headers: user.headers,
    body: JSON.stringify({ plan, currency: "TWD", accountEmail: user.email }),
  });
  const checkoutHtml = await (await fetch(`${baseUrl}${intent.checkoutUrl}`)).text();
  const fields = hiddenFields(checkoutHtml);
  const callback = {
    MerchantID: merchantId,
    MerchantTradeNo: fields.MerchantTradeNo,
    TradeAmt: fields.TotalAmount,
    RtnCode: "1",
    RtnMsg: "Succeeded",
    PaymentDate: "2026/07/04 12:00:00",
    PaymentType: "Credit_CreditCard",
    CustomField1: fields.CustomField1,
  };
  callback.CheckMacValue = checkMac(callback);
  const paidResponse = await fetch(`${baseUrl}/api/billing/ecpay/return`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(callback),
  });
  if (paidResponse.status !== 200 || (await paidResponse.text()) !== "1|OK") throw new Error(`Could not activate ${plan}`);
}

async function consumeReport(user) {
  return json("/api/report/run", {
    method: "POST",
    headers: user.headers,
    body: JSON.stringify({
      agencyName: "AgencyReport AI",
      clientName: "Demo Client",
      reportType: "ads",
      reportMonth: "2026-07",
      request: "Generate a plan smoke report.",
      kpis: ["CPA", "ROAS"],
      metrics: { roas: 3.4 },
      channels: [{ channel: "Search", spend: 1000, conversions: 10, revenue: 5000 }],
    }),
  });
}

async function expectBlocked(user) {
  const response = await fetch(`${baseUrl}/api/report/run`, {
    method: "POST",
    headers: { "content-type": "application/json", ...user.headers },
    body: JSON.stringify({ clientName: "Blocked Demo", channels: [] }),
  });
  const body = await response.json().catch(() => ({}));
  return response.status === 403 && body.code === "LIMIT_EXCEEDED";
}

function assert(condition, message, details = "") {
  if (!condition) throw new Error(`${message}${details ? `: ${details}` : ""}`);
  console.log(`OK ${message}`);
}

async function verifyPlan(label, expectedLimit) {
  const user = await registerUser(label);
  if (label !== "free") await activatePlan(user, label);
  const before = await json("/api/usage", { headers: user.headers });
  assert(before.plan === label, `${label} resolves to the expected plan`, JSON.stringify(before));
  assert(before.limit === expectedLimit, `${label} exposes the expected AI report limit`, JSON.stringify(before));
  assert(before.planFeatures.limits.aiReports === expectedLimit, `${label} feature matrix matches usage limit`);
  for (let index = 0; index < expectedLimit; index += 1) await consumeReport(user);
  const after = await json("/api/usage", { headers: user.headers });
  assert(after.used === expectedLimit && after.remaining === 0, `${label} can use every included report`, JSON.stringify(after));
  assert(await expectBlocked(user), `${label} blocks the next report after quota is used`);
}

async function run() {
  await waitForServer();
  const plans = await json("/api/plans");
  const expected = { free: 3, starter: 10, agency: 50, professional: 150 };
  assert(plans.length === 4, "public plans endpoint exposes four customer-facing plans");
  for (const [plan, limit] of Object.entries(expected)) {
    const item = plans.find((entry) => entry.key === plan);
    assert(Boolean(item), `${plan} exists in public plan matrix`);
    assert(item.usage.ai_report === limit && item.limits.aiReports === limit, `${plan} public plan limit is consistent`);
  }
  assert(plans.find((entry) => entry.key === "professional").features.googleAdsConnector, "professional includes automated connectors");
  assert(!plans.find((entry) => entry.key === "agency").features.googleAdsConnector, "agency keeps automated connectors gated");
  for (const [plan, limit] of Object.entries(expected)) await verifyPlan(plan, limit);
}

run().catch((error) => {
  console.error(`Plan smoke failed: ${error.message}`);
  process.exitCode = 1;
}).finally(() => child.kill());
