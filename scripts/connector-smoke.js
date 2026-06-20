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
let ga4DataCalls = 0;
let googleAdsDataCalls = 0;
let metaInsightsCalls = 0;
const tokenServer = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => { body += chunk.toString(); });
  req.on("end", () => {
    const params = Object.fromEntries(new URLSearchParams(body));
    tokenRequests.push({ url: req.url, params, headers: req.headers, body });
    if (req.url.startsWith("/admin/accountSummaries")) {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ accountSummaries: [{ account: "accounts/42", displayName: "Agency Account", propertySummaries: [{ property: "properties/123456", displayName: "Client GA4" }] }] }));
    }
    if (req.url.startsWith("/data/properties/123456:runReport")) {
      ga4DataCalls += 1;
      if (ga4DataCalls === 1) {
        res.writeHead(429, { "content-type": "application/json", "retry-after": "0" });
        return res.end(JSON.stringify({ error: { message: "quota retry" } }));
      }
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({
        dimensionHeaders: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
        metricHeaders: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }, { name: "purchaseRevenue" }],
        rows: [
          { dimensionValues: [{ value: "20260601" }, { value: "Organic Search" }], metricValues: [{ value: "120" }, { value: "100" }, { value: "8" }, { value: "4200.5" }] },
          { dimensionValues: [{ value: "20260601" }, { value: "Paid Search" }], metricValues: [{ value: "80" }, { value: "70" }, { value: "12" }, { value: "6800" }] },
        ],
      }));
    }
    if (req.url === "/googleads/customers:listAccessibleCustomers") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ resourceNames: ["customers/1111111111"] }));
    }
    if (req.url === "/googleads/customers/1111111111/googleAds:search") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ results: [
        { customerClient: { clientCustomer: "customers/1111111111", descriptiveName: "Agency MCC", manager: true, level: "0", status: "ENABLED", currencyCode: "TWD", timeZone: "Asia/Taipei" } },
        { customerClient: { clientCustomer: "customers/2222222222", descriptiveName: "Client Ads", manager: false, level: "1", status: "ENABLED", currencyCode: "TWD", timeZone: "Asia/Taipei" } },
      ] }));
    }
    if (req.url === "/googleads/customers/2222222222/googleAds:searchStream") {
      googleAdsDataCalls += 1;
      if (googleAdsDataCalls === 1) {
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: { message: "temporary backend failure" } }));
      }
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify([{ results: [
        { segments: { date: "2026-06-01" }, campaign: { id: "901", name: "Brand Search" }, metrics: { costMicros: "12345000", impressions: "2000", clicks: "160", conversions: 14.5, conversionsValue: 87000 } },
        { segments: { date: "2026-06-02" }, campaign: { id: "902", name: "Performance Max" }, metrics: { costMicros: "20000000", impressions: "3500", clicks: "220", conversions: 21, conversionsValue: 132000 } },
      ] }]));
    }
    const requestUrl = new URL(req.url, tokenBaseUrl);
    if (requestUrl.pathname === "/meta/me/adaccounts") {
      res.writeHead(200, { "content-type": "application/json" });
      if (!requestUrl.searchParams.get("after")) {
        return res.end(JSON.stringify({
          data: [{ id: "act_3333333333", account_id: "3333333333", name: "Meta Client One", account_status: 1, currency: "TWD", timezone_name: "Asia/Taipei", business: { id: "77", name: "Agency Business" } }],
          paging: { next: `${tokenBaseUrl}/meta/me/adaccounts?after=page-2` },
        }));
      }
      return res.end(JSON.stringify({ data: [{ id: "act_4444444444", account_id: "4444444444", name: "Meta Client Two", account_status: 1, currency: "USD", timezone_name: "America/Los_Angeles" }] }));
    }
    if (requestUrl.pathname === "/meta/act_3333333333/insights") {
      metaInsightsCalls += 1;
      if (metaInsightsCalls === 1) {
        res.writeHead(429, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: { message: "rate limited" } }));
      }
      res.writeHead(200, { "content-type": "application/json" });
      if (!requestUrl.searchParams.get("after")) {
        return res.end(JSON.stringify({
          data: [{ date_start: "2026-06-01", date_stop: "2026-06-01", campaign_id: "501", campaign_name: "Meta Prospecting", spend: "6500.50", impressions: "120000", clicks: "2400", actions: [{ action_type: "omni_purchase", value: "32" }, { action_type: "link_click", value: "2400" }], action_values: [{ action_type: "omni_purchase", value: "148000" }] }],
          paging: { next: `${tokenBaseUrl}/meta/act_3333333333/insights?after=page-2` },
        }));
      }
      return res.end(JSON.stringify({ data: [{ date_start: "2026-06-02", date_stop: "2026-06-02", campaign_id: "502", campaign_name: "Meta Retargeting", spend: "2300", impressions: "38000", clicks: "920", actions: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "18" }], action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "89000" }] }] }));
    }
    if (req.url.startsWith("/meta/token") && params.grant_type === "fb_exchange_token") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ access_token: "meta-long-lived-token", token_type: "Bearer", expires_in: 5184000 }));
    }
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
    META_GRAPH_VERSION: "v25.0",
    GOOGLE_OAUTH_TOKEN_URL: `${tokenBaseUrl}/google/token`,
    META_OAUTH_TOKEN_URL: `${tokenBaseUrl}/meta/token`,
    GA4_ADMIN_API_URL: `${tokenBaseUrl}/admin`,
    GA4_DATA_API_URL: `${tokenBaseUrl}/data`,
    GOOGLE_ADS_API_URL: `${tokenBaseUrl}/googleads`,
    GOOGLE_ADS_API_VERSION: "v24",
    META_GRAPH_API_URL: `${tokenBaseUrl}/meta`,
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
  const refreshDbPath = path.join(testRoot, "data", "db.json");
  const refreshDb = JSON.parse(fs.readFileSync(refreshDbPath, "utf8"));
  const expiringGa4Credential = refreshDb.connector_credentials.find((item) => item.ownerId === tenantA.user.id && item.provider === "ga4");
  expiringGa4Credential.expiresAt = new Date(Date.now() - 60_000).toISOString();
  fs.writeFileSync(refreshDbPath, JSON.stringify(refreshDb, null, 2));
  const connectionsA = await call("/api/connectors/connections", { headers: tenantA.headers });
  const connectionsB = await call("/api/connectors/connections", { headers: tenantB.headers });
  const ga4Properties = await call("/api/connectors/ga4/properties", { headers: tenantA.headers });
  const foreignGa4Properties = await call("/api/connectors/ga4/properties", { headers: tenantB.headers });
  const invalidGa4Property = await call("/api/connectors/ga4/select", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ propertyId: "invalid" }) });
  const ga4Source = await call("/api/connectors/ga4/select", { method: "POST", headers: tenantA.headers, body: JSON.stringify(ga4Properties.item[0]) });
  const foreignGa4Sync = await call("/api/connectors/ga4/sync", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ sourceId: ga4Source.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const invalidDateGa4Sync = await call("/api/connectors/ga4/sync", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ sourceId: ga4Source.item.id, startDate: "2026-06-30", endDate: "2026-06-01" }) });
  const ga4Sync = await call("/api/connectors/ga4/sync", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ sourceId: ga4Source.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const metricsA = await call(`/api/connectors/metrics?provider=ga4&sourceId=${encodeURIComponent(ga4Source.item.id)}`, { headers: tenantA.headers });
  const metricsB = await call("/api/connectors/metrics?provider=ga4", { headers: tenantB.headers });
  const googleAdsCustomers = await call("/api/connectors/google-ads/customers", { headers: tenantB.headers });
  const foreignGoogleAdsCustomers = await call("/api/connectors/google-ads/customers", { headers: tenantA.headers });
  const invalidGoogleAdsCustomer = await call("/api/connectors/google-ads/select", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ customerId: "bad", loginCustomerId: "1111111111" }) });
  const managerGoogleAdsCustomer = await call("/api/connectors/google-ads/select", { method: "POST", headers: tenantB.headers, body: JSON.stringify(googleAdsCustomers.item[0]) });
  const adsClient = googleAdsCustomers.item.find((item) => item.customerId === "2222222222");
  const googleAdsSource = await call("/api/connectors/google-ads/select", { method: "POST", headers: tenantB.headers, body: JSON.stringify(adsClient) });
  const foreignGoogleAdsSync = await call("/api/connectors/google-ads/sync", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ sourceId: googleAdsSource.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const googleAdsSync = await call("/api/connectors/google-ads/sync", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ sourceId: googleAdsSource.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const googleAdsMetricsB = await call(`/api/connectors/metrics?provider=google_ads&sourceId=${encodeURIComponent(googleAdsSource.item.id)}`, { headers: tenantB.headers });
  const googleAdsMetricsA = await call("/api/connectors/metrics?provider=google_ads", { headers: tenantA.headers });
  const metaAccounts = await call("/api/connectors/meta-ads/accounts", { headers: tenantA.headers });
  const foreignMetaAccounts = await call("/api/connectors/meta-ads/accounts", { headers: tenantB.headers });
  const invalidMetaAccount = await call("/api/connectors/meta-ads/select", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ accountId: "invalid" }) });
  const inaccessibleMetaAccount = await call("/api/connectors/meta-ads/select", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ accountId: "9999999999" }) });
  const metaSource = await call("/api/connectors/meta-ads/select", { method: "POST", headers: tenantA.headers, body: JSON.stringify(metaAccounts.item[0]) });
  const foreignMetaSync = await call("/api/connectors/meta-ads/sync", { method: "POST", headers: tenantB.headers, body: JSON.stringify({ sourceId: metaSource.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const metaSync = await call("/api/connectors/meta-ads/sync", { method: "POST", headers: tenantA.headers, body: JSON.stringify({ sourceId: metaSource.item.id, startDate: "2026-06-01", endDate: "2026-06-30" }) });
  const metaMetricsA = await call(`/api/connectors/metrics?provider=meta_ads&sourceId=${encodeURIComponent(metaSource.item.id)}`, { headers: tenantA.headers });
  const metaMetricsB = await call("/api/connectors/metrics?provider=meta_ads", { headers: tenantB.headers });
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
  assert(tokenRequests.some((item) => item.url.includes("google") && item.params.grant_type === "refresh_token" && item.params.refresh_token === "refresh-ga4-code"), "expired Google access tokens refresh automatically without exposing the refresh token");
  assert(tokenRequests.some((item) => item.url.includes("meta/token") && item.params.grant_type === "fb_exchange_token" && item.params.fb_exchange_token === "access-meta-code"), "Meta short-lived authorization token is exchanged for a long-lived server token");
  assert(db.connector_credentials.length === 3 && db.connector_credentials.every((item) => item.accessTokenEncrypted?.algorithm === "aes-256-gcm"), "connector tokens are encrypted and tenant-owned");
  assert(!serializedDb.includes("access-ga4-code") && !serializedDb.includes("refresh-ga4-code") && !serializedDb.includes("access-meta-code") && !serializedDb.includes("access-google-ads-code"), "access and refresh tokens never persist in plaintext");
  assert(connectionsA.item.length === 2 && connectionsB.item.length === 1 && connectionsA.item.every((item) => !JSON.stringify(item).includes("Encrypted")), "connection status is tenant-scoped and never exposes token envelopes");
  assert(disconnectedMeta.response.ok && disconnectedMeta.item.disconnected === true && connectionsAAfterDisconnect.item.length === 1 && connectionsBAfterDisconnect.item.length === 1, "disconnect removes only the selected tenant connection");
  assert(ga4Properties.response.ok && ga4Properties.item.length === 1 && ga4Properties.item[0].propertyId === "123456", "GA4 account summaries expose selectable properties without tokens");
  assert(foreignGa4Properties.response.status === 409, "tenant without a GA4 connection cannot discover another tenant's properties");
  assert(invalidGa4Property.response.status === 400 && invalidGa4Property.body.code === "GA4_PROPERTY_INVALID", "invalid GA4 property identifiers are rejected");
  assert(ga4Source.response.status === 201 && ga4Source.item.ownerId === tenantA.user.id && ga4Source.item.externalAccountId === "123456", "selected GA4 property becomes a tenant-owned data source");
  assert(foreignGa4Sync.response.status === 404 && foreignGa4Sync.body.code === "DATA_SOURCE_NOT_FOUND", "tenant cannot sync another tenant's GA4 source");
  assert(invalidDateGa4Sync.response.status === 400 && invalidDateGa4Sync.body.code === "SYNC_DATE_RANGE_INVALID", "GA4 sync rejects invalid date ranges");
  assert(ga4Sync.response.ok && ga4Sync.item.job.status === "completed" && ga4Sync.item.job.attempts === 2 && ga4Sync.item.metrics.length === 2, "GA4 Data API sync retries quota responses and records completion");
  assert(metricsA.item.length === 2 && metricsA.item.some((item) => item.channel === "Paid Search" && item.sessions === 80 && item.conversions === 12 && item.revenue === 6800), "GA4 rows normalize into the shared KPI model");
  assert(metricsB.item.length === 0, "normalized connector metrics are tenant-isolated");
  assert(googleAdsCustomers.response.ok && googleAdsCustomers.item.length === 2 && googleAdsCustomers.item.some((item) => item.customerId === "2222222222" && item.loginCustomerId === "1111111111"), "Google Ads discovery expands an accessible manager into selectable client accounts");
  assert(foreignGoogleAdsCustomers.response.status === 409, "tenant without a Google Ads connection cannot discover another tenant's customers");
  assert(invalidGoogleAdsCustomer.response.status === 400 && invalidGoogleAdsCustomer.body.code === "GOOGLE_ADS_CUSTOMER_INVALID", "invalid Google Ads customer identifiers are rejected");
  assert(managerGoogleAdsCustomer.response.status === 400 && managerGoogleAdsCustomer.body.code === "GOOGLE_ADS_MANAGER_NOT_REPORTABLE", "manager accounts cannot be selected as report data sources");
  assert(googleAdsSource.response.status === 201 && googleAdsSource.item.ownerId === tenantB.user.id && googleAdsSource.item.externalAccountId === "2222222222" && googleAdsSource.item.loginCustomerId === "1111111111", "selected Google Ads client becomes a tenant-owned data source with its manager context");
  assert(foreignGoogleAdsSync.response.status === 404 && foreignGoogleAdsSync.body.code === "DATA_SOURCE_NOT_FOUND", "tenant cannot sync another tenant's Google Ads source");
  assert(googleAdsSync.response.ok && googleAdsSync.item.job.status === "completed" && googleAdsSync.item.job.attempts === 2 && googleAdsSync.item.metrics.length === 2, "Google Ads searchStream retries transient failures and records completion");
  assert(googleAdsMetricsB.item.length === 2 && googleAdsMetricsB.item.some((item) => item.campaignName === "Brand Search" && item.spend === 12.345 && item.clicks === 160 && item.conversions === 14.5 && item.revenue === 87000), "Google Ads rows normalize cost micros and campaign KPIs into the shared model");
  assert(googleAdsMetricsA.item.length === 0, "Google Ads normalized metrics remain tenant-isolated");
  assert(tokenRequests.some((item) => item.url.includes("customers:listAccessibleCustomers") && item.headers["developer-token"] === "google-ads-developer-token"), "Google Ads requests include the developer token");
  assert(tokenRequests.some((item) => item.url.includes("2222222222/googleAds:searchStream") && item.headers["login-customer-id"] === "1111111111" && item.body.includes("metrics.cost_micros")), "Google Ads report requests preserve manager context and use GAQL KPI fields");
  assert(metaAccounts.response.ok && metaAccounts.item.length === 2 && metaAccounts.item[0].accountId === "3333333333", "Meta account discovery follows trusted Graph pagination and exposes selectable ad accounts");
  assert(foreignMetaAccounts.response.status === 409, "tenant without a Meta connection cannot discover another tenant's ad accounts");
  assert(invalidMetaAccount.response.status === 400 && invalidMetaAccount.body.code === "META_AD_ACCOUNT_INVALID", "invalid Meta ad account identifiers are rejected");
  assert(inaccessibleMetaAccount.response.status === 400 && inaccessibleMetaAccount.body.code === "META_AD_ACCOUNT_NOT_ACCESSIBLE", "Meta ad accounts outside the authorized account list are rejected");
  assert(metaSource.response.status === 201 && metaSource.item.ownerId === tenantA.user.id && metaSource.item.externalAccountId === "3333333333" && metaSource.item.businessId === "77", "selected Meta ad account becomes a tenant-owned data source");
  assert(foreignMetaSync.response.status === 404 && foreignMetaSync.body.code === "DATA_SOURCE_NOT_FOUND", "tenant cannot sync another tenant's Meta Ads source");
  assert(metaSync.response.ok && metaSync.item.job.status === "completed" && metaSync.item.job.attempts === 3 && metaSync.item.metrics.length === 2, "Meta Insights sync retries rate limits, follows pagination, and records completion");
  assert(metaMetricsA.item.length === 2 && metaMetricsA.item.some((item) => item.campaignName === "Meta Prospecting" && item.spend === 6500.5 && item.clicks === 2400 && item.conversions === 32 && item.revenue === 148000), "Meta action and action-value rows normalize into the shared campaign KPI model without double counting clicks");
  assert(metaMetricsB.item.length === 0, "Meta normalized metrics remain tenant-isolated");
  assert(tokenRequests.some((item) => item.url.includes("/meta/me/adaccounts") && item.url.includes("appsecret_proof=")) && tokenRequests.some((item) => item.url.includes("/meta/act_3333333333/insights") && item.url.includes("time_increment=1")), "Meta Graph calls use app-secret proof and daily campaign-level Insights parameters");
  assert(tokenRequests.filter((item) => item.url.startsWith("/meta/") && !item.url.startsWith("/meta/token")).every((item) => !item.url.includes("access_token=") && item.headers.authorization === "Bearer meta-long-lived-token"), "Meta access tokens stay out of URLs and travel only in authorization headers");
}

run().catch((error) => { console.error(`FAIL ${error.message}`); process.exitCode = 1; }).finally(() => { child.kill(); tokenServer.close(); });
