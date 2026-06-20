#!/usr/bin/env node

const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.CONNECTOR_SMOKE_PORT || 4402);
const tokenPort = Number(process.env.CONNECTOR_TOKEN_SMOKE_PORT || 4403);
const baseUrl = `http://127.0.0.1:${port}`;
const tokenBaseUrl = `http://127.0.0.1:${tokenPort}`;
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-connector-"));
fs.copyFileSync(path.join(root, "server.js"), path.join(testRoot, "server.js"));
const tokenRequests = [];
const tokenServer = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk.toString(); });
  req.on("end", () => {
    const params = Object.fromEntries(new URLSearchParams(body));
    tokenRequests.push({ url: req.url, params });
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      access_token: `access-${params.code}`,
      refresh_token: req.url.includes("google") ? `refresh-${params.code}` : undefined,
      token_type: "Bearer",
      expires_in: 3600,
      scope: req.url.includes("google") ? "analytics.readonly" : "ads_read business_management",
    }));
  });
});
tokenServer.listen(tokenPort, "127.0.0.1");
const child = spawn(process.execPath, ["server.js"], {
  cwd: testRoot,
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "test",
    DATABASE_URL: "",
    APP_BASE_URL: baseUrl,
    WORKER_SECRET: "connector-smoke-secret",
    CONNECTOR_ENCRYPTION_KEY: "connector-smoke-encryption-key-32-chars-minimum",
    GOOGLE_OAUTH_CLIENT_ID: "google-client-id.apps.googleusercontent.com",
    GOOGLE_OAUTH_CLIENT_SECRET: "google-client-secret",
    GOOGLE_ADS_DEVELOPER_TOKEN: "google-ads-developer-token",
    META_APP_ID: "meta-app-id",
    META_APP_SECRET: "meta-app-secret",
    META_GRAPH_VERSION: "v23.0",
    GOOGLE_OAUTH_TOKEN_URL: `${tokenBaseUrl}/google/token`,
    META_OAUTH_TOKEN_URL: `${tokenBaseUrl}/meta/token`,
  },
});
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
  const unauthenticatedOAuth = await call("/api/connectors/oauth/start", { method: "POST", body: JSON.stringify({ provider: "ga4" }) });
  const unsupportedOAuth = await call("/api/connectors/oauth/start", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ provider: "unknown" }) });
  const ga4OAuth = await call("/api/connectors/oauth/start", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ provider: "ga4" }) });
  const metaOAuth = await call("/api/connectors/oauth/start", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ provider: "meta_ads" }) });
  const googleAdsOAuth = await call("/api/connectors/oauth/start", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ provider: "google_ads" }) });
  const ga4Url = new URL(ga4OAuth.item.authorizationUrl);
  const metaUrl = new URL(metaOAuth.item.authorizationUrl);
  const googleAdsUrl = new URL(googleAdsOAuth.item.authorizationUrl);
  const rawStates = [ga4Url.searchParams.get("state"), metaUrl.searchParams.get("state"), googleAdsUrl.searchParams.get("state")];
  const ga4Callback = await fetch(`${baseUrl}/api/connectors/oauth/callback/ga4?code=ga4-code&state=${encodeURIComponent(rawStates[0])}`, { redirect: "manual" });
  const replayedGa4Callback = await call(`/api/connectors/oauth/callback/ga4?code=ga4-code-replay&state=${encodeURIComponent(rawStates[0])}`);
  const metaCallback = await fetch(`${baseUrl}/api/connectors/oauth/callback/meta_ads?code=meta-code&state=${encodeURIComponent(rawStates[1])}`, { redirect: "manual" });
  const googleAdsCallback = await fetch(`${baseUrl}/api/connectors/oauth/callback/google_ads?code=google-ads-code&state=${encodeURIComponent(rawStates[2])}`, { redirect: "manual" });
  const connectionsA = await call("/api/connectors/connections", { headers: tenantA.headers });
  const connectionsB = await call("/api/connectors/connections", { headers: tenantB.headers });
  const exportedA = await call("/api/account/export", { headers: tenantA.headers });
  const db = JSON.parse(fs.readFileSync(path.join(testRoot, "data", "db.json"), "utf8"));
  const serializedDb = JSON.stringify(db);
  const serializedExport = JSON.stringify(exportedA.item);
  const disconnectedMeta = await call("/api/connectors/connections?provider=meta_ads", { method: "DELETE", headers: tenantA.headers });
  const connectionsAAfterDisconnect = await call("/api/connectors/connections", { headers: tenantA.headers });
  const connectionsBAfterDisconnect = await call("/api/connectors/connections", { headers: tenantB.headers });

  assert(valid.response.ok && valid.item.rowCount === 1 && valid.item.provider === "manual_csv", "CSV aliases normalize and valid report data passes");
  assert(invalid.response.status === 400, "CSV without report columns is rejected");
  assert(localUrl.response.status === 400 && localUrl.body.code === "DATA_SOURCE_INVALID", "localhost URL is rejected before fetch");
  assert(foreignUrl.response.status === 400 && foreignUrl.body.code === "DATA_SOURCE_INVALID", "non-Google URL is rejected before fetch");
  assert(malformedSheet.response.status === 400, "malformed Google Sheets URL is rejected");
  assert(foreignSync.response.status === 404 && foreignSync.body.code === "DATA_SOURCE_NOT_FOUND", "tenant cannot sync another tenant's source");
  assert(ownSync.response.ok && ownSync.item.ownerId === tenantA.user.id, "data sync retains tenant ownership");
  assert(aSyncs.item.length === 1 && bSyncs.item.length === 0, "sync history is tenant-isolated");
  assert(unauthenticatedOAuth.response.status === 401, "OAuth start requires an authenticated tenant");
  assert(unsupportedOAuth.response.status === 400 && unsupportedOAuth.body.code === "CONNECTOR_PROVIDER_UNSUPPORTED", "unsupported OAuth provider is rejected");
  assert(ga4OAuth.response.status === 201 && ga4Url.hostname === "accounts.google.com" && ga4Url.searchParams.get("code_challenge_method") === "S256", "GA4 OAuth uses Google authorization with PKCE");
  assert(googleAdsOAuth.response.status === 201 && googleAdsUrl.searchParams.get("scope").includes("auth/adwords"), "Google Ads OAuth requests the read/write API scope required by Google Ads");
  assert(metaOAuth.response.status === 201 && metaUrl.hostname === "www.facebook.com" && metaUrl.searchParams.get("scope").includes("ads_read"), "Meta OAuth requests read-only advertising access");
  assert(db.oauth_states.length === 3 && db.oauth_states.filter((item) => item.ownerId === tenantA.user.id).length === 2 && db.oauth_states.filter((item) => item.ownerId === tenantB.user.id).length === 1, "OAuth state records are tenant-isolated");
  assert(rawStates.every((state) => state && !serializedDb.includes(state)) && db.oauth_states.every((item) => item.stateHash && (item.status === "used" ? !item.pkceVerifierEncrypted : item.pkceVerifierEncrypted?.algorithm === "aes-256-gcm")), "raw OAuth states are hashed and PKCE verifiers are encrypted until consumed");
  assert(!serializedExport.includes("stateHash") && !serializedExport.includes("pkceVerifierEncrypted") && !serializedExport.includes("ciphertext"), "account export redacts OAuth secrets");
  assert(ga4Callback.status === 302 && ga4Callback.headers.get("location")?.includes("connector=ga4&status=connected"), "GA4 OAuth callback exchanges the authorization code and redirects safely");
  assert(metaCallback.status === 302 && metaCallback.headers.get("location")?.includes("connector=meta_ads&status=connected"), "Meta OAuth callback exchanges the authorization code and redirects safely");
  assert(googleAdsCallback.status === 302 && googleAdsCallback.headers.get("location")?.includes("connector=google_ads&status=connected"), "Google Ads OAuth callback exchanges the authorization code and redirects safely");
  assert(replayedGa4Callback.response.status === 400 && replayedGa4Callback.body.code === "CONNECTOR_OAUTH_STATE_REPLAYED", "OAuth state cannot be replayed");
  assert(tokenRequests.some((item) => item.url.includes("google") && item.params.code_verifier && item.params.grant_type === "authorization_code"), "Google token exchange verifies PKCE");
  assert(db.connector_credentials.length === 3 && db.connector_credentials.every((item) => item.accessTokenEncrypted?.algorithm === "aes-256-gcm"), "connector tokens are encrypted and tenant-owned");
  assert(!serializedDb.includes("access-ga4-code") && !serializedDb.includes("refresh-ga4-code") && !serializedDb.includes("access-meta-code") && !serializedDb.includes("access-google-ads-code"), "access and refresh tokens never persist in plaintext");
  assert(connectionsA.item.length === 2 && connectionsB.item.length === 1 && connectionsA.item.every((item) => !JSON.stringify(item).includes("Encrypted")), "connection status is tenant-scoped and never exposes token envelopes");
  assert(disconnectedMeta.response.ok && disconnectedMeta.item.disconnected === true && connectionsAAfterDisconnect.item.length === 1 && connectionsBAfterDisconnect.item.length === 1, "disconnect removes only the selected tenant connection");
}

run().catch((error) => { console.error(`FAIL ${error.message}`); process.exitCode = 1; }).finally(() => { child.kill(); tokenServer.close(); });
