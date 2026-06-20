#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.SECURITY_SMOKE_PORT || 4392);
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-security-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));

const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    DATABASE_URL: "",
    OPENAI_API_KEY: "",
    AI_API_KEY: "",
    RESEND_API_KEY: "",
    WORKER_SECRET: "security-smoke-worker-secret",
    NODE_ENV: "test",
    APP_BASE_URL: "https://public-payment-review.example.test",
  },
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
  throw new Error("Security test server did not start");
}

async function request(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${body.error || response.status}`);
  return body.item ?? body.items ?? body;
}

async function run() {
  await waitForServer();
  const suffix = Date.now();
  const password = "SecurityTest123!";
  const emailA = `tenant-a-${suffix}@example.test`;
  const emailB = `tenant-b-${suffix}@example.test`;
  const noConsentResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.example" },
    body: JSON.stringify({ name: "No consent", email: `no-consent-${suffix}@example.test`, password }),
  });
  const legal = { legalAccepted: true, legalVersion: "legal-2026-06-18" };
  const registeredA = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Tenant A", email: emailA, password, ...legal }) });
  const registeredB = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Tenant B", email: emailB, password, ...legal }) });
  await request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registeredA.verificationToken }) });
  await request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registeredB.verificationToken }) });
  const tenantA = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailA, password }) });
  const tenantB = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailB, password }) });
  const cookieLoginResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: emailB, password }),
  });
  const sessionCookie = cookieLoginResponse.headers.get("set-cookie") || "";
  const cookieMeResponse = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
    headers: { cookie: sessionCookie.split(";")[0] },
  });
  const authA = { authorization: `Bearer ${tenantA.token}` };
  const authB = { authorization: `Bearer ${tenantB.token}` };
  const created = await request("/api/reports", {
    method: "POST",
    headers: authA,
    body: JSON.stringify({ id: "tenant-a-report", client: "Private Client A", month: "2026-06", snapshot: { csv: "channel,spend", metrics: { roas: 3 } } }),
  });
  const reportsA = await request("/api/reports", { headers: authA });
  const reportsB = await request("/api/reports", { headers: authB });
  const resetRequest = await request("/api/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email: emailA }) });
  await request("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: resetRequest.resetToken, password: "NewSecurityPassword123!" }) });
  const revokedResponse = await fetch(`http://127.0.0.1:${port}/api/reports`, { headers: authA });
  const newLogin = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailA, password: "NewSecurityPassword123!" }) });
  const newAuthA = { authorization: `Bearer ${newLogin.token}` };
  const unavailableCheckoutResponse = await fetch(`http://127.0.0.1:${port}/api/billing/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", ...newAuthA },
    body: JSON.stringify({ plan: "starter", currency: "TWD", accountEmail: emailA }),
  });
  const unavailableCheckoutBody = await unavailableCheckoutResponse.json().catch(() => ({}));
  const exported = await request("/api/account/export", { headers: newAuthA });
  const badDeleteResponse = await fetch(`http://127.0.0.1:${port}/api/account`, {
    method: "DELETE",
    headers: { "content-type": "application/json", ...newAuthA },
    body: JSON.stringify({ password: "incorrect-password", confirmation: "DELETE" }),
  });
  const missingConfirmationResponse = await fetch(`http://127.0.0.1:${port}/api/account`, {
    method: "DELETE",
    headers: { "content-type": "application/json", ...newAuthA },
    body: JSON.stringify({ password: "NewSecurityPassword123!", confirmation: "delete" }),
  });
  const deletedAccount = await request("/api/account", {
    method: "DELETE",
    headers: newAuthA,
    body: JSON.stringify({ password: "NewSecurityPassword123!", confirmation: "DELETE" }),
  });
  const deletedSessionResponse = await fetch(`http://127.0.0.1:${port}/api/auth/me`, { headers: newAuthA });
  const survivingTenantResponse = await fetch(`http://127.0.0.1:${port}/api/auth/me`, { headers: authB });
  const db = JSON.parse(fs.readFileSync(path.join(testRoot, "data", "db.json"), "utf8"));
  const exportedUser = exported.collections?.auth_users?.[0] || {};
  const exportedSessions = exported.collections?.auth_sessions || [];
  const deletionAudit = db.audit_logs.find((item) => item.action === "account:deleted");
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const checks = {
    tenantASeesOwnReport: reportsA.length === 1,
    tenantBCannotSeeTenantA: reportsB.length === 0,
    registrationRequiresLegalConsent: noConsentResponse.status === 400,
    apiDoesNotExposeWildcardCors: noConsentResponse.headers.get("access-control-allow-origin") !== "*",
    reportHasOwner: created.ownerId === tenantA.user.id,
    sessionTokensAreHashed: db.auth_sessions.every((session) => session.tokenHash && !session.token),
    sessionCookieIsHttpOnly: /HttpOnly/i.test(sessionCookie) && /SameSite=Lax/i.test(sessionCookie),
    sessionCookieAuthenticates: cookieMeResponse.status === 200,
    authenticatedResponsesAreNotCached: /no-store/i.test(cookieMeResponse.headers.get("cache-control") || ""),
    frontendSessionRestoreKeepsBearerToken: appSource.includes('else if (!auth) localStorage.removeItem("agencyReportAuthToken")')
      && !appSource.includes('else if (auth) localStorage.removeItem("agencyReportAuthToken")'),
    frontendCookieSessionLoadsProtectedData: !appSource.includes("if (!authToken()) return;")
      && appSource.match(/if \(!state\.auth && !authToken\(\)\) return;/g)?.length === 3,
    legalConsentIsVersioned: exported.collections?.consents?.length === 1
      && db.consents.length === 1
      && [...exported.collections.consents, ...db.consents].every((item) => item.legalVersion === "legal-2026-06-18" && item.acceptedAt),
    passwordResetRevokesSessions: revokedResponse.status === 401,
    passwordResetAllowsNewLogin: Boolean(newLogin.token),
    accountExportContainsOnlyTenantData: exported.account?.id === tenantA.user.id && exported.collections?.reports?.length === 1 && !JSON.stringify(exported).includes(emailB),
    accountExportOmitsCredentials: !exportedUser.passwordHash && exportedSessions.every((session) => !session.tokenHash && !session.token),
    accountDeleteRequiresPassword: badDeleteResponse.status === 400,
    accountDeleteRequiresExactConfirmation: missingConfirmationResponse.status === 400,
    accountDeleteRemovesTenant: deletedAccount.deleted === true && !db.auth_users.some((user) => user.id === tenantA.user.id) && !db.reports.some((report) => report.ownerId === tenantA.user.id),
    accountDeleteRevokesSession: deletedSessionResponse.status === 401,
    accountDeletePreservesOtherTenant: survivingTenantResponse.status === 200 && db.auth_users.some((user) => user.id === tenantB.user.id),
    deletionAuditIsAnonymous: Boolean(deletionAudit?.subjectHash) && !deletionAudit.ownerId && !deletionAudit.userId && !deletionAudit.email,
    publicReviewSiteBlocksMockCheckout: unavailableCheckoutResponse.status === 503 && unavailableCheckoutBody.code === "PAYMENT_NOT_AVAILABLE",
  };
  Object.entries(checks).forEach(([name, ok]) => console.log(`${ok ? "OK" : "FAIL"} ${name}`));
  if (Object.values(checks).some((ok) => !ok)) process.exitCode = 1;
}

run()
  .catch((error) => {
    console.error(`Security smoke failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (child.exitCode == null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    fs.rmSync(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
