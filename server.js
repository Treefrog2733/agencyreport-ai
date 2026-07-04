const http = require("node:http");
const { readFile, writeFile, mkdir, stat } = require("node:fs/promises");
const { createReadStream, existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
loadLocalEnv();

const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "db.json");
const port = Number(process.env.PORT || 4173);
const googleAnalyticsMeasurementId = "G-Y5ZK791YGN";
const databaseUrl = process.env.DATABASE_URL || "";
const aiProvider = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "fallback")).toLowerCase();
const aiApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
const aiBaseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const aiModel = process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
const emailProvider = (process.env.EMAIL_PROVIDER || "manual").toLowerCase();
const emailApiUrl = process.env.EMAIL_API_URL || (emailProvider === "resend" ? "https://api.resend.com/emails" : "");
const emailApiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "AgencyReport AI <reports@example.com>";
const workerSecret = process.env.WORKER_SECRET || "";
const legalVersion = process.env.LEGAL_VERSION || "legal-2026-06-18";
const paymentProvider = (process.env.PAYMENT_PROVIDER || (process.env.STRIPE_SECRET_KEY ? "stripe" : "mock")).toLowerCase();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripeSuccessUrl = process.env.STRIPE_SUCCESS_URL || "";
const stripeCancelUrl = process.env.STRIPE_CANCEL_URL || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const appBaseUrl = (process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "").replace(/\/$/, "");
const ecpayMerchantId = process.env.ECPAY_MERCHANT_ID || "";
const ecpayHashKey = process.env.ECPAY_HASH_KEY || "";
const ecpayHashIv = process.env.ECPAY_HASH_IV || "";
const ecpayMode = (process.env.ECPAY_MODE || process.env.PAYMENT_MODE || "production").toLowerCase();
const ecpayCheckoutUrl = process.env.ECPAY_CHECKOUT_URL || (ecpayMode === "stage" || ecpayMode === "test" || ecpayMode === "sandbox"
  ? "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
  : "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5");
const ecpayReturnUrl = process.env.ECPAY_RETURN_URL || (appBaseUrl ? `${appBaseUrl}/api/billing/ecpay/return` : "");
const ecpayOrderResultUrl = process.env.ECPAY_ORDER_RESULT_URL || (appBaseUrl ? `${appBaseUrl}/billing/ecpay/result` : "");
const ecpayClientBackUrl = process.env.ECPAY_CLIENT_BACK_URL || appBaseUrl || "";
const connectorEncryptionSecret = process.env.CONNECTOR_ENCRYPTION_KEY || "";
const googleOAuthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_ADS_CLIENT_ID || "";
const googleOAuthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_ADS_CLIENT_SECRET || "";
const metaAppId = process.env.META_APP_ID || "";
const metaAppSecret = process.env.META_APP_SECRET || "";
const metaGraphVersion = process.env.META_GRAPH_VERSION || "v25.0";
const googleOAuthAuthorizationEndpoint = process.env.GOOGLE_OAUTH_AUTHORIZATION_URL || "https://accounts.google.com/o/oauth2/v2/auth";
const googleOAuthTokenEndpoint = process.env.GOOGLE_OAUTH_TOKEN_URL || "https://oauth2.googleapis.com/token";
const metaOAuthAuthorizationEndpoint = process.env.META_OAUTH_AUTHORIZATION_URL || `https://www.facebook.com/${metaGraphVersion}/dialog/oauth`;
const metaOAuthTokenEndpoint = process.env.META_OAUTH_TOKEN_URL || `https://graph.facebook.com/${metaGraphVersion}/oauth/access_token`;
const metaGraphApiBaseUrl = (process.env.META_GRAPH_API_URL || `https://graph.facebook.com/${metaGraphVersion}`).replace(/\/$/, "");
const ga4AdminApiBaseUrl = (process.env.GA4_ADMIN_API_URL || "https://analyticsadmin.googleapis.com/v1beta").replace(/\/$/, "");
const ga4DataApiBaseUrl = (process.env.GA4_DATA_API_URL || "https://analyticsdata.googleapis.com/v1beta").replace(/\/$/, "");
const googleAdsApiVersion = process.env.GOOGLE_ADS_API_VERSION || "v24";
const googleAdsApiBaseUrl = (process.env.GOOGLE_ADS_API_URL || `https://googleads.googleapis.com/${googleAdsApiVersion}`).replace(/\/$/, "");
const googleAdsDeveloperToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const connectorEnv = {
  google_sheets: Boolean(process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  google_ads: Boolean(googleAdsDeveloperToken && googleOAuthClientId && googleOAuthClientSecret && connectorEncryptionSecret.length >= 32),
  meta_ads: Boolean(metaAppId && metaAppSecret && connectorEncryptionSecret.length >= 32),
  ga4: Boolean(googleOAuthClientId && googleOAuthClientSecret && connectorEncryptionSecret.length >= 32),
  search_console: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS),
};
let writeQueue = Promise.resolve();
let pgPool = null;
let pgStoreReady = false;
const postgresSchemaVersion = 4;
const aiRuntime = {
  status: aiApiKey ? "untested" : "not_configured",
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastErrorCode: null,
};

function loadLocalEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

const emptyDb = {
  accounts: [],
  team_members: [],
  clients: [],
  templates: [],
  leads: [],
  feedback: [],
  data_sources: [],
  data_syncs: [],
  connector_credentials: [],
  oauth_states: [],
  sync_jobs: [],
  normalized_metrics: [],
  consents: [],
  reports: [],
  ai_runs: [],
  schedules: [],
  intakes: [],
  deliveries: [],
  share_links: [],
  email_jobs: [],
  payment_events: [],
  refund_records: [],
  billing_intents: [],
  invoices: [],
  subscriptions: [],
  usage_events: [],
  portal_invites: [],
  portal_submissions: [],
  auth_users: [],
  auth_sessions: [],
  audit_logs: [],
};

const contentTypes = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".csv": "text/csv;charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const publicStaticFiles = new Set(["/index.html", "/app.js", "/styles.css", "/gtag-init.js"]);
const rateBuckets = new Map();
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 120);
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 20);
const rateLimitExemptPaths = new Set([
  "/api/health",
  "/api/readiness",
  "/api/billing/ecpay/return",
  "/api/billing/webhook",
]);

function publicStaticPath(pathname) {
  if (pathname === "/" || pathname.startsWith("/client/intake/")) return "/index.html";
  if (publicStaticFiles.has(pathname)) return pathname;
  return "";
}

function publicOrigin() {
  return appBaseUrl || "https://app.virtualtrendworks.com";
}

function robotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /billing/",
    "Disallow: /client/",
    `Sitemap: ${publicOrigin()}/sitemap.xml`,
    "",
  ].join("\n");
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["/", "/legal"];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((pathname) => `  <url>
    <loc>${publicOrigin()}${pathname}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${pathname === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${pathname === "/" ? "1.0" : "0.4"}</priority>
  </url>`)
  .join("\n")}
</urlset>
`;
}

function securityHeaders(extra = {}) {
  return {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "cross-origin-resource-policy": "same-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "content-security-policy": "default-src 'self'; script-src 'self' 'sha256-gd3ETQp5xbW48zuUjQhuf83+5fNZSKFUhUVGEdImfuo=' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://payment.ecpay.com.tw https://payment-stage.ecpay.com.tw",
    ...extra,
  };
}

function interactivePageHeaders(nonce, extra = {}) {
  const scriptPolicy = nonce ? `'self' 'nonce-${nonce}'` : "'self'";
  return securityHeaders({
    "content-security-policy": `default-src 'self'; script-src ${scriptPolicy} https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self' https://payment.ecpay.com.tw https://payment-stage.ecpay.com.tw`,
    ...extra,
  });
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function rateLimitForPath(pathname) {
  if (pathname.startsWith("/api/auth/")) return authRateLimitMax;
  return rateLimitMax;
}

function checkRateLimit(req, url) {
  if (rateLimitExemptPaths.has(url.pathname)) return { allowed: true };
  const max = rateLimitForPath(url.pathname);
  if (!Number.isFinite(max) || max <= 0) return { allowed: true };
  const now = Date.now();
  const key = `${clientIp(req)}:${url.pathname.startsWith("/api/auth/") ? "auth" : "api"}`;
  const current = rateBuckets.get(key);
  const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + rateLimitWindowMs };
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucketKey);
    }
  }
  return {
    allowed: bucket.count <= max,
    limit: max,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
  };
}

const planPrices = {
  free: { TWD: 0, USD: 0 },
  starter: { TWD: 790, USD: 25 },
  agency: { TWD: 2490, USD: 79 },
  professional: { TWD: 5990, USD: 189 },
  whiteLabel: { TWD: 5990, USD: 189 },
};

const planUsageLimits = {
  free: { ai_report: 3 },
  starter: { ai_report: 10 },
  agency: { ai_report: 50 },
  professional: { ai_report: 150 },
  whiteLabel: { ai_report: 150 },
};

const planFeatureMatrix = {
  free: {
    label: "Free",
    limits: { aiReports: 3, emailDeliveries: 0, savedReports: 3, clients: 1 },
    features: {
      csvImport: true,
      sheetsImport: true,
      aiRecommendations: true,
      pdfExport: true,
      htmlExport: true,
      brandedReports: false,
      multiClientWorkspace: false,
      paymentRecords: false,
      emailDrafts: false,
      scheduledReports: false,
      clientPortal: false,
      whiteLabel: false,
      advancedAiAnalysis: false,
      googleAdsConnector: false,
      ga4Connector: false,
      metaAdsConnector: false,
    },
  },
  starter: {
    label: "Starter",
    limits: { aiReports: 10, emailDeliveries: 10, savedReports: 25, clients: 5 },
    features: {
      csvImport: true,
      sheetsImport: true,
      aiRecommendations: true,
      pdfExport: true,
      htmlExport: true,
      brandedReports: false,
      multiClientWorkspace: false,
      paymentRecords: false,
      emailDrafts: false,
      scheduledReports: false,
      clientPortal: false,
      whiteLabel: false,
      advancedAiAnalysis: false,
      googleAdsConnector: false,
      ga4Connector: false,
      metaAdsConnector: false,
    },
  },
  agency: {
    label: "Agency",
    limits: { aiReports: 50, emailDeliveries: 50, savedReports: 150, clients: 50 },
    features: {
      csvImport: true,
      sheetsImport: true,
      aiRecommendations: true,
      pdfExport: true,
      htmlExport: true,
      brandedReports: true,
      multiClientWorkspace: true,
      paymentRecords: true,
      emailDrafts: true,
      scheduledReports: false,
      clientPortal: false,
      whiteLabel: false,
      advancedAiAnalysis: false,
      googleAdsConnector: false,
      ga4Connector: false,
      metaAdsConnector: false,
    },
  },
  professional: {
    label: "Professional",
    limits: { aiReports: 150, emailDeliveries: 150, savedReports: 500, clients: 200 },
    features: {
      csvImport: true,
      sheetsImport: true,
      aiRecommendations: true,
      pdfExport: true,
      htmlExport: true,
      brandedReports: true,
      multiClientWorkspace: true,
      paymentRecords: true,
      emailDrafts: true,
      scheduledReports: true,
      clientPortal: true,
      whiteLabel: true,
      advancedAiAnalysis: true,
      googleAdsConnector: true,
      ga4Connector: true,
      metaAdsConnector: true,
    },
  },
};

planFeatureMatrix.whiteLabel = planFeatureMatrix.professional;

function publicPlans() {
  return ["free", "starter", "agency", "professional"].map((key) => ({
    key,
    label: planFeatureMatrix[key].label,
    prices: planPrices[key],
    usage: planUsageLimits[key],
    limits: planFeatureMatrix[key].limits,
    features: planFeatureMatrix[key].features,
  }));
}

function planFeatures(plan) {
  return planFeatureMatrix[normalizePlan(plan)] || planFeatureMatrix.free;
}

function emailStatus() {
  const senderIsProduction = Boolean(emailFrom)
    && !/onboarding@resend\.dev|example\.(com|test)/i.test(emailFrom);
  const hasLiveCredentials = Boolean(emailApiUrl && emailApiKey && senderIsProduction);
  const liveProvider = emailProvider === "api" || emailProvider === "resend";
  return {
    provider: emailProvider,
    mode: liveProvider && hasLiveCredentials ? "live-ready" : emailProvider,
    ready: liveProvider && hasLiveCredentials,
    senderIsProduction,
  };
}

function classifyAiProviderError(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (code.includes("quota") || message.includes("quota") || message.includes("billing")) return "quota_exceeded";
  if (error?.status === 429 || code.includes("rate_limit") || message.includes("rate limit")) return "rate_limited";
  if ([401, 403].includes(Number(error?.status)) || code.includes("auth") || message.includes("api key")) return "authentication_failed";
  if (error?.name === "AbortError" || code === "timeout" || message.includes("timed out")) return "timeout";
  return "provider_error";
}

function aiStatus() {
  const configured = Boolean(aiApiKey);
  const degraded = configured && aiRuntime.status === "degraded";
  return {
    provider: aiProvider,
    configured,
    mode: !configured ? "fallback" : degraded ? "degraded" : "live-ready",
    model: configured ? aiModel : "rules",
    runtimeStatus: aiRuntime.status,
    lastAttemptAt: aiRuntime.lastAttemptAt,
    lastSuccessAt: aiRuntime.lastSuccessAt,
    lastFailureAt: aiRuntime.lastFailureAt,
    lastErrorCode: degraded ? aiRuntime.lastErrorCode : null,
  };
}

async function postgresPool() {
  if (!databaseUrl) return null;
  if (!pgPool) {
    let Pool;
    try {
      ({ Pool } = require("pg"));
    } catch {
      throw new Error("DATABASE_URL is set but the pg package is not installed. Run npm install.");
    }
    const needsSsl = !/localhost|127\.0\.0\.1/i.test(databaseUrl) && process.env.DATABASE_SSL !== "false";
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    });
  }
  if (!pgStoreReady) {
    await pgPool.query(`
      create table if not exists agencyreport_store (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists agencyreport_records (
        collection text not null,
        record_id text not null,
        owner_id text,
        payload jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        primary key (collection, record_id)
      );
      create index if not exists agencyreport_records_owner_idx
        on agencyreport_records (owner_id, collection);
      create index if not exists agencyreport_records_updated_idx
        on agencyreport_records (updated_at desc);
      create index if not exists agencyreport_reports_owner_month_idx
        on agencyreport_records (owner_id, ((payload->>'month')))
        where collection = 'reports';
      create unique index if not exists agencyreport_auth_users_email_uidx
        on agencyreport_records (lower(payload->>'email'))
        where collection = 'auth_users';
      create unique index if not exists agencyreport_auth_sessions_hash_uidx
        on agencyreport_records ((payload->>'tokenHash'))
        where collection = 'auth_sessions';
      create unique index if not exists agencyreport_billing_token_uidx
        on agencyreport_records ((payload->>'token'))
        where collection = 'billing_intents';
      create unique index if not exists agencyreport_oauth_state_hash_uidx
        on agencyreport_records ((payload->>'stateHash'))
        where collection = 'oauth_states';
      create unique index if not exists agencyreport_connector_owner_provider_uidx
        on agencyreport_records (owner_id, (payload->>'provider'))
        where collection = 'connector_credentials';
      create unique index if not exists agencyreport_source_owner_external_uidx
        on agencyreport_records (owner_id, (payload->>'provider'), (payload->>'externalAccountId'))
        where collection = 'data_sources' and payload ? 'externalAccountId';
      create index if not exists agencyreport_sync_jobs_owner_status_idx
        on agencyreport_records (owner_id, (payload->>'status'), updated_at desc)
        where collection = 'sync_jobs';
      create index if not exists agencyreport_metrics_owner_source_date_idx
        on agencyreport_records (owner_id, (payload->>'sourceId'), (payload->>'date'))
        where collection = 'normalized_metrics';
      create table if not exists agencyreport_metadata (
        key text primary key,
        value jsonb not null,
        updated_at timestamptz not null default now()
      );
      do $$ begin
        if not exists (select 1 from pg_constraint where conname = 'agencyreport_records_owner_matches_payload') then
          alter table agencyreport_records add constraint agencyreport_records_owner_matches_payload
            check (owner_id is not distinct from nullif(payload->>'ownerId', ''));
        end if;
      end $$;
      insert into agencyreport_metadata (key, value, updated_at)
      values ('schema_version', '${postgresSchemaVersion}'::jsonb, now())
      on conflict (key) do update
        set value = excluded.value,
            updated_at = case
              when agencyreport_metadata.value is distinct from excluded.value then now()
              else agencyreport_metadata.updated_at
            end;
    `);
    pgStoreReady = true;
  }
  return pgPool;
}

function freshDb() {
  return Object.fromEntries(Object.keys(emptyDb).map((collection) => [collection, []]));
}

function normalizedRecords(db) {
  return Object.keys(emptyDb).flatMap((collection) => (Array.isArray(db[collection]) ? db[collection] : []).map((item) => ({
    collection,
    record_id: String(item.id || crypto.randomUUID()),
    owner_id: item.ownerId ? String(item.ownerId) : null,
    payload: item,
  })));
}

async function replaceNormalizedRecords(client, db) {
  const records = normalizedRecords(db);
  await client.query(`
    create temporary table agencyreport_records_stage (
      collection text not null,
      record_id text not null,
      owner_id text,
      payload jsonb not null
    ) on commit drop
  `);
  if (records.length) {
    await client.query(
      `insert into agencyreport_records_stage (collection, record_id, owner_id, payload)
       select item.collection, item.record_id, item.owner_id, item.payload
       from jsonb_to_recordset($1::jsonb)
         as item(collection text, record_id text, owner_id text, payload jsonb)`,
      [JSON.stringify(records)]
    );
  }
  await client.query(`
    insert into agencyreport_records (collection, record_id, owner_id, payload, created_at, updated_at)
    select collection, record_id, owner_id, payload, now(), now()
    from agencyreport_records_stage
    on conflict (collection, record_id) do update
      set owner_id = excluded.owner_id,
          payload = excluded.payload,
          updated_at = now()
      where agencyreport_records.owner_id is distinct from excluded.owner_id
         or agencyreport_records.payload is distinct from excluded.payload
  `);
  await client.query(`
    delete from agencyreport_records current
    where not exists (
      select 1 from agencyreport_records_stage staged
      where staged.collection = current.collection and staged.record_id = current.record_id
    )
  `);
  await client.query(
    `insert into agencyreport_metadata (key, value, updated_at)
     values ('schema_version', $1::jsonb, now()),
            ('normalized_updated_at', to_jsonb(now()), now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(postgresSchemaVersion)]
  );
}

async function migrateLegacyStore(pool) {
  const [count, legacy, normalized] = await Promise.all([
    pool.query("select count(*)::int as count from agencyreport_records"),
    pool.query("select value, updated_at from agencyreport_store where key = $1", ["main"]),
    pool.query("select updated_at from agencyreport_metadata where key = 'normalized_updated_at'"),
  ]);
  if (!legacy.rowCount) return;
  const legacyIsNewer = !normalized.rowCount || new Date(legacy.rows[0].updated_at) > new Date(normalized.rows[0].updated_at);
  if (count.rows[0].count > 0 && !legacyIsNewer) return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext('agencyreport-schema-migration'))");
    const latestLegacy = await client.query("select value, updated_at from agencyreport_store where key = $1", ["main"]);
    const latestNormalized = await client.query("select updated_at from agencyreport_metadata where key = 'normalized_updated_at'");
    const shouldMigrate = !latestNormalized.rowCount
      || new Date(latestLegacy.rows[0].updated_at) > new Date(latestNormalized.rows[0].updated_at);
    if (shouldMigrate) await replaceNormalizedRecords(client, { ...emptyDb, ...latestLegacy.rows[0].value });
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function readDb() {
  const pool = await postgresPool();
  if (pool) {
    await migrateLegacyStore(pool);
    const result = await pool.query("select collection, payload from agencyreport_records order by created_at, record_id");
    const db = freshDb();
    result.rows.forEach(({ collection, payload }) => {
      if (Object.prototype.hasOwnProperty.call(db, collection)) db[collection].push(payload);
    });
    if (!result.rowCount) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await replaceNormalizedRecords(client, db);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    }
    return db;
  }
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = (await readFile(dbPath, "utf8")).replace(/^\uFEFF/, "");
    return { ...emptyDb, ...JSON.parse(raw) };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeDb(emptyDb);
    return { ...emptyDb };
  }
}

async function writeDb(db) {
  const pool = await postgresPool();
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(hashtext('agencyreport-write'))");
      await replaceNormalizedRecords(client, { ...emptyDb, ...db });
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
    return;
  }
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, securityHeaders({
    "content-type": "application/json;charset=utf-8",
    "cache-control": "no-store",
    pragma: "no-cache",
    ...extraHeaders,
  }));
  res.end(JSON.stringify(body));
}

function sessionCookie(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return [
    `agencyreport_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    `Max-Age=${maxAge}`,
  ].filter(Boolean).join("; ");
}

function clearSessionCookie() {
  return [
    "agencyreport_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    "Max-Age=0",
  ].filter(Boolean).join("; ");
}

function legacyLegalHtml(language = "zh") {
  if (language === "en") return legacyLegalEnglishHtml();
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  ${googleTagHead()}
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgencyReport AI Legal Notice</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10201f;background:#f6f8f7}
    main{max-width:860px;margin:0 auto;padding:40px 20px}
    article{background:#fff;border:1px solid #d9e3df;border-radius:8px;padding:28px;box-shadow:0 18px 50px rgba(15,23,42,.08)}
    h1{margin:0 0 8px;font-size:30px} h2{margin-top:24px;font-size:18px} p,li{color:#60706d;line-height:1.7} .eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#117c72}
  </style>
</head>
<body>
  <main>
    <article>
      <p class="eyebrow">AgencyReport AI &middot; ${escapeHtml(legalVersion)}</p>
      <h1>&#26381;&#21209;&#26781;&#27454;&#33287;&#36039;&#26009;&#20351;&#29992;&#32882;&#26126;</h1>
      <p>&#26412;&#38913;&#26159;&#20844;&#38283;&#28204;&#35430;&#33287; MVP &#38542;&#27573;&#30340;&#27861;&#24459;&#36039;&#35338;&#25688;&#35201;&#12290;&#27491;&#24335;&#25910;&#36027;&#19978;&#32218;&#21069;&#65292;&#20173;&#24314;&#35696;&#30001;&#29087;&#24713;&#21488;&#28771; SaaS&#12289;&#20491;&#36039;&#33287;&#38651;&#23376;&#21830;&#21209;&#35215;&#31684;&#30340;&#27861;&#24459;&#39015;&#21839;&#23529;&#38321;&#12290;</p>
      <h2>&#26381;&#21209;&#29992;&#36884;</h2>
      <ul>
        <li>AgencyReport AI &#21332;&#21161;&#20195;&#29702;&#21830;&#25972;&#29702;&#23458;&#25142;&#38656;&#27714;&#12289;&#21295;&#20837;&#34892;&#37559;&#25976;&#25818;&#12289;&#29986;&#29983; KPI &#22294;&#34920;&#12289;AI &#25688;&#35201;&#33287;&#19979;&#26376;&#34892;&#21205;&#24314;&#35696;&#12290;</li>
        <li>AI &#20839;&#23481;&#20677;&#20379;&#29151;&#36939;&#33287;&#22577;&#21578;&#33609;&#31295;&#21443;&#32771;&#65292;&#20351;&#29992;&#32773;&#20173;&#38656;&#30906;&#35469;&#25976;&#25818;&#27491;&#30906;&#24615;&#12289;&#24291;&#21578;&#24460;&#21488;&#21475;&#24465;&#33287;&#23458;&#25142;&#28317;&#36890;&#20839;&#23481;&#12290;</li>
      </ul>
      <h2>&#36039;&#26009;&#20351;&#29992;</h2>
      <ul>
        <li>&#31995;&#32113;&#26371;&#20445;&#23384;&#24115;&#34399;&#12289;&#23458;&#25142;&#12289;&#22577;&#21578;&#12289;&#20184;&#27454;&#12289;Email &#33287;&#25805;&#20316;&#32000;&#37636;&#65292;&#20197;&#25552;&#20379;&#30331;&#20837;&#12289;&#29986;&#22577;&#12289;&#20132;&#20184;&#12289;&#29992;&#37327;&#25511;&#31649;&#33287;&#23458;&#26381;&#25903;&#25588;&#12290;</li>
        <li>&#20351;&#29992;&#32773;&#21487;&#35201;&#27714;&#26356;&#27491;&#12289;&#21295;&#20986;&#25110;&#21034;&#38500;&#20854;&#25552;&#20132;&#36039;&#26009;&#65307;&#20381;&#27861;&#25110;&#20184;&#27454;&#31293;&#26680;&#25152;&#38656;&#36039;&#26009;&#21487;&#33021;&#38656;&#20445;&#23384;&#24517;&#35201;&#26399;&#38291;&#12290;</li>
      </ul>
      <h2>AI &#36879;&#26126;&#24230;</h2>
      <ul>
        <li>&#26376;&#22577;&#25688;&#35201;&#12289;&#39080;&#38570;&#21028;&#35712;&#12289;&#19979;&#26376;&#24314;&#35696;&#33287;&#23458;&#25142;&#35498;&#26126;&#31295;&#21487;&#33021;&#30001; AI &#29986;&#29983;&#12290;</li>
        <li>&#33509; AI &#26381;&#21209;&#22833;&#25943;&#65292;&#31995;&#32113;&#26371;&#25913;&#29992;&#35215;&#21063;&#22411;&#24314;&#35696;&#20316;&#28858;&#20633;&#25588;&#12290;</li>
      </ul>
      <h2>&#32879;&#32097;&#21516;&#24847;</h2>
      <ul>
        <li>&#20351;&#29992;&#32773;&#36865;&#20986;&#35430;&#29992;&#12289;&#38656;&#27714;&#20837;&#21475;&#25110;&#22577;&#21578;&#36039;&#26009;&#24460;&#65292;&#21516;&#24847;&#25105;&#20497;&#21487;&#23601;&#35430;&#29992;&#12289;&#38656;&#27714;&#12289;&#22577;&#21578;&#12289;&#20184;&#27454;&#33287;&#26381;&#21209;&#20132;&#20184;&#36914;&#34892;&#32879;&#32363;&#12290;</li>
        <li>&#33509;&#38656;&#20572;&#27490;&#32879;&#32363;&#25110;&#35519;&#25972;&#36039;&#26009;&#65292;&#35531;&#36879;&#36942;&#32178;&#31449;&#25110; Email &#32879;&#32097;&#26381;&#21209;&#22296;&#38538;&#12290;</li>
      </ul>
      <h2>訂閱、退款與終止</h2>
      <ul>
        <li>方案價格、週期與用量以結帳頁顯示為準；除法律另有規定或服務無法提供外，已使用的當期費用不按比例退還。</li>
        <li>使用者可停止續訂；終止後仍可於已付款期間使用服務。付款爭議請先透過網站聯絡服務團隊。</li>
      </ul>
      <h2>保存期間與第三方處理</h2>
      <ul>
        <li>帳號及月報資料於提供服務所需期間保存；刪除請求完成後，備份副本會依備份輪替週期清除。</li>
        <li>為提供服務，資料可能由託管、資料庫、AI、Email 與金流供應商處理；供應商僅依其服務目的處理必要資料。</li>
      </ul>
      <h2>責任限制與準據法</h2>
      <ul>
        <li>本服務不保證 AI 建議、第三方平台數據或預測結果完全正確；使用者應在對客戶交付前進行專業審核。</li>
        <li>本服務以中華民國法律為準據法；消費者保護及強制規定不因本條款而排除。</li>
      </ul>
      <p>聯絡窗口：support@virtualtrendworks.com</p>
    </article>
  </main>
</body>
</html>`;
}

function legacyLegalEnglishHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  ${googleTagHead()}
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgencyReport AI Terms and Privacy Policy</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10201f;background:#f6f8f7}
    main{max-width:860px;margin:0 auto;padding:40px 20px}
    article{background:#fff;border:1px solid #d9e3df;border-radius:8px;padding:28px;box-shadow:0 18px 50px rgba(15,23,42,.08)}
    h1{margin:0 0 8px;font-size:30px}h2{margin-top:24px;font-size:18px}p,li{color:#60706d;line-height:1.7}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#117c72}
  </style>
</head>
<body>
  <main>
    <article>
      <p class="eyebrow">AgencyReport AI &middot; ${escapeHtml(legalVersion)}</p>
      <h1>Terms of Service and Privacy Policy</h1>
      <p>This document is the publication draft for the public beta. Before paid public traffic, it should be reviewed by counsel familiar with Taiwan SaaS, privacy, consumer, and e-commerce law.</p>
      <h2>Service purpose</h2>
      <ul>
        <li>AgencyReport AI imports marketing data and produces KPI charts, AI summaries, risk analysis, next-month actions, and client-facing drafts.</li>
        <li>AI output is operational guidance only. Users must verify source data, advertising-platform definitions, and client-facing statements.</li>
      </ul>
      <h2>Data processing and user rights</h2>
      <ul>
        <li>We process account, client, report, payment, email, and audit data to provide authentication, reporting, delivery, usage control, billing, and support.</li>
        <li>Users may request access, correction, export, or deletion. Records required by law, fraud prevention, or payment reconciliation may be retained for the necessary period.</li>
      </ul>
      <h2>AI transparency</h2>
      <ul>
        <li>Report summaries, risks, recommendations, and client messages may be generated by AI.</li>
        <li>If the AI service fails, rules-based recommendations may be used as a fallback and should still be reviewed before delivery.</li>
      </ul>
      <h2>Subscriptions, refunds, and termination</h2>
      <ul>
        <li>Price, billing cycle, and usage limits are shown at checkout. Except where required by law or when the service cannot be provided, used subscription periods are not refunded pro rata.</li>
        <li>Users may stop renewal and retain access through the paid period. Contact support first for payment disputes.</li>
      </ul>
      <h2>Retention and service providers</h2>
      <ul>
        <li>Account and report data is retained while needed to provide the service. Backup copies are removed through the backup rotation after a deletion request is completed.</li>
        <li>Hosting, database, AI, email, and payment providers may process the minimum data needed for their service purpose.</li>
      </ul>
      <h2>Liability and governing law</h2>
      <ul>
        <li>We do not warrant that AI recommendations, third-party data, or forecasts are error-free. Professional review remains the user's responsibility.</li>
        <li>The laws of the Republic of China (Taiwan) govern, without excluding mandatory consumer protections.</li>
      </ul>
      <p>Contact: support@virtualtrendworks.com</p>
    </article>
  </main>
</body>
</html>`;
}

function legalDocumentHtml(language = "zh") {
  const english = language === "en";
  const copy = english ? {
    lang: "en",
    title: "Terms, Privacy and AI Notice",
    description: "AgencyReport AI terms, privacy policy, AI disclosure, refund policy, and data processing addendum.",
    switchLabel: "繁體中文",
    switchHref: "/legal",
    eyebrow: "Legal center",
    status: "Basic operational notice",
    intro: "This page explains the rights and responsibilities that apply to AgencyReport AI, how information is processed, and the rules for AI output and paid service. The policy version recorded at registration controls.",
    contents: "Contents",
    nav: ["Scope", "Terms", "Privacy", "AI transparency", "Billing and refunds", "Data processing", "Rights and contact"],
    notice: "This page is the service's basic operational notice and is not legal advice. The policy version shown here is recorded when users accept the service terms.",
    sections: [
      ["1. Scope and provider", `<p>AgencyReport AI is a marketing-report automation service operated by Virtual Trend Works. It imports marketing data and produces KPI charts, AI summaries, risk analysis, next-month actions, and client deliverables. Registering, signing in, or using the service means accepting the legal version shown at that time.</p>`],
      ["2. Terms of Service", `<h3>Accounts and acceptable use</h3><ul><li>Users must provide accurate information, protect credentials, and remain responsible for account activity.</li><li>Users may not upload unlawful, infringing, malicious, or unauthorized personal data, or bypass usage, payment, or security controls.</li></ul><h3>Customer data and ownership</h3><ul><li>Users retain rights in uploaded data, brand content, and generated reports and represent that they are authorized to submit that data.</li><li>Virtual Trend Works retains rights in the platform, interfaces, templates, and underlying technology and does not acquire ownership of customer data beyond what is needed to provide the service.</li></ul><h3>Availability and responsibility</h3><ul><li>We use reasonable efforts to maintain the service but cannot guarantee uninterrupted third-party platforms, networks, or AI services.</li><li>Users must verify source data, platform definitions, forecasts, and client-facing content before delivery. Liability is limited to the extent permitted by law.</li></ul>`],
      ["3. Privacy Policy", `<h3>Data collected</h3><ul><li>Account data: name, email, password hash, verification status, and authenticated sessions.</li><li>Business data: client names, report periods, requirements, CSV or spreadsheet content, KPIs, AI output, and delivery records.</li><li>Operational data: plan, usage, payment status, email delivery, audit events, hashed IP, browser information, and error records.</li></ul><h3>Purpose and retention</h3><ul><li>Data is processed for authentication, reporting, AI analysis, delivery, billing, fraud prevention, support, and service security.</li><li>Account and report data is generally retained until account deletion or no longer needed. Payment, audit, and statutory records are retained as required for law and disputes. Backup copies expire through rotation.</li><li>We do not sell customer data or use it for unrelated third-party marketing.</li></ul>`],
      ["4. AI transparency and human review", `<ul><li>Necessary requirements, imported metrics, and strongest or weakest channels may be sent to an AI provider to create summaries, risks, actions, and client messages.</li><li>AI output may be incomplete or inaccurate. It is not legal, financial, medical, or advertising-compliance advice and does not make final decisions for the user.</li><li>If AI is unavailable, rules-based recommendations may be used. Users must review all output before delivery.</li></ul>`],
      ["5. Subscriptions, cancellation and refunds", `<ul><li>Price, billing cycle, and report or AI limits are displayed before checkout. Plans begin after successful payment and renew according to the checkout terms.</li><li>Users may request cancellation before the next renewal and ordinarily retain access through the paid term.</li><li>Except where required by law, for duplicate charges, or when the service cannot be provided, used periods are generally not refunded pro rata. Mandatory consumer rights are not excluded.</li><li>Send refund or payment disputes to support@virtualtrendworks.com. Processing time follows the payment provider's procedures and applicable rules.</li></ul>`],
      ["6. Data Processing Addendum and subprocessors", `<p>For data uploaded on behalf of a client, the user generally acts as controller or instructing party and Virtual Trend Works acts as the service provider processing documented instructions. We use reasonable access controls, encryption in transit, session protection, audit logging, and backup verification.</p>`],
      ["7. Data rights, termination and contact", `<ul><li>Signed-in users can export account data and delete an account, and may request access, correction, restriction, or deletion. Records required for payment, security, law, or disputes may be temporarily retained.</li><li>Account deletion revokes sessions and removes primary tenant data. Backup copies expire through rotation, while limited anonymous audit evidence may remain.</li><li>The Traditional Chinese and English notices are intended to be equivalent; the policy version accepted at registration or checkout identifies the applicable notice.</li></ul>`],
    ],
    providers: "Subprocessors and service regions",
    providerNote: "Providers may process data outside Taiwan. We limit transferred data to service needs and manage providers through their terms and applicable requirements. Material security incidents will be assessed and notified as required by law.",
    contact: "Contact",
    footer: "Basic operational notice",
  } : {
    lang: "zh-Hant",
    title: "服務條款、隱私政策與 AI 透明度聲明",
    description: "AgencyReport AI 服務條款、隱私政策、AI 揭露、退款政策與資料處理附錄。",
    switchLabel: "English",
    switchHref: "/legal?lang=en",
    eyebrow: "法律文件中心",
    status: "基本營運告知",
    intro: "本頁說明使用 AgencyReport AI 時雙方的權利義務、資料如何處理，以及 AI 產出與付費服務的適用原則。生效版本以註冊時記錄的版本為準。",
    contents: "文件目錄",
    nav: ["適用範圍", "服務條款", "隱私政策", "AI 透明度", "訂閱與退款", "資料處理", "資料權利與聯絡"],
    notice: "本頁為服務的基本營運告知，不構成法律意見；使用者同意服務條款時，系統會記錄本頁顯示的文件版本。",
    sections: [
      ["1. 適用範圍與服務提供者", `<p>AgencyReport AI 是由 Virtual Trend Works 營運的代理商月報自動化服務，協助使用者匯入行銷資料、產生 KPI 圖表、AI 摘要、風險分析、下月行動建議與客戶交付文件。註冊、登入或使用服務，即表示同意當時顯示的法律版本。</p>`],
      ["2. 服務條款", `<h3>帳號與允許使用</h3><ul><li>使用者應提供正確資料、妥善保管登入憑證，並對帳號內的操作負責。</li><li>不得上傳違法、侵權、惡意程式或未經授權的個人資料，也不得繞過用量、付款或安全控制。</li></ul><h3>客戶資料與智慧財產</h3><ul><li>使用者保有上傳資料、品牌內容與產出報告的權利，並保證有權交付該等資料。</li><li>Virtual Trend Works 保有平台程式、介面、範本與底層技術的權利；除提供服務所必要外，不取得客戶資料所有權。</li></ul><h3>可用性與責任</h3><ul><li>我們採取合理措施維持服務，但不保證第三方平台、網路或 AI 服務永不中斷。</li><li>使用者須在交付前核對來源數據、平台定義、預測與文字內容。責任限制以法律允許範圍為限。</li></ul>`],
      ["3. 隱私政策", `<h3>蒐集資料</h3><ul><li>帳號資料：名稱、Email、密碼雜湊、驗證狀態與登入工作階段。</li><li>業務資料：客戶名稱、報告月份、需求文字、CSV 或試算表內容、KPI、AI 產出與交付紀錄。</li><li>營運資料：方案、用量、付款狀態、Email 寄送、稽核事件、IP 雜湊、瀏覽器與錯誤紀錄。</li></ul><h3>處理目的與保存</h3><ul><li>資料用於身分驗證、產生與保存報告、AI 分析、交付、計費、詐欺防治、客服及系統安全。</li><li>帳號與報告資料通常保存至帳號刪除或不再需要；付款、稽核及法定紀錄依法律與爭議處理需要保存；備份依輪替週期移除。</li><li>我們不出售客戶資料，也不將資料用於無關的第三方行銷。</li></ul>`],
      ["4. AI 透明度與人工覆核", `<ul><li>必要的客戶需求、匯入指標、最佳與最弱渠道可能傳送至 AI 供應商，以產生摘要、風險、行動建議及客戶說明稿。</li><li>AI 內容可能不完整或不正確，不構成法律、財務、醫療或廣告合規意見，也不會代替使用者作最終決策。</li><li>AI 服務失敗時，系統可能改用規則型建議；所有內容在交付前都須由使用者覆核。</li></ul>`],
      ["5. 訂閱、取消與退款", `<ul><li>價格、計費週期、月報或 AI 用量會在結帳前顯示，方案於付款成功後啟用並依結帳條件續訂。</li><li>使用者可在下次續訂前提出停止續訂，既有權限原則上維持至已付期間結束。</li><li>除法律另有要求、重複扣款或服務確實無法提供外，已使用期間原則上不按比例退款；強制消費者權利不受排除。</li><li>退款或付款爭議請寄至 support@virtualtrendworks.com；最終時程與數位服務例外仍待法律與金流複核。</li></ul>`],
      ["6. 資料處理附錄與第三方服務", `<p>就使用者代表客戶上傳的資料，使用者通常為資料控制者或委託方，Virtual Trend Works 為依指示處理資料的服務提供者。我們採取合理的存取控制、傳輸加密、工作階段保護、稽核與備份驗證措施。</p>`],
      ["7. 資料權利、終止與聯絡", `<ul><li>登入後可匯出帳號資料及刪除帳號，也可要求查詢、更正、停止處理或刪除；付款、安全、法律或爭議所需紀錄可能暫時保留。</li><li>帳號刪除會撤銷工作階段並移除主要租戶資料；備份隨輪替移除，有限的匿名稽核證明可能保留。</li><li>中英文告知內容以意義一致為原則；適用文件以註冊或結帳時同意並記錄的版本為準。</li></ul>`],
    ],
    providers: "第三方處理者與服務地區",
    providerNote: "第三方服務可能在台灣以外地區處理資料。我們會把傳送範圍限制在服務所需，並依服務條款與適用規範管理。重大安全事件將在評估後依法律要求通知。",
    contact: "聯絡方式",
    footer: "基本營運告知",
  };
  const ids = ["overview", "terms", "privacy", "ai", "billing", "dpa", "rights"];
  const providers = [["Render", english ? "Web and API hosting" : "網站與 API 託管"], ["Supabase / PostgreSQL", english ? "Production database" : "正式資料庫"], ["OpenAI", english ? "AI report processing" : "AI 報告內容處理"], ["Resend", english ? "Transactional and delivery email" : "交易與交付 Email"], ["ECPay", english ? "Payment processing when enabled" : "正式啟用後的付款處理"], ["GitHub Actions", english ? "Deployment checks and encrypted backups" : "部署檢查與加密備份"]];
  return `<!doctype html><html lang="${copy.lang}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${copy.title} | AgencyReport AI</title><meta name="description" content="${copy.description}" /><link rel="canonical" href="${publicOrigin()}/legal${english ? "?lang=en" : ""}" /><link rel="alternate" hreflang="zh-Hant" href="${publicOrigin()}/legal" /><link rel="alternate" hreflang="en" href="${publicOrigin()}/legal?lang=en" /><style>:root{color-scheme:light;--ink:#10201f;--muted:#5c6d69;--line:#d8e3df;--brand:#0f766e}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:#f4f7f6}a{color:var(--brand)}header{background:#082f2d;color:#fff}.inner,main{max-width:1120px;margin:auto}.inner{padding:42px 24px}.top{display:flex;justify-content:space-between;gap:16px}.brand{font-weight:850}.switch{color:#d8fffa;font-weight:750}.eyebrow{margin-top:28px;color:#7ee7d7;font-size:12px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.status{display:inline-flex;padding:7px 10px;border:1px solid #c9a84a;border-radius:999px;background:#493c13;color:#fff4c3;font-size:13px;font-weight:800}h1{max-width:820px;margin:14px 0 0;font-size:clamp(32px,5vw,54px);line-height:1.08}header p{max-width:820px;color:#cbe0dc;line-height:1.7}main{display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;padding:28px 24px 60px}nav{position:sticky;top:20px;align-self:start;padding:18px;border:1px solid var(--line);border-radius:8px;background:#fff}nav strong,nav a{display:block}nav a{padding:8px 0;color:#42534f;text-decoration:none;font-size:14px}article{min-width:0;padding:34px;border:1px solid var(--line);border-radius:8px;background:#fff;box-shadow:0 18px 50px rgba(15,23,42,.07)}section+section{padding-top:18px;border-top:1px solid var(--line)}h2{margin:22px 0 10px;font-size:24px}h3{margin:18px 0 8px;font-size:17px}p,li{color:var(--muted);line-height:1.75}li+li{margin-top:7px}.notice{padding:15px;border:1px solid #ead395;border-radius:8px;background:#fff8e7}.providers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.provider{padding:13px;border:1px solid var(--line);border-radius:8px;background:#fbfdfc}.provider span{display:block;margin-top:4px;color:var(--muted);font-size:13px}footer{margin-top:26px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}@media(max-width:760px){.inner{padding:32px 20px}.top{flex-direction:column}main{grid-template-columns:1fr;padding:18px 14px 40px}nav{position:static}article{padding:22px}.providers{grid-template-columns:1fr}}</style></head><body><header><div class="inner"><div class="top"><span class="brand">AgencyReport AI by Virtual Trend Works</span><a class="switch" href="${copy.switchHref}">${copy.switchLabel}</a></div><p class="eyebrow">${copy.eyebrow} · ${escapeHtml(legalVersion)}</p><span class="status">${copy.status}</span><h1>${copy.title}</h1><p>${copy.intro}</p></div></header><main><nav aria-label="${copy.contents}"><strong>${copy.contents}</strong>${copy.nav.map((label, index) => `<a href="#${ids[index]}">${label}</a>`).join("")}</nav><article><p class="notice"><strong>${english ? "Important:" : "重要："}</strong> ${copy.notice}</p>${copy.sections.map(([title, body], index) => `<section id="${ids[index]}"><h2>${title}</h2>${body}${index === 5 ? `<h3>${copy.providers}</h3><div class="providers">${providers.map(([name, purpose]) => `<div class="provider"><strong>${name}</strong><span>${purpose}</span></div>`).join("")}</div><p>${copy.providerNote}</p>` : ""}${index === 6 ? `<p><strong>${copy.contact}：</strong><a href="mailto:support@virtualtrendworks.com">support@virtualtrendworks.com</a><br /><strong>Website：</strong><a href="${publicOrigin()}">${publicOrigin()}</a></p>` : ""}</section>`).join("")}<footer>${english ? "Policy version" : "文件版本"}：${escapeHtml(legalVersion)} · ${copy.footer}</footer></article></main></body></html>`;
}
async function quoteHtml(token, nonce) {
  const db = await readDb();
  const quote = db.billing_intents.find((item) => item.id === token || item.token === token);
  if (!quote) return null;
  const amount = Number(quote.amount || 0).toLocaleString("zh-TW");
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgencyReport AI Quote</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10201f;background:#f6f8f7}
    main{max-width:860px;margin:0 auto;padding:42px 20px}
    article{background:#fff;border:1px solid #d9e3df;border-radius:8px;padding:28px;box-shadow:0 18px 50px rgba(15,23,42,.08)}
    h1{margin:0 0 8px;font-size:30px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#117c72}
    .amount{font-size:42px;font-weight:880;color:#0f766e;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}
    .card{border:1px solid #d9e3df;border-radius:8px;padding:14px;background:#fbfdfc}.card span{display:block;color:#60706d;font-size:12px;font-weight:800}.card strong{font-size:18px}
    a.button,button.button{display:inline-block;margin-top:14px;padding:12px 16px;border:0;border-radius:8px;background:#117c72;color:#fff;text-decoration:none;font-weight:800;cursor:pointer}
    button.button[disabled]{cursor:not-allowed;opacity:.68}.status{margin-top:14px;padding:12px;border:1px solid #d9e3df;border-radius:8px;background:#fbfdfc;color:#60706d}.status.ok{border-color:#9ed4ca;background:#eefbf8;color:#0f766e}
    p,li{color:#60706d;line-height:1.7}@media(max-width:640px){.grid{grid-template-columns:1fr}.amount{font-size:34px}}
  </style>
</head>
<body>
  <main>
    <article>
      <p class="eyebrow">AgencyReport AI Quote · ${escapeHtml(quote.id)}</p>
      <h1>${escapeHtml(quote.accountName || "Agency")} 服務報價確認</h1>
      <p>這是一份付款前確認頁，可替換為 Stripe、綠界、藍新或正式金流連結。</p>
      <div class="amount">${escapeHtml(quote.currency || "TWD")} ${amount}</div>
      <div class="grid">
        <div class="card"><span>方案</span><strong>${escapeHtml(quote.plan || "starter")}</strong></div>
        <div class="card"><span>狀態</span><strong>${escapeHtml(quote.status || "draft")}</strong></div>
        <div class="card"><span>帳號 Email</span><strong>${escapeHtml(quote.accountEmail || "-")}</strong></div>
        <div class="card"><span>建立時間</span><strong>${escapeHtml(quote.createdAt || "-")}</strong></div>
      </div>
      <h2>下一步</h2>
      <ul><li>確認方案、金額與服務範圍。</li><li>正式上線前請替換為真實金流付款頁。</li><li>付款後代理商可啟用自動報告、客戶入口與交付流程。</li></ul>
      <a class="button" href="/legal" target="_blank" rel="noreferrer">查看條款與隱私</a>
      <button class="button" id="acceptQuoteBtn" type="button" ${quote.status === "accepted" ? "disabled" : ""}>${quote.status === "accepted" ? "已接受報價" : "接受報價"}</button>
      <div class="status ${quote.status === "accepted" ? "ok" : ""}" id="quoteStatus">${quote.status === "accepted" ? `已於 ${escapeHtml(quote.acceptedAt || "-")} 接受。` : "接受後，代理商會收到可追蹤的 quote accepted 紀錄。"}</div>
    </article>
  </main>
  <script nonce="${escapeHtml(nonce)}">
    const token = ${JSON.stringify(quote.token || token)};
    const button = document.querySelector("#acceptQuoteBtn");
    const statusBox = document.querySelector("#quoteStatus");
    button?.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "處理中...";
      try {
        const response = await fetch("/api/billing/quote/accept", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, legalVersion: ${JSON.stringify(legalVersion)} })
        });
        if (!response.ok) throw new Error("Accept failed");
        const data = await response.json();
        button.textContent = "已接受報價";
        statusBox.className = "status ok";
        statusBox.textContent = "已於 " + (data.item.acceptedAt || new Date().toISOString()) + " 接受。";
      } catch (error) {
        button.disabled = false;
        button.textContent = "接受報價";
        statusBox.className = "status";
        statusBox.textContent = "接受失敗，請稍後再試或聯繫代理商。";
      }
    });
  </script>
</body>
</html>`;
}

async function invoiceHtml(token) {
  const db = await readDb();
  const invoice = db.invoices.find((item) => item.id === token || item.token === token || item.invoiceNumber === token || item.quoteToken === token);
  if (!invoice) return null;
  if (!invoice.id) invoice.id = invoice.token || token;
  if (!invoice.invoiceNumber) invoice.invoiceNumber = invoice.id;
  const amount = Number(invoice.amount || 0).toLocaleString("zh-TW");
  const invoiceLabel = invoice.invoiceNumber || invoice.id || invoice.token || "Invoice";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgencyReport AI Invoice</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10201f;background:#f6f8f7}
    main{max-width:860px;margin:0 auto;padding:42px 20px}
    article{background:#fff;border:1px solid #d9e3df;border-radius:8px;padding:28px;box-shadow:0 18px 50px rgba(15,23,42,.08)}
    h1{margin:0 0 8px;font-size:30px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#117c72}
    .amount{font-size:42px;font-weight:880;color:#0f766e;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}
    .card{border:1px solid #d9e3df;border-radius:8px;padding:14px;background:#fbfdfc}.card span{display:block;color:#60706d;font-size:12px;font-weight:800}.card strong{font-size:18px}
    a.button,button.button{display:inline-block;margin-top:14px;padding:12px 16px;border:0;border-radius:8px;background:#117c72;color:#fff;text-decoration:none;font-weight:800;cursor:pointer}
    button.button[disabled]{cursor:not-allowed;opacity:.68}.status{margin-top:14px;padding:12px;border:1px solid #d9e3df;border-radius:8px;background:#fbfdfc;color:#60706d}.status.ok{border-color:#9ed4ca;background:#eefbf8;color:#0f766e}
    p,li{color:#60706d;line-height:1.7}@media(max-width:640px){.grid{grid-template-columns:1fr}.amount{font-size:34px}}
  </style>
</head>
<body>
  <main>
    <article>
      <p class="eyebrow">AgencyReport AI Invoice · ${escapeHtml(invoice.invoiceNumber || invoice.id)}</p>
      <h1>${escapeHtml(invoice.accountName || "Agency")} 發票草稿</h1>
      <p>此頁為 MVP 發票確認頁，可在正式上線時替換為會計系統、金流或電子發票服務。</p>
      <div class="amount">${escapeHtml(invoice.currency || "TWD")} ${amount}</div>
      <div class="grid">
        <div class="card"><span>Invoice</span><strong>${invoiceLabel}</strong></div>
        <div class="card"><span>狀態</span><strong>${escapeHtml(invoice.status || "draft")}</strong></div>
        <div class="card"><span>方案</span><strong>${escapeHtml(invoice.plan || "-")}</strong></div>
        <div class="card"><span>到期日</span><strong>${escapeHtml(invoice.dueAt || "-")}</strong></div>
        <div class="card"><span>帳號 Email</span><strong>${escapeHtml(invoice.accountEmail || "-")}</strong></div>
        <div class="card"><span>Quote</span><strong>${escapeHtml(invoice.quoteToken || invoice.quoteId || "-")}</strong></div>
      </div>
      <h2>付款前確認</h2>
      <ul><li>請確認方案、金額、到期日與服務範圍。</li><li>正式上線前請串接真實付款、發票與會計流程。</li><li>付款完成後即可啟用客戶入口、自動報告與交付流程。</li></ul>
      <a class="button" href="/legal" target="_blank" rel="noreferrer">查看條款與隱私</a>
      <div class="status ${invoice.status === "paid" ? "ok" : ""}" id="invoicePayStatus">${invoice.status === "paid" ? `已於 ${escapeHtml(invoice.paidAt || "-")} 由金流回調確認付款。` : "付款狀態將由綠界安全回調更新，無需在此頁手動確認。"}</div>
    </article>
  </main>
</body>
</html>`;
}

async function clientReportHtml(token) {
  const db = await readDb();
  const link = db.share_links.find((item) => item.token === token || item.id === token);
  if (!link) return null;
  const report =
    link.reportSnapshot ||
    db.reports.find((item) => item.id === link.reportId) ||
    [...db.reports].reverse().find((item) => item.clientName === link.clientName) ||
    {};
  const metrics = report.metrics || {};
  const channels = Array.isArray(report.channels) ? report.channels.slice(0, 8) : [];
  const currency = report.currency || link.currency || "TWD";
  const score = report.score || link.score || "-";
  const generatedAt = report.createdAt || link.createdAt || new Date().toISOString();
  const downloadUrl = `/client/report/${encodeURIComponent(token)}/download`;
  const rows = channels.length
    ? channels
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.channel || "-")}</td>
            <td>${formatMoneyValue(row.spend, currency)}</td>
            <td>${Number(row.clicks || 0).toLocaleString("zh-TW")}</td>
            <td>${Number(row.conversions || 0).toLocaleString("zh-TW")}</td>
            <td>${Number(row.roas || 0).toFixed(2)}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="5">No channel snapshot available yet.</td></tr>`;
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(link.clientName || report.clientName || "Client")} Report</title>
  <style>
    body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10201f;background:#f6f8f7}
    main{max-width:1040px;margin:0 auto;padding:36px 18px}
    .toolbar{position:sticky;top:0;z-index:2;display:flex;justify-content:flex-end;gap:10px;margin:-18px 0 22px;padding:12px 0;background:rgba(246,248,247,.94);backdrop-filter:blur(10px)}
    button,a.button{border:1px solid #cbd8d4;border-radius:7px;padding:10px 13px;color:#10201f;background:#fff;font:inherit;font-size:13px;font-weight:800;text-decoration:none;cursor:pointer}
    button.primary,a.button.primary{border-color:#117c72;color:#fff;background:#117c72}
    header{display:grid;gap:8px;margin-bottom:22px}
    .eyebrow{color:#117c72;font-size:12px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
    h1{margin:0;font-size:32px;line-height:1.1} p{color:#60706d;line-height:1.65}
    .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}
    .card,section{border:1px solid #d9e3df;border-radius:8px;background:#fff;box-shadow:0 12px 36px rgba(15,23,42,.06)}
    .card{padding:16px}.card span{display:block;margin-bottom:8px;color:#60706d;font-size:12px;font-weight:800;text-transform:uppercase}.card strong{font-size:23px;color:#0d5b55}
    section{padding:18px;margin-top:14px}h2{margin:0 0 12px;font-size:18px}
    table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:11px;border-bottom:1px solid #e5ece9;text-align:left}th{color:#60706d;font-size:12px;text-transform:uppercase}
    .status{display:inline-flex;border:1px solid rgba(17,124,114,.22);border-radius:999px;padding:6px 10px;color:#0d5b55;background:rgba(17,124,114,.08);font-size:12px;font-weight:850}
    @media (max-width:760px){.toolbar{position:static;justify-content:stretch;flex-direction:column}.grid{grid-template-columns:1fr}h1{font-size:26px}table{font-size:13px}}
    @media print{body{background:#fff}.toolbar{display:none}main{max-width:none;padding:0}.card,section{box-shadow:none;break-inside:avoid}a{color:inherit;text-decoration:none}}
  </style>
</head>
<body>
  <main>
    <nav class="toolbar" aria-label="Report actions">
      <button type="button" onclick="window.print()">Print / Save PDF</button>
      <a class="button primary" href="${downloadUrl}">Download HTML</a>
    </nav>
    <header>
      <span class="eyebrow">${escapeHtml(link.agencyName || report.agencyName || "AgencyReport AI")}</span>
      <h1>${escapeHtml(link.clientName || report.clientName || "Client")} ${escapeHtml(report.reportType || link.reportType || "Marketing")} Report</h1>
      <p>${escapeHtml(report.reportMonth || link.reportMonth || "")} · Generated ${escapeHtml(generatedAt)} · <span class="status">${escapeHtml(link.status || "active")}</span></p>
    </header>
    <div class="grid">
      <div class="card"><span>Health Score</span><strong>${escapeHtml(score)}</strong></div>
      <div class="card"><span>Total Spend</span><strong>${formatMoneyValue(metrics.spend, currency)}</strong></div>
      <div class="card"><span>Revenue</span><strong>${formatMoneyValue(metrics.revenue, currency)}</strong></div>
      <div class="card"><span>ROAS</span><strong>${Number(metrics.roas || 0).toFixed(2)}</strong></div>
    </div>
    <section>
      <h2>Channel Snapshot</h2>
      <table>
        <thead><tr><th>Channel</th><th>Spend</th><th>Clicks</th><th>Conversions</th><th>ROAS</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <section>
      <h2>Review Note</h2>
      <p>This report is a reviewed delivery snapshot. Figures should be matched against the original ad platforms before financial decisions are made.</p>
    </section>
  </main>
</body>
</html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readAnyBody(req) {
  const raw = await readRawBody(req);
  if (!raw) return {};
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid request body");
  }
}

function definedFields(payload = {}) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function withId(payload) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...definedFields(payload),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoneyValue(amount, currency = "TWD") {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function missingEcpaySettings() {
  const missing = [];
  if (paymentProvider !== "ecpay") missing.push("PAYMENT_PROVIDER=ecpay");
  if (!ecpayMerchantId) missing.push("ECPAY_MERCHANT_ID");
  if (!ecpayHashKey) missing.push("ECPAY_HASH_KEY");
  if (!ecpayHashIv) missing.push("ECPAY_HASH_IV");
  if (!ecpayReturnUrl) missing.push("ECPAY_RETURN_URL or APP_BASE_URL");
  if (!ecpayOrderResultUrl) missing.push("ECPAY_ORDER_RESULT_URL or APP_BASE_URL");
  if (!ecpayClientBackUrl) missing.push("ECPAY_CLIENT_BACK_URL or APP_BASE_URL");
  return missing;
}

function missingStripeSettings() {
  const missing = [];
  if (paymentProvider !== "stripe") missing.push("PAYMENT_PROVIDER=stripe");
  if (!stripeSecretKey) missing.push("STRIPE_SECRET_KEY");
  if (!stripeSuccessUrl) missing.push("STRIPE_SUCCESS_URL");
  if (!stripeCancelUrl) missing.push("STRIPE_CANCEL_URL");
  if (!stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  return missing;
}

function googleTagHead() {
  const measurementId = escapeHtml(googleAnalyticsMeasurementId);
  return `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
  <script src="/gtag-init.js"></script>`;
}

function injectGoogleTag(html) {
  if (!html || html.includes("googletagmanager.com/gtag/js")) return html;
  return html.replace("<head>", `<head>\n  ${googleTagHead()}`);
}

function mockPaymentsAllowed() {
  if (process.env.ALLOW_MOCK_PAYMENTS === "true") return true;
  if (process.env.NODE_ENV === "production") return false;
  if (!appBaseUrl) return true;
  try {
    const hostname = new URL(appBaseUrl).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function paymentStatus() {
  const stripeReady = Boolean(stripeSecretKey && stripeSuccessUrl && stripeCancelUrl);
  const ecpayReady = Boolean(ecpayMerchantId && ecpayHashKey && ecpayHashIv && ecpayReturnUrl && ecpayOrderResultUrl);
  const liveReady = (
    (paymentProvider === "stripe" && stripeReady && Boolean(stripeWebhookSecret)) ||
    (paymentProvider === "ecpay" && ecpayReady)
  );
  const missing = paymentProvider === "stripe" ? missingStripeSettings() : missingEcpaySettings();
  return {
    provider: paymentProvider,
    mode: liveReady ? "live-ready" : paymentProvider === "mock" ? "mock" : "needs_credentials",
    launchGate: liveReady ? "ready" : "post-launch-review",
    webhookReady: paymentProvider === "stripe" ? Boolean(stripeWebhookSecret) : paymentProvider === "ecpay" ? ecpayReady : false,
    checkoutEnabled: liveReady || mockPaymentsAllowed(),
    checkoutUrl: paymentProvider === "ecpay" ? ecpayCheckoutUrl : undefined,
    missing,
  };
}

function ecpayReady() {
  return Boolean(ecpayMerchantId && ecpayHashKey && ecpayHashIv && ecpayReturnUrl && ecpayOrderResultUrl);
}

function ecpayEncode(value) {
  return encodeURIComponent(String(value))
    .toLowerCase()
    .replaceAll("%20", "+")
    .replaceAll("'", "%27")
    .replaceAll("~", "%7e")
    .replaceAll("%2d", "-")
    .replaceAll("%5f", "_")
    .replaceAll("%2e", ".")
    .replaceAll("%21", "!")
    .replaceAll("%2a", "*")
    .replaceAll("%28", "(")
    .replaceAll("%29", ")");
}

function ecpayCheckMacValue(payload) {
  const entries = Object.entries(payload)
    .filter(([key, value]) => key !== "CheckMacValue" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const raw = `HashKey=${ecpayHashKey}&${entries.map(([key, value]) => `${key}=${value}`).join("&")}&HashIV=${ecpayHashIv}`;
  return crypto.createHash("sha256").update(ecpayEncode(raw)).digest("hex").toUpperCase();
}

function verifyEcpayCheckMacValue(payload) {
  if (!payload?.CheckMacValue || !ecpayHashKey || !ecpayHashIv) return false;
  return safeSecretEquals(String(payload.CheckMacValue).toUpperCase(), ecpayCheckMacValue(payload));
}

async function validateEcpayCallback(payload) {
  if (String(payload.MerchantID || "") !== ecpayMerchantId) return false;
  const db = await readDb();
  const intent = db.billing_intents.find((item) =>
    item.token === payload.CustomField1
    && item.ecpayMerchantTradeNo === payload.MerchantTradeNo
  );
  if (!intent) return false;
  return Math.round(Number(intent.amount || 0)) === Math.round(Number(payload.TradeAmt || 0));
}

function ecpayTradeNo(token) {
  return `AR${String(token || crypto.randomBytes(6).toString("hex")).replace(/[^A-Za-z0-9]/g, "").slice(0, 18)}`.slice(0, 20);
}

function ecpayTradeDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function ecpayPayloadForIntent(intent) {
  const token = intent.token || crypto.randomBytes(10).toString("hex");
  const tradeNo = intent.ecpayMerchantTradeNo || ecpayTradeNo(token);
  const amount = Math.max(1, Math.round(Number(intent.amount || planPrices[normalizePlan(intent.plan)]?.TWD || planPrices.starter.TWD)));
  const payload = {
    MerchantID: ecpayMerchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: intent.ecpayMerchantTradeDate || ecpayTradeDate(),
    PaymentType: "aio",
    TotalAmount: amount,
    TradeDesc: `AgencyReport AI ${normalizePlan(intent.plan)}`,
    ItemName: `AgencyReport AI ${normalizePlan(intent.plan)} monthly plan`,
    ReturnURL: ecpayReturnUrl,
    ChoosePayment: "ALL",
    ClientBackURL: ecpayClientBackUrl || appBaseUrl || "",
    OrderResultURL: ecpayOrderResultUrl,
    CustomField1: token,
    CustomField2: intent.accountEmail || "",
    CustomField3: normalizePlan(intent.plan),
    EncryptType: 1,
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });
  payload.CheckMacValue = ecpayCheckMacValue(payload);
  return payload;
}

function autoSubmitForm(action, fields, nonce) {
  const inputs = Object.entries(fields).map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}" />`).join("");
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to ECPay</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#071b1b;color:#f8fafc}
    main{max-width:520px;padding:28px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.06)}
    h1{margin:0 0 8px;font-size:24px}p{color:#b8c7c4;line-height:1.7}.button{display:inline-block;margin-top:12px;padding:12px 16px;border:0;border-radius:8px;background:#12b3a8;color:white;font-weight:800;cursor:pointer}
  </style>
</head>
<body>
  <main>
    <h1>&#27491;&#22312;&#21069;&#24448;&#32160;&#30028;&#20184;&#27454;</h1>
    <p>&#31995;&#32113;&#27491;&#22312;&#24314;&#31435;&#23433;&#20840;&#20184;&#27454;&#34920;&#21934;&#65292;&#33509;&#27794;&#26377;&#33258;&#21205;&#36339;&#36681;&#65292;&#35531;&#25353;&#19979;&#26041;&#25353;&#37397;&#32380;&#32396;&#12290;</p>
    <form method="post" action="${escapeHtml(action)}">
      ${inputs}
      <button class="button" type="submit">&#21069;&#24448;&#20184;&#27454;</button>
    </form>
  </main>
  <script nonce="${escapeHtml(nonce)}">document.forms[0].submit();</script>
</body>
</html>`;
}

function safeSecretEquals(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isLocalRequest(req) {
  const address = req.socket?.remoteAddress || "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function hasTrustedPaymentSignal(req, payload = {}) {
  const headerSecret = req.headers["x-agency-webhook-secret"] || req.headers["x-worker-secret"];
  const bodySecret = payload.webhookSecret || payload.secret || "";
  if (stripeWebhookSecret) return safeSecretEquals(headerSecret || bodySecret, stripeWebhookSecret);
  return paymentProvider === "mock" && isLocalRequest(req);
}

async function databaseReadiness() {
  if (!databaseUrl) return { ok: false, detail: "Set DATABASE_URL to PostgreSQL before paid launch." };
  try {
    const pool = await postgresPool();
    await migrateLegacyStore(pool);
    const result = await pool.query("select value from agencyreport_metadata where key = 'schema_version'");
    const version = Number(result.rows[0]?.value || 0);
    const count = await pool.query("select count(*)::int as count from agencyreport_records");
    return {
      ok: version >= postgresSchemaVersion,
      detail: version >= postgresSchemaVersion
        ? `PostgreSQL reachable; normalized schema v${version}; ${count.rows[0].count} records.`
        : "PostgreSQL is reachable but normalized schema migration is incomplete.",
    };
  } catch (error) {
    return { ok: false, detail: `PostgreSQL check failed: ${error.message}` };
  }
}

async function readinessReport() {
  const payment = paymentStatus();
  const paymentOk = payment.mode === "live-ready" && payment.webhookReady;
  const database = await databaseReadiness();
  const ai = aiStatus();
  const backupReady = Boolean(process.env.BACKUP_POLICY_URL || process.env.BACKUP_ENABLED);
  const monitoringReady = Boolean(process.env.SENTRY_DSN || process.env.MONITORING_URL);
  const connectorDeployment = connectorDeploymentStatus();
  const checks = [
    {
      id: "database",
      label: "Production database",
      ok: database.ok,
      required: true,
      detail: database.detail,
    },
    {
      id: "auth",
      label: "Auth sessions",
      ok: true,
      required: true,
      detail: "Password auth, HttpOnly browser sessions, and hashed server tokens are enabled.",
    },
    {
      id: "ai",
      label: "AI provider",
      ok: ai.configured && ai.runtimeStatus !== "degraded",
      required: true,
      detail: !ai.configured
        ? "Set OPENAI_API_KEY or AI_API_KEY for live AI drafts."
        : ai.runtimeStatus === "degraded"
          ? `${aiProvider} is configured but the last live request failed (${ai.lastErrorCode}).`
          : `${aiProvider} configured; runtime status ${ai.runtimeStatus}.`,
    },
    {
      id: "email",
      label: "Email provider",
      ok: emailStatus().ready,
      required: true,
      detail: emailStatus().ready
        ? `${emailProvider} email configured with a production sender.`
        : "Set Resend credentials and EMAIL_FROM on a verified custom domain; onboarding@resend.dev and example domains are not production-ready.",
    },
    {
      id: "worker",
      label: "Worker security",
      ok: Boolean(workerSecret),
      required: true,
      detail: workerSecret ? "WORKER_SECRET configured." : "Set WORKER_SECRET before exposing /api/worker/run.",
    },
    {
      id: "payment",
      label: "Payment provider",
      ok: paymentOk,
      required: false,
      detail: paymentOk
        ? `${paymentProvider} checkout and verified return flow configured.`
        : "Payment is tracked as a post-launch review item because ECPay production review requires a public live URL.",
    },
    {
      id: "connectors",
      label: "Data connectors",
      ok: connectorDeployment.allReady,
      required: false,
      detail: connectorDeployment.allReady
        ? `GA4, Google Ads, and Meta Ads OAuth are production-ready (${googleAdsApiVersion}, ${metaGraphVersion}).`
        : `Direct connectors are not production-ready. Missing: ${connectorDeployment.missing.join(", ")}. Manual CSV and secure public Google Sheets import remain available.`,
    },
    {
      id: "legal",
      label: "Basic legal notice",
      ok: true,
      required: false,
      detail: `${legalVersion} bilingual terms, privacy, and AI notice are published; external counsel review is not a launch gate.`,
    },
    {
      id: "backup",
      label: "Backup policy",
      ok: backupReady,
      required: false,
      detail: backupReady
        ? "Encrypted backup policy and restore-drill automation are configured."
        : "Set BACKUP_POLICY_URL or BACKUP_ENABLED after choosing the production database provider.",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      ok: monitoringReady,
      required: false,
      detail: monitoringReady
        ? "Production health monitoring is configured."
        : "Set SENTRY_DSN or MONITORING_URL for error and uptime monitoring.",
    },
  ];
  const required = checks.filter((item) => item.required);
  const score = Math.round((checks.filter((item) => item.ok).length / checks.length) * 100);
  const requiredReady = required.every((item) => item.ok);
  return {
    ready: requiredReady,
    score,
    requiredReady,
    missingRequired: required.filter((item) => !item.ok).map((item) => item.id),
    warnings: checks.filter((item) => !item.ok && !item.required).map((item) => item.id),
    checks,
  };
}

function amountInSmallestUnit(amount, currency) {
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  const normalized = String(currency || "TWD").toLowerCase();
  const value = Number(amount || 0);
  return Math.max(0, Math.round(value * (zeroDecimal.has(normalized) ? 1 : 100)));
}

function formEncode(payload) {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  return params;
}

async function createPaymentSession(payload) {
  const currency = String(payload.currency || "TWD").toLowerCase();
  const amount = Number(payload.amount || planPrices[payload.plan]?.[payload.currency || "TWD"] || planPrices.starter.TWD);
  const token = payload.token || crypto.randomBytes(10).toString("hex");
  const localQuoteUrl = `/billing/quote/${token}`;
  if (paymentProvider === "stripe" && stripeSecretKey && stripeSuccessUrl && stripeCancelUrl) {
    const body = formEncode({
      mode: "payment",
      success_url: `${stripeSuccessUrl}${stripeSuccessUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`,
      cancel_url: `${stripeCancelUrl}${stripeCancelUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`,
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": amountInSmallestUnit(amount, currency),
      "line_items[0][price_data][product_data][name]": `AgencyReport AI ${payload.plan || "starter"}`,
      "metadata[token]": token,
      "metadata[clientName]": payload.clientName || "",
      "metadata[accountEmail]": payload.accountEmail || "",
    });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${stripeSecretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || `Stripe returned ${response.status}`);
    return {
      token,
      amount,
      currency: currency.toUpperCase(),
      provider: "stripe",
      paymentStatus: "checkout_created",
      checkoutSessionId: data.id,
      checkoutUrl: data.url,
      quoteUrl: localQuoteUrl,
    };
  }
  if (paymentProvider === "ecpay" && ecpayReady()) {
    const tradeNo = ecpayTradeNo(token);
    return {
      token,
      amount,
      currency: "TWD",
      provider: "ecpay",
      paymentStatus: "checkout_created",
      checkoutSessionId: tradeNo,
      checkoutUrl: `/billing/ecpay/checkout/${encodeURIComponent(token)}`,
      quoteUrl: localQuoteUrl,
      ecpayMerchantTradeNo: tradeNo,
      ecpayMerchantTradeDate: ecpayTradeDate(),
    };
  }
  return {
    token,
    amount,
    currency: currency.toUpperCase(),
    provider: "mock",
    paymentStatus: "mock_checkout",
    checkoutSessionId: `mock-${token}`,
    checkoutUrl: `/billing/mock-checkout?plan=${encodeURIComponent(payload.plan || "starter")}&token=${encodeURIComponent(token)}`,
    quoteUrl: localQuoteUrl,
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password || ""), salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), candidate);
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function compactPayload(payload) {
  return {
    agencyName: payload.agencyName || "",
    clientName: payload.clientName || "",
    reportType: payload.reportType || "",
    reportMonth: payload.reportMonth || "",
    request: payload.request || payload.clientRequest || "",
    kpis: Array.isArray(payload.kpis) ? payload.kpis : [],
    dataNeeds: Array.isArray(payload.dataNeeds) ? payload.dataNeeds : [],
    tone: payload.tone || "professional",
    metrics: payload.metrics && typeof payload.metrics === "object" ? payload.metrics : {},
    bestChannel: payload.bestChannel && typeof payload.bestChannel === "object" ? payload.bestChannel : null,
    weakChannel: payload.weakChannel && typeof payload.weakChannel === "object" ? payload.weakChannel : null,
    channels: Array.isArray(payload.channels) ? payload.channels.slice(0, 8) : [],
  };
}

function fallbackAiDraft(payload) {
  const data = compactPayload(payload);
  const kpis = data.kpis.length ? data.kpis : ["CPA", "ROAS", "Conversions"];
  const clientName = data.clientName || "client";
  return {
    provider: "fallback",
    model: "rules",
    summary: `AI draft generated for ${clientName} with KPI focus: ${kpis.join(", ")}.`,
    risks: [
      "Confirm data freshness before delivery.",
      "Review budget shifts before sending to the client.",
      "Validate tracking and attribution before presenting strategic conclusions.",
    ],
    nextActions: [
      "Approve PM draft.",
      "Create delivery record.",
      "Schedule next recurring run.",
    ],
    clientReplyDraft: `Hi ${clientName}, we prepared the reporting structure and will focus on ${kpis.join(", ")}. Next we will verify the source data, highlight budget changes, and send a reviewed report draft.`,
    reportOutline: [
      "Executive KPI summary",
      "Channel performance diagnosis",
      "Budget and conversion opportunities",
      "Next-month action plan",
    ],
    dataChecks: data.dataNeeds.length ? data.dataNeeds : ["Spend", "Conversions", "Revenue", "Landing page results"],
    automationPlan: ["Refresh source data", "Generate analysis draft", "Queue PM review", "Prepare client delivery"],
    confidence: 0.72,
  };
}

function parseAiJson(content) {
  const raw = String(content || "").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function normalizeAiDraft(payload, draft, source) {
  const fallback = fallbackAiDraft(payload);
  return {
    provider: draft.provider || source.provider || fallback.provider,
    model: draft.model || source.model || fallback.model,
    summary: draft.summary || fallback.summary,
    risks: Array.isArray(draft.risks) && draft.risks.length ? draft.risks : fallback.risks,
    nextActions: Array.isArray(draft.nextActions) && draft.nextActions.length ? draft.nextActions : fallback.nextActions,
    clientReplyDraft: draft.clientReplyDraft || fallback.clientReplyDraft,
    reportOutline: Array.isArray(draft.reportOutline) && draft.reportOutline.length ? draft.reportOutline : fallback.reportOutline,
    dataChecks: Array.isArray(draft.dataChecks) && draft.dataChecks.length ? draft.dataChecks : fallback.dataChecks,
    automationPlan: Array.isArray(draft.automationPlan) && draft.automationPlan.length ? draft.automationPlan : fallback.automationPlan,
    confidence: Number.isFinite(Number(draft.confidence)) ? Number(draft.confidence) : fallback.confidence,
  };
}

async function callOpenAiCompatible(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const body = {
    model: aiModel,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior marketing agency strategist and reporting automation architect. Return only valid JSON with keys: summary, risks, nextActions, clientReplyDraft, reportOutline, dataChecks, automationPlan, confidence.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Create a client-ready AI reporting draft from this agency intake. Keep it specific, practical, and review-safe.",
          input: compactPayload(payload),
        }),
      },
    ],
  };
  try {
    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error?.message || `AI provider returned ${response.status}`;
      const providerError = new Error(message);
      providerError.status = response.status;
      providerError.code = data.error?.code || data.error?.type || `http_${response.status}`;
      throw providerError;
    }
    const content = data.choices?.[0]?.message?.content || "";
    return normalizeAiDraft(payload, parseAiJson(content), { provider: aiProvider, model: aiModel });
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiDraft(payload) {
  if ((aiProvider === "openai" || aiProvider === "openai-compatible") && aiApiKey) {
    aiRuntime.lastAttemptAt = new Date().toISOString();
    try {
      const draft = await callOpenAiCompatible(payload);
      aiRuntime.status = "operational";
      aiRuntime.lastSuccessAt = new Date().toISOString();
      aiRuntime.lastErrorCode = null;
      return { ...draft, mode: "live" };
    } catch (error) {
      aiRuntime.status = "degraded";
      aiRuntime.lastFailureAt = new Date().toISOString();
      aiRuntime.lastErrorCode = classifyAiProviderError(error);
      return { ...fallbackAiDraft(payload), mode: "fallback", providerError: error.message };
    }
  }
  return { ...fallbackAiDraft(payload), mode: "fallback" };
}

function isWorkerAuthorized(req) {
  if (!workerSecret) return false;
  const headerSecret = req.headers["x-worker-secret"];
  if (typeof headerSecret !== "string" || headerSecret.length !== workerSecret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(headerSecret), Buffer.from(workerSecret));
}

function nextScheduleRun(schedule, from = new Date()) {
  const cadence = schedule.cadence || schedule.scheduleCadence || "monthly";
  const next = new Date(from);
  if (cadence === "weekly") next.setDate(next.getDate() + 7);
  else if (cadence === "daily") next.setDate(next.getDate() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next.toISOString();
}

function nextConnectorRun(source, from = new Date()) {
  const next = new Date(from);
  const cadence = source.syncCadence || "daily";
  if (cadence === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else if (cadence === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

function connectorEncryptionReady() {
  return connectorEncryptionSecret.length >= 32;
}

function connectorEncryptionKey() {
  if (!connectorEncryptionReady()) throw new Error("CONNECTOR_ENCRYPTION_KEY_REQUIRED");
  return crypto.createHash("sha256").update(connectorEncryptionSecret).digest();
}

function encryptConnectorValue(value, context) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", connectorEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(String(context || "connector")));
  const encrypted = Buffer.concat([cipher.update(String(value || ""), "utf8"), cipher.final()]);
  return {
    version: 1,
    algorithm: "aes-256-gcm",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: encrypted.toString("base64url"),
  };
}

function decryptConnectorValue(envelope, context) {
  if (!envelope || envelope.version !== 1 || envelope.algorithm !== "aes-256-gcm") throw new Error("CONNECTOR_SECRET_INVALID");
  const decipher = crypto.createDecipheriv("aes-256-gcm", connectorEncryptionKey(), Buffer.from(envelope.iv, "base64url"));
  decipher.setAAD(Buffer.from(String(context || "connector")));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function connectorOAuthConfig(type) {
  const normalized = normalizeConnectorType(type);
  const redirectUri = appBaseUrl ? `${appBaseUrl}/api/connectors/oauth/callback/${encodeURIComponent(normalized)}` : "";
  if (["ga4", "google_ads"].includes(normalized)) {
    return {
      provider: normalized,
      authorizationEndpoint: googleOAuthAuthorizationEndpoint,
      tokenEndpoint: googleOAuthTokenEndpoint,
      clientId: googleOAuthClientId,
      clientSecret: googleOAuthClientSecret,
      redirectUri,
      scopes: normalized === "ga4"
        ? ["https://www.googleapis.com/auth/analytics.readonly"]
        : ["https://www.googleapis.com/auth/adwords"],
      pkce: true,
    };
  }
  if (normalized === "meta_ads") {
    return {
      provider: normalized,
      authorizationEndpoint: metaOAuthAuthorizationEndpoint,
      tokenEndpoint: metaOAuthTokenEndpoint,
      clientId: metaAppId,
      clientSecret: metaAppSecret,
      redirectUri,
      scopes: ["ads_read", "business_management"],
      pkce: false,
    };
  }
  throw new Error("CONNECTOR_PROVIDER_UNSUPPORTED");
}

async function createConnectorOAuthAuthorization(ownerId, type) {
  const config = connectorOAuthConfig(type);
  if (!connectorEncryptionReady()) throw new Error("CONNECTOR_ENCRYPTION_KEY_REQUIRED");
  if (!appBaseUrl || !config.clientId || !config.clientSecret) throw new Error("CONNECTOR_OAUTH_NOT_CONFIGURED");
  const state = crypto.randomBytes(32).toString("base64url");
  const stateHash = hashSessionToken(state);
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const context = `${ownerId}:${config.provider}:oauth-state`;
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const now = new Date();
    db.oauth_states = (Array.isArray(db.oauth_states) ? db.oauth_states : [])
      .filter((item) => item.ownerId !== ownerId || item.provider !== config.provider || new Date(item.expiresAt) > now);
    db.oauth_states.push(withId({
      ownerId,
      provider: config.provider,
      stateHash,
      pkceVerifierEncrypted: encryptConnectorValue(verifier, context),
      redirectUri: config.redirectUri,
      status: "pending",
      expiresAt,
    }));
    db.audit_logs.push(withId({ action: "connector:oauth_started", ownerId, provider: config.provider }));
    await writeDb(db);
  });
  writeQueue = operation.catch(() => {});
  await operation;

  const authorizationUrl = new URL(config.authorizationEndpoint);
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scopes.join(" "));
  authorizationUrl.searchParams.set("state", state);
  if (config.pkce) {
    authorizationUrl.searchParams.set("code_challenge", challenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("prompt", "consent");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
  }
  return { provider: config.provider, authorizationUrl: authorizationUrl.toString(), expiresAt };
}

async function claimConnectorOAuthState(provider, rawState) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const stateHash = hashSessionToken(rawState);
    const index = db.oauth_states.findIndex((item) => item.provider === provider && item.stateHash === stateHash);
    if (index < 0) throw new Error("CONNECTOR_OAUTH_STATE_INVALID");
    const state = db.oauth_states[index];
    if (state.status !== "pending") throw new Error("CONNECTOR_OAUTH_STATE_REPLAYED");
    if (!state.expiresAt || new Date(state.expiresAt) <= new Date()) throw new Error("CONNECTOR_OAUTH_STATE_EXPIRED");
    const context = `${state.ownerId}:${state.provider}:oauth-state`;
    const verifier = decryptConnectorValue(state.pkceVerifierEncrypted, context);
    db.oauth_states[index] = { ...state, status: "processing", claimedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await writeDb(db);
    return { ...state, verifier };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function finishConnectorOAuthState(stateId, status, details = {}) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.oauth_states.findIndex((item) => item.id === stateId);
    if (index >= 0) {
      db.oauth_states[index] = {
        ...db.oauth_states[index],
        status,
        ...definedFields(details),
        pkceVerifierEncrypted: null,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await writeDb(db);
    }
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function storeConnectorCredential(state, tokenPayload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    db.connector_credentials = Array.isArray(db.connector_credentials) ? db.connector_credentials : [];
    const now = new Date().toISOString();
    const context = `${state.ownerId}:${state.provider}:credential`;
    const existingIndex = db.connector_credentials.findIndex((item) => item.ownerId === state.ownerId && item.provider === state.provider);
    const expiresIn = Number(tokenPayload.expires_in || 0);
    const credential = {
      ...(existingIndex >= 0 ? db.connector_credentials[existingIndex] : {}),
      ownerId: state.ownerId,
      provider: state.provider,
      status: "connected",
      tokenType: tokenPayload.token_type || "Bearer",
      scopes: String(tokenPayload.scope || "").split(/[ ,]+/).filter(Boolean),
      accessTokenEncrypted: encryptConnectorValue(tokenPayload.access_token, context),
      refreshTokenEncrypted: tokenPayload.refresh_token
        ? encryptConnectorValue(tokenPayload.refresh_token, context)
        : existingIndex >= 0 ? db.connector_credentials[existingIndex].refreshTokenEncrypted || null : null,
      providerPayloadEncrypted: encryptConnectorValue(JSON.stringify({
        idToken: tokenPayload.id_token || null,
        refreshTokenExpiresIn: tokenPayload.refresh_token_expires_in || null,
      }), context),
      expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      connectedAt: existingIndex >= 0 ? db.connector_credentials[existingIndex].connectedAt : now,
      updatedAt: now,
    };
    if (existingIndex >= 0) db.connector_credentials[existingIndex] = credential;
    else db.connector_credentials.push(withId(credential));
    const stored = existingIndex >= 0 ? db.connector_credentials[existingIndex] : db.connector_credentials[db.connector_credentials.length - 1];
    db.audit_logs.push(withId({ action: "connector:oauth_connected", ownerId: state.ownerId, provider: state.provider, recordId: stored.id }));
    await writeDb(db);
    return stored;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function exchangeConnectorAuthorizationCode(provider, code, rawState) {
  const config = connectorOAuthConfig(provider);
  const state = await claimConnectorOAuthState(config.provider, rawState);
  try {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: state.redirectUri,
    });
    if (config.pkce) {
      body.set("grant_type", "authorization_code");
      body.set("code_verifier", state.verifier);
    }
    const response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    let tokenPayload = await response.json().catch(() => ({}));
    if (!response.ok || !tokenPayload.access_token) throw new Error(`CONNECTOR_TOKEN_EXCHANGE_FAILED:${response.status}`);
    if (config.provider === "meta_ads") {
      const longLivedBody = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        fb_exchange_token: tokenPayload.access_token,
      });
      const longLivedResponse = await fetch(config.tokenEndpoint, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
        body: longLivedBody,
        signal: AbortSignal.timeout(15000),
      });
      const longLivedPayload = await longLivedResponse.json().catch(() => ({}));
      if (!longLivedResponse.ok || !longLivedPayload.access_token) throw new Error(`CONNECTOR_TOKEN_EXCHANGE_FAILED:${longLivedResponse.status}`);
      tokenPayload = { ...tokenPayload, ...longLivedPayload, refresh_token: null };
    }
    const credential = await storeConnectorCredential(state, tokenPayload);
    await finishConnectorOAuthState(state.id, "used", { credentialId: credential.id });
    return { ownerId: state.ownerId, provider: state.provider, credentialId: credential.id, status: "connected" };
  } catch (error) {
    await finishConnectorOAuthState(state.id, "failed", { errorCode: String(error.message || "CONNECTOR_TOKEN_EXCHANGE_FAILED").split(":")[0] });
    throw error;
  }
}

function publicConnectorCredential(item) {
  return {
    id: item.id,
    provider: item.provider,
    status: item.status,
    tokenType: item.tokenType,
    scopes: item.scopes || [],
    expiresAt: item.expiresAt || null,
    connectedAt: item.connectedAt || null,
    updatedAt: item.updatedAt || null,
  };
}

async function disconnectConnector(ownerId, provider) {
  const normalized = normalizeConnectorType(provider);
  if (!["ga4", "google_ads", "meta_ads"].includes(normalized)) throw new Error("CONNECTOR_PROVIDER_UNSUPPORTED");
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const credentials = Array.isArray(db.connector_credentials) ? db.connector_credentials : [];
    const removed = credentials.filter((item) => item.ownerId === ownerId && item.provider === normalized);
    db.connector_credentials = credentials.filter((item) => item.ownerId !== ownerId || item.provider !== normalized);
    db.data_sources = (Array.isArray(db.data_sources) ? db.data_sources : []).map((item) => (
      item.ownerId === ownerId && normalizeConnectorType(item.type) === normalized
        ? { ...item, status: "disconnected", disconnectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : item
    ));
    db.sync_jobs = (Array.isArray(db.sync_jobs) ? db.sync_jobs : []).map((item) => (
      item.ownerId === ownerId && item.provider === normalized && ["queued", "retrying"].includes(item.status)
        ? { ...item, status: "canceled", canceledAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : item
    ));
    if (removed.length) {
      db.audit_logs.push(withId({ action: "connector:disconnected", ownerId, provider: normalized, recordId: removed[0].id }));
      await writeDb(db);
    }
    return { provider: normalized, disconnected: removed.length > 0 };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function updateConnectorCredential(ownerId, provider, changes) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.connector_credentials.findIndex((item) => item.ownerId === ownerId && item.provider === provider);
    if (index < 0) throw new Error("CONNECTOR_NOT_CONNECTED");
    db.connector_credentials[index] = {
      ...db.connector_credentials[index],
      ...definedFields(changes),
      updatedAt: new Date().toISOString(),
    };
    await writeDb(db);
    return db.connector_credentials[index];
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function connectorAccessToken(ownerId, provider) {
  const db = await readDb();
  const credential = db.connector_credentials.find((item) => item.ownerId === ownerId && item.provider === provider && item.status === "connected");
  if (!credential) throw new Error("CONNECTOR_NOT_CONNECTED");
  const context = `${ownerId}:${provider}:credential`;
  const expiresSoon = credential.expiresAt && new Date(credential.expiresAt).getTime() <= Date.now() + 2 * 60 * 1000;
  if (!expiresSoon) return { token: decryptConnectorValue(credential.accessTokenEncrypted, context), credential };
  if (!credential.refreshTokenEncrypted || !["ga4", "google_ads"].includes(provider)) {
    await updateConnectorCredential(ownerId, provider, { status: "needs_reauth", lastErrorCode: "TOKEN_EXPIRED" });
    throw new Error("CONNECTOR_REAUTH_REQUIRED");
  }
  const refreshToken = decryptConnectorValue(credential.refreshTokenEncrypted, context);
  const config = connectorOAuthConfig(provider);
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    await updateConnectorCredential(ownerId, provider, { status: "needs_reauth", lastErrorCode: "TOKEN_REFRESH_FAILED" });
    throw new Error("CONNECTOR_REAUTH_REQUIRED");
  }
  const expiresIn = Number(payload.expires_in || 3600);
  const updated = await updateConnectorCredential(ownerId, provider, {
    status: "connected",
    accessTokenEncrypted: encryptConnectorValue(payload.access_token, context),
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    lastRefreshedAt: new Date().toISOString(),
    lastErrorCode: null,
  });
  return { token: payload.access_token, credential: updated };
}

async function fetchConnectorJson(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return { body, attempts: attempt };
      const providerStatus = String(body?.error?.status || "");
      const providerMessage = String(body?.error?.message || "").replace(/\s+/g, " ").trim().slice(0, 320);
      const providerReason = String(body?.error?.details?.[0]?.errors?.[0]?.errorCode
        ? JSON.stringify(body.error.details[0].errors[0].errorCode)
        : "").slice(0, 160);
      const connectorError = (code) => {
        const error = new Error(code);
        error.providerStatus = providerStatus;
        error.providerMessage = providerMessage;
        error.providerReason = providerReason;
        return error;
      };
      if (response.status === 401) throw connectorError("CONNECTOR_REAUTH_REQUIRED");
      if (response.status === 403) throw connectorError("CONNECTOR_PERMISSION_DENIED");
      if (response.status !== 429 && response.status < 500) throw connectorError(`CONNECTOR_API_FAILED:${response.status}`);
      lastError = new Error(response.status === 429 ? "CONNECTOR_RATE_LIMITED" : `CONNECTOR_API_RETRYABLE:${response.status}`);
    } catch (error) {
      if (["CONNECTOR_REAUTH_REQUIRED", "CONNECTOR_PERMISSION_DENIED"].includes(String(error.message || "").split(":")[0]) || String(error.message || "").startsWith("CONNECTOR_API_FAILED")) throw error;
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
  }
  throw lastError || new Error("CONNECTOR_API_FAILED");
}

function googleAdsCustomerId(value) {
  return String(value || "").replace(/^customers\//, "").replace(/-/g, "");
}

function googleAdsHeaders(token, loginCustomerId = "") {
  if (!googleAdsDeveloperToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN_REQUIRED");
  const headers = {
    authorization: `Bearer ${token}`,
    "developer-token": googleAdsDeveloperToken,
    accept: "application/json",
    "content-type": "application/json",
  };
  const loginId = googleAdsCustomerId(loginCustomerId);
  if (loginId) headers["login-customer-id"] = loginId;
  return headers;
}

async function listGoogleAdsCustomers(ownerId) {
  const { token } = await connectorAccessToken(ownerId, "google_ads");
  try {
    const accessible = await fetchConnectorJson(`${googleAdsApiBaseUrl}/customers:listAccessibleCustomers`, {
      headers: googleAdsHeaders(token),
    });
    const rootIds = (accessible.body.resourceNames || []).map(googleAdsCustomerId).filter((item) => /^\d+$/.test(item)).slice(0, 50);
    const discovered = [];
    for (const loginCustomerId of rootIds) {
      const query = [
        "SELECT customer_client.client_customer, customer_client.descriptive_name, customer_client.manager,",
        "customer_client.level, customer_client.status, customer_client.currency_code, customer_client.time_zone",
        "FROM customer_client WHERE customer_client.level <= 1",
      ].join(" ");
      try {
        let pageToken = "";
        let found = false;
        for (let page = 0; page < 20; page += 1) {
          const result = await fetchConnectorJson(`${googleAdsApiBaseUrl}/customers/${loginCustomerId}/googleAds:search`, {
            method: "POST",
            headers: googleAdsHeaders(token, loginCustomerId),
            body: JSON.stringify({ query, pageSize: 10000, ...(pageToken ? { pageToken } : {}) }),
          });
          for (const row of result.body.results || []) {
            const client = row.customerClient || {};
            const customerId = googleAdsCustomerId(client.clientCustomer);
            if (!/^\d+$/.test(customerId)) continue;
            found = true;
            discovered.push({
              customerId,
              loginCustomerId,
              name: client.descriptiveName || `Google Ads ${customerId}`,
              manager: Boolean(client.manager),
              level: Number(client.level || 0),
              status: client.status || "UNKNOWN",
              currencyCode: client.currencyCode || "",
              timeZone: client.timeZone || "",
            });
          }
          pageToken = result.body.nextPageToken || "";
          if (!pageToken) break;
          if (page === 19) throw new Error("GOOGLE_ADS_CUSTOMER_RESULT_TOO_LARGE");
        }
        if (!found) discovered.push({ customerId: loginCustomerId, loginCustomerId, name: `Google Ads ${loginCustomerId}`, manager: false, level: 0, status: "UNKNOWN", currencyCode: "", timeZone: "" });
      } catch (error) {
        const code = String(error.message || "").split(":")[0];
        if (["CONNECTOR_REAUTH_REQUIRED", "CONNECTOR_PERMISSION_DENIED"].includes(code)) throw error;
        discovered.push({ customerId: loginCustomerId, loginCustomerId, name: `Google Ads ${loginCustomerId}`, manager: false, level: 0, status: "UNKNOWN", currencyCode: "", timeZone: "", metadataUnavailable: true });
      }
    }
    const unique = new Map();
    discovered.forEach((item) => {
      const key = `${item.loginCustomerId}:${item.customerId}`;
      if (!unique.has(key)) unique.set(key, item);
    });
    return [...unique.values()].sort((a, b) => Number(a.level) - Number(b.level) || a.name.localeCompare(b.name));
  } catch (error) {
    if (String(error.message || "").split(":")[0] === "CONNECTOR_REAUTH_REQUIRED") {
      await updateConnectorCredential(ownerId, "google_ads", { status: "needs_reauth", lastErrorCode: "GOOGLE_ADS_AUTH_EXPIRED" });
    }
    throw error;
  }
}

async function selectGoogleAdsCustomer(ownerId, payload) {
  const customerId = googleAdsCustomerId(payload.customerId);
  const loginCustomerId = googleAdsCustomerId(payload.loginCustomerId || customerId);
  if (!/^\d+$/.test(customerId) || !/^\d+$/.test(loginCustomerId)) throw new Error("GOOGLE_ADS_CUSTOMER_INVALID");
  const customers = await listGoogleAdsCustomers(ownerId);
  const selected = customers.find((item) => item.customerId === customerId && item.loginCustomerId === loginCustomerId);
  if (!selected) throw new Error("GOOGLE_ADS_CUSTOMER_NOT_ACCESSIBLE");
  if (selected.manager) throw new Error("GOOGLE_ADS_MANAGER_NOT_REPORTABLE");
  const db = await readDb();
  const credential = db.connector_credentials.find((item) => item.ownerId === ownerId && item.provider === "google_ads" && item.status === "connected");
  if (!credential) throw new Error("CONNECTOR_NOT_CONNECTED");
  const existing = db.data_sources.find((item) => item.ownerId === ownerId && normalizeConnectorType(item.type) === "google_ads" && item.externalAccountId === customerId && item.loginCustomerId === loginCustomerId);
  return upsertOwnedRecord("data_sources", {
    id: existing?.id,
    type: "google_ads",
    provider: "google_ads",
    credentialId: credential.id,
    externalAccountId: customerId,
    loginCustomerId,
    displayName: selected.name,
    currencyCode: selected.currencyCode,
    timeZone: selected.timeZone,
    status: "connected",
    syncCadence: payload.syncCadence || "daily",
    autoReportEnabled: payload.autoReportEnabled !== false,
    backfillStartDate: /^\d{4}-\d{2}-\d{2}$/.test(payload.backfillStartDate || "") ? payload.backfillStartDate : null,
    nextSyncAt: existing?.nextSyncAt || new Date().toISOString(),
  }, ownerId);
}

function normalizeGoogleAdsReport(batches, source, ownerId) {
  const rows = (Array.isArray(batches) ? batches : [batches]).flatMap((batch) => batch?.results || []);
  return rows.map((row) => {
    const metrics = row.metrics || {};
    const campaign = row.campaign || {};
    return withId({
      ownerId,
      sourceId: source.id,
      provider: "google_ads",
      externalAccountId: source.externalAccountId,
      date: String(row.segments?.date || ""),
      channel: "Google Ads",
      campaignId: String(campaign.id || "") || null,
      campaignName: campaign.name || null,
      spend: Number(metrics.costMicros || 0) / 1_000_000,
      impressions: Number(metrics.impressions || 0),
      clicks: Number(metrics.clicks || 0),
      conversions: Number(metrics.conversions || 0),
      revenue: Number(metrics.conversionsValue || 0),
      sessions: 0,
      users: 0,
      sourceUpdatedAt: new Date().toISOString(),
    });
  }).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date));
}

async function syncGoogleAdsSource(ownerId, payload) {
  const { startDate, endDate } = validateSyncDateRange(payload);
  const db = await readDb();
  const source = db.data_sources.find((item) => item.id === payload.sourceId && item.ownerId === ownerId && normalizeConnectorType(item.type) === "google_ads");
  if (!source) throw new Error("DATA_SOURCE_NOT_FOUND");
  const job = await createRecord("sync_jobs", {
    provider: "google_ads", sourceId: source.id, externalAccountId: source.externalAccountId,
    startDate, endDate, status: "running", startedAt: new Date().toISOString(), attempts: 0,
  }, ownerId);
  try {
    const { token } = await connectorAccessToken(ownerId, "google_ads");
    const query = [
      "SELECT segments.date, campaign.id, campaign.name, metrics.cost_micros, metrics.impressions,",
      "metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign",
      `WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`,
      "ORDER BY segments.date ASC, campaign.id ASC",
    ].join(" ");
    const result = await fetchConnectorJson(`${googleAdsApiBaseUrl}/customers/${source.externalAccountId}/googleAds:searchStream`, {
      method: "POST",
      headers: googleAdsHeaders(token, source.loginCustomerId),
      body: JSON.stringify({ query }),
    });
    const rows = normalizeGoogleAdsReport(result.body, source, ownerId);
    const operation = writeQueue.then(async () => {
      const latest = await readDb();
      latest.normalized_metrics = (Array.isArray(latest.normalized_metrics) ? latest.normalized_metrics : [])
        .filter((item) => item.ownerId !== ownerId || item.sourceId !== source.id || item.date < startDate || item.date > endDate);
      latest.normalized_metrics.push(...rows);
      const jobIndex = latest.sync_jobs.findIndex((item) => item.id === job.id && item.ownerId === ownerId);
      latest.sync_jobs[jobIndex] = { ...latest.sync_jobs[jobIndex], status: "completed", attempts: result.attempts, rowCount: rows.length, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const sourceIndex = latest.data_sources.findIndex((item) => item.id === source.id && item.ownerId === ownerId);
      latest.data_sources[sourceIndex] = { ...latest.data_sources[sourceIndex], status: "synced", rowCount: rows.length, lastSyncedAt: new Date().toISOString(), nextSyncAt: nextConnectorRun(source), consecutiveFailures: 0, lastErrorCode: null, updatedAt: new Date().toISOString() };
      latest.data_syncs.push(withId({ ownerId, sourceId: source.id, provider: "google_ads", status: "synced", startDate, endDate, rowCount: rows.length, attempts: result.attempts, syncedAt: new Date().toISOString() }));
      latest.audit_logs.push(withId({ action: "connector:sync_completed", ownerId, provider: "google_ads", recordId: job.id, rowCount: rows.length }));
      await writeDb(latest);
      return latest.sync_jobs[jobIndex];
    });
    writeQueue = operation.catch(() => {});
    return { job: await operation, metrics: rows };
  } catch (error) {
    const code = String(error.message || "SYNC_FAILED").split(":")[0];
    await upsertOwnedRecord("sync_jobs", { id: job.id, status: "failed", errorCode: code, failedAt: new Date().toISOString() }, ownerId);
    if (code === "CONNECTOR_REAUTH_REQUIRED") await updateConnectorCredential(ownerId, "google_ads", { status: "needs_reauth", lastErrorCode: "GOOGLE_ADS_AUTH_EXPIRED" });
    throw error;
  }
}

function metaAdAccountId(value) {
  return String(value || "").replace(/^act_/, "");
}

function metaAppSecretProof(token) {
  if (!metaAppSecret) throw new Error("META_APP_SECRET_REQUIRED");
  return crypto.createHmac("sha256", metaAppSecret).update(token).digest("hex");
}

function metaApiUrl(pathname, token, params = {}) {
  const target = new URL(`${metaGraphApiBaseUrl}/${String(pathname || "").replace(/^\//, "")}`);
  target.searchParams.set("appsecret_proof", metaAppSecretProof(token));
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") target.searchParams.set(key, String(value));
  });
  return target;
}

function trustedMetaPagingUrl(rawUrl, token) {
  const target = new URL(String(rawUrl || ""));
  const expected = new URL(metaGraphApiBaseUrl);
  if (target.protocol !== "https:" && expected.protocol === "https:") throw new Error("META_PAGING_URL_INVALID");
  if (target.origin !== expected.origin || !target.pathname.startsWith(`${expected.pathname}/`)) throw new Error("META_PAGING_URL_INVALID");
  target.searchParams.delete("access_token");
  target.searchParams.set("appsecret_proof", metaAppSecretProof(token));
  return target;
}

async function listMetaAdAccounts(ownerId) {
  const { token } = await connectorAccessToken(ownerId, "meta_ads");
  try {
    const accounts = [];
    let target = metaApiUrl("me/adaccounts", token, {
      fields: "id,account_id,name,account_status,currency,timezone_name,business{id,name}",
      limit: "100",
    });
    for (let page = 0; page < 20; page += 1) {
      const result = await fetchConnectorJson(target.toString(), { headers: { accept: "application/json", authorization: `Bearer ${token}` } });
      accounts.push(...(result.body.data || []).map((item) => ({
        accountId: metaAdAccountId(item.account_id || item.id),
        name: item.name || `Meta Ads ${metaAdAccountId(item.account_id || item.id)}`,
        status: Number(item.account_status || 0),
        currencyCode: item.currency || "",
        timeZone: item.timezone_name || "",
        businessId: String(item.business?.id || ""),
        businessName: item.business?.name || "",
      })).filter((item) => /^\d+$/.test(item.accountId)));
      if (!result.body.paging?.next) break;
      target = trustedMetaPagingUrl(result.body.paging.next, token);
      if (page === 19) throw new Error("META_ACCOUNT_RESULT_TOO_LARGE");
    }
    const unique = new Map();
    accounts.forEach((item) => { if (!unique.has(item.accountId)) unique.set(item.accountId, item); });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (String(error.message || "").split(":")[0] === "CONNECTOR_REAUTH_REQUIRED") {
      await updateConnectorCredential(ownerId, "meta_ads", { status: "needs_reauth", lastErrorCode: "META_AUTH_EXPIRED" });
    }
    throw error;
  }
}

async function selectMetaAdAccount(ownerId, payload) {
  const accountId = metaAdAccountId(payload.accountId);
  if (!/^\d+$/.test(accountId)) throw new Error("META_AD_ACCOUNT_INVALID");
  const accounts = await listMetaAdAccounts(ownerId);
  const selected = accounts.find((item) => item.accountId === accountId);
  if (!selected) throw new Error("META_AD_ACCOUNT_NOT_ACCESSIBLE");
  const db = await readDb();
  const credential = db.connector_credentials.find((item) => item.ownerId === ownerId && item.provider === "meta_ads" && item.status === "connected");
  if (!credential) throw new Error("CONNECTOR_NOT_CONNECTED");
  const existing = db.data_sources.find((item) => item.ownerId === ownerId && normalizeConnectorType(item.type) === "meta_ads" && item.externalAccountId === accountId);
  return upsertOwnedRecord("data_sources", {
    id: existing?.id,
    type: "meta_ads",
    provider: "meta_ads",
    credentialId: credential.id,
    externalAccountId: accountId,
    businessId: selected.businessId,
    businessName: selected.businessName,
    displayName: selected.name,
    currencyCode: selected.currencyCode,
    timeZone: selected.timeZone,
    accountStatus: selected.status,
    status: "connected",
    syncCadence: payload.syncCadence || "daily",
    autoReportEnabled: payload.autoReportEnabled !== false,
    backfillStartDate: /^\d{4}-\d{2}-\d{2}$/.test(payload.backfillStartDate || "") ? payload.backfillStartDate : null,
    nextSyncAt: existing?.nextSyncAt || new Date().toISOString(),
  }, ownerId);
}

function metaActionValue(entries, priorities) {
  const values = Array.isArray(entries) ? entries : [];
  for (const actionType of priorities) {
    const item = values.find((entry) => entry.action_type === actionType);
    if (item) return Number(item.value || 0);
  }
  return 0;
}

function normalizeMetaInsights(items, source, ownerId) {
  const conversionTypes = ["omni_purchase", "offsite_conversion.fb_pixel_purchase", "purchase", "onsite_conversion.purchase", "lead"];
  const valueTypes = ["omni_purchase", "offsite_conversion.fb_pixel_purchase", "purchase", "onsite_conversion.purchase"];
  return items.map((item) => withId({
    ownerId,
    sourceId: source.id,
    provider: "meta_ads",
    externalAccountId: source.externalAccountId,
    date: String(item.date_start || ""),
    channel: "Meta Ads",
    campaignId: String(item.campaign_id || "") || null,
    campaignName: item.campaign_name || null,
    spend: Number(item.spend || 0),
    impressions: Number(item.impressions || 0),
    clicks: Number(item.clicks || 0),
    conversions: metaActionValue(item.actions, conversionTypes),
    revenue: metaActionValue(item.action_values, valueTypes),
    sessions: 0,
    users: 0,
    sourceUpdatedAt: new Date().toISOString(),
  })).filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date));
}

async function syncMetaAdsSource(ownerId, payload) {
  const { startDate, endDate } = validateSyncDateRange(payload);
  const db = await readDb();
  const source = db.data_sources.find((item) => item.id === payload.sourceId && item.ownerId === ownerId && normalizeConnectorType(item.type) === "meta_ads");
  if (!source) throw new Error("DATA_SOURCE_NOT_FOUND");
  const job = await createRecord("sync_jobs", {
    provider: "meta_ads", sourceId: source.id, externalAccountId: source.externalAccountId,
    startDate, endDate, status: "running", startedAt: new Date().toISOString(), attempts: 0,
  }, ownerId);
  try {
    const { token } = await connectorAccessToken(ownerId, "meta_ads");
    const insights = [];
    let totalAttempts = 0;
    let target = metaApiUrl(`act_${source.externalAccountId}/insights`, token, {
      fields: "date_start,date_stop,campaign_id,campaign_name,spend,impressions,clicks,actions,action_values",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      time_increment: "1",
      level: "campaign",
      limit: "500",
    });
    for (let page = 0; page < 100; page += 1) {
      const result = await fetchConnectorJson(target.toString(), { headers: { accept: "application/json", authorization: `Bearer ${token}` } });
      totalAttempts += result.attempts;
      insights.push(...(result.body.data || []));
      if (!result.body.paging?.next) break;
      target = trustedMetaPagingUrl(result.body.paging.next, token);
      if (page === 99) throw new Error("META_INSIGHTS_RESULT_TOO_LARGE");
    }
    const rows = normalizeMetaInsights(insights, source, ownerId);
    const operation = writeQueue.then(async () => {
      const latest = await readDb();
      latest.normalized_metrics = (Array.isArray(latest.normalized_metrics) ? latest.normalized_metrics : [])
        .filter((item) => item.ownerId !== ownerId || item.sourceId !== source.id || item.date < startDate || item.date > endDate);
      latest.normalized_metrics.push(...rows);
      const jobIndex = latest.sync_jobs.findIndex((item) => item.id === job.id && item.ownerId === ownerId);
      latest.sync_jobs[jobIndex] = { ...latest.sync_jobs[jobIndex], status: "completed", attempts: totalAttempts, rowCount: rows.length, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const sourceIndex = latest.data_sources.findIndex((item) => item.id === source.id && item.ownerId === ownerId);
      latest.data_sources[sourceIndex] = { ...latest.data_sources[sourceIndex], status: "synced", rowCount: rows.length, lastSyncedAt: new Date().toISOString(), nextSyncAt: nextConnectorRun(source), consecutiveFailures: 0, lastErrorCode: null, updatedAt: new Date().toISOString() };
      latest.data_syncs.push(withId({ ownerId, sourceId: source.id, provider: "meta_ads", status: "synced", startDate, endDate, rowCount: rows.length, attempts: totalAttempts, syncedAt: new Date().toISOString() }));
      latest.audit_logs.push(withId({ action: "connector:sync_completed", ownerId, provider: "meta_ads", recordId: job.id, rowCount: rows.length }));
      await writeDb(latest);
      return latest.sync_jobs[jobIndex];
    });
    writeQueue = operation.catch(() => {});
    return { job: await operation, metrics: rows };
  } catch (error) {
    const code = String(error.message || "SYNC_FAILED").split(":")[0];
    await upsertOwnedRecord("sync_jobs", { id: job.id, status: "failed", errorCode: code, failedAt: new Date().toISOString() }, ownerId);
    if (code === "CONNECTOR_REAUTH_REQUIRED") await updateConnectorCredential(ownerId, "meta_ads", { status: "needs_reauth", lastErrorCode: "META_AUTH_EXPIRED" });
    throw error;
  }
}

function utcDateString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function connectorIncrementalRange(source, metrics, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const sourceDates = (Array.isArray(metrics) ? metrics : [])
    .filter((item) => item.ownerId === source.ownerId && item.sourceId === source.id && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
    .map((item) => item.date)
    .sort();
  let start;
  if (sourceDates.length) {
    start = new Date(`${sourceDates[sourceDates.length - 1]}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 2);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(source.backfillStartDate || "")) {
    start = new Date(`${source.backfillStartDate}T00:00:00Z`);
  } else {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 89);
  }
  if (start > end) {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 2);
  }
  return { startDate: utcDateString(start), endDate: utcDateString(end) };
}

async function claimDueConnectorSources(limit = 20) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const now = new Date();
    const credentials = Array.isArray(db.connector_credentials) ? db.connector_credentials : [];
    const due = (Array.isArray(db.data_sources) ? db.data_sources : [])
      .filter((source) => ["ga4", "google_ads", "meta_ads"].includes(normalizeConnectorType(source.type)))
      .filter((source) => source.syncCadence !== "manual" && !["disconnected", "needs_reauth"].includes(source.status))
      .filter((source) => !source.syncLockUntil || new Date(source.syncLockUntil) <= now)
      .filter((source) => new Date(source.nextSyncAt || 0) <= now)
      .filter((source) => credentials.some((credential) => credential.ownerId === source.ownerId && credential.provider === normalizeConnectorType(source.type) && credential.status === "connected"))
      .slice(0, limit);
    const ids = new Set(due.map((source) => source.id));
    db.data_sources = db.data_sources.map((source) => ids.has(source.id) ? {
      ...source,
      status: "syncing",
      syncLockUntil: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    } : source);
    if (due.length) await writeDb(db);
    return due.map((source) => ({ ...source }));
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function finalizeConnectorSchedule(source, result = {}, error = null) {
  const code = error ? String(error.message || "CONNECTOR_SYNC_FAILED").split(":")[0] : null;
  const failures = error ? Number(source.consecutiveFailures || 0) + 1 : 0;
  const delayMinutes = Math.min(24 * 60, 5 * (2 ** Math.max(0, failures - 1)));
  const nextSyncAt = error
    ? new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()
    : nextConnectorRun(source);
  return upsertOwnedRecord("data_sources", {
    id: source.id,
    status: code === "CONNECTOR_REAUTH_REQUIRED" ? "needs_reauth" : error ? "error" : "synced",
    syncLockUntil: null,
    nextSyncAt,
    consecutiveFailures: failures,
    lastErrorCode: code,
    lastAutoSyncAt: new Date().toISOString(),
    ...(result.job ? { lastSyncJobId: result.job.id, rowCount: result.job.rowCount } : {}),
  }, source.ownerId);
}

async function syncClaimedConnectorSource(source, range) {
  const provider = normalizeConnectorType(source.type);
  if (provider === "ga4") return syncGa4Source(source.ownerId, { sourceId: source.id, ...range });
  if (provider === "google_ads") return syncGoogleAdsSource(source.ownerId, { sourceId: source.id, ...range });
  if (provider === "meta_ads") return syncMetaAdsSource(source.ownerId, { sourceId: source.id, ...range });
  throw new Error("CONNECTOR_PROVIDER_UNSUPPORTED");
}

function aggregateNormalizedMetrics(rows) {
  const totals = rows.reduce((sum, item) => ({
    spend: sum.spend + Number(item.spend || 0),
    impressions: sum.impressions + Number(item.impressions || 0),
    clicks: sum.clicks + Number(item.clicks || 0),
    conversions: sum.conversions + Number(item.conversions || 0),
    revenue: sum.revenue + Number(item.revenue || 0),
    sessions: sum.sessions + Number(item.sessions || 0),
    users: sum.users + Number(item.users || 0),
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, sessions: 0, users: 0 });
  return {
    ...totals,
    ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
    cpc: totals.clicks ? totals.spend / totals.clicks : 0,
    cvr: totals.clicks ? (totals.conversions / totals.clicks) * 100 : 0,
    cpa: totals.conversions ? totals.spend / totals.conversions : 0,
    roas: totals.spend ? totals.revenue / totals.spend : 0,
  };
}

function aggregateUnifiedMetrics(rows) {
  const all = aggregateNormalizedMetrics(rows);
  const ads = aggregateNormalizedMetrics(rows.filter((item) => ["google_ads", "meta_ads"].includes(item.provider)));
  const analytics = aggregateNormalizedMetrics(rows.filter((item) => item.provider === "ga4"));
  const spend = ads.spend || all.spend;
  const impressions = ads.impressions || all.impressions;
  const clicks = ads.clicks || all.clicks;
  const conversions = analytics.conversions || ads.conversions || all.conversions;
  const revenue = analytics.revenue || ads.revenue || all.revenue;
  const sessions = analytics.sessions || all.sessions;
  const users = analytics.users || all.users;
  return {
    spend, impressions, clicks, conversions, revenue, sessions, users,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpc: clicks ? spend / clicks : 0,
    cvr: clicks ? (conversions / clicks) * 100 : 0,
    cpa: conversions ? spend / conversions : 0,
    roas: spend ? revenue / spend : 0,
  };
}

function previousReportMonth(reportMonth) {
  const [year, month] = String(reportMonth || "").split("-").map(Number);
  if (!year || !month) return "";
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return previous.toISOString().slice(0, 7);
}

async function unifiedConnectorReportData(ownerId, reportMonth = "") {
  const db = await readDb();
  const owned = (Array.isArray(db.normalized_metrics) ? db.normalized_metrics : []).filter((item) => item.ownerId === ownerId);
  const availableMonths = [...new Set(owned.map((item) => String(item.date || "").slice(0, 7)).filter((item) => /^\d{4}-\d{2}$/.test(item)))].sort();
  const month = /^\d{4}-\d{2}$/.test(reportMonth) ? reportMonth : availableMonths[availableMonths.length - 1] || "";
  const previousMonth = previousReportMonth(month);
  const rows = owned.filter((item) => String(item.date || "").startsWith(month));
  const previousRows = owned.filter((item) => String(item.date || "").startsWith(previousMonth));
  const sourceMap = new Map((db.data_sources || []).filter((item) => item.ownerId === ownerId).map((item) => [item.id, item]));
  const grouped = new Map();
  rows.forEach((item) => {
    const key = item.campaignId ? `${item.provider}:${item.campaignId}` : `${item.provider}:${item.channel}`;
    const group = grouped.get(key) || { provider: item.provider, channel: item.channel, campaignId: item.campaignId, campaignName: item.campaignName, rows: [] };
    group.rows.push(item);
    grouped.set(key, group);
  });
  const breakdown = [...grouped.values()].map((group) => ({
    provider: group.provider,
    channel: group.channel,
    campaignId: group.campaignId,
    campaignName: group.campaignName,
    ...aggregateNormalizedMetrics(group.rows),
  })).sort((a, b) => b.revenue - a.revenue || b.conversions - a.conversions);
  const sources = [...new Set(rows.map((item) => item.sourceId))].map((id) => sourceMap.get(id)).filter(Boolean).map((source) => ({
    id: source.id, provider: source.provider || source.type, name: source.displayName, externalAccountId: source.externalAccountId,
  }));
  return {
    reportMonth: month,
    previousMonth,
    totals: aggregateUnifiedMetrics(rows),
    previousTotals: aggregateUnifiedMetrics(previousRows),
    breakdown,
    sources,
    rowCount: rows.length,
    generatedAt: new Date().toISOString(),
  };
}

function percentageDifference(left, right) {
  const a = Number(left || 0);
  const b = Number(right || 0);
  const denominator = Math.max(Math.abs(a), Math.abs(b));
  return denominator ? (Math.abs(a - b) / denominator) * 100 : 0;
}

async function connectorReconciliation(ownerId, reportMonth = "") {
  const db = await readDb();
  const report = await unifiedConnectorReportData(ownerId, reportMonth);
  const rows = (db.normalized_metrics || []).filter((item) => item.ownerId === ownerId && String(item.date || "").startsWith(report.reportMonth));
  const sources = (db.data_sources || []).filter((item) => item.ownerId === ownerId && ["ga4", "google_ads", "meta_ads"].includes(normalizeConnectorType(item.type)));
  const providers = ["ga4", "google_ads", "meta_ads"].map((provider) => {
    const providerRows = rows.filter((item) => item.provider === provider);
    const dates = [...new Set(providerRows.map((item) => item.date))].sort();
    const providerSources = sources.filter((source) => normalizeConnectorType(source.type) === provider);
    const latestSync = providerSources.map((source) => source.lastSyncedAt).filter(Boolean).sort().at(-1) || null;
    return {
      provider,
      sourceCount: providerSources.length,
      rowCount: providerRows.length,
      firstDate: dates[0] || null,
      lastDate: dates[dates.length - 1] || null,
      coveredDays: dates.length,
      lastSyncedAt: latestSync,
      stale: latestSync ? Date.now() - new Date(latestSync).getTime() > 48 * 60 * 60 * 1000 : providerSources.length > 0,
      metrics: aggregateNormalizedMetrics(providerRows),
    };
  });
  const analytics = providers.find((item) => item.provider === "ga4");
  const adsMetrics = aggregateNormalizedMetrics(rows.filter((item) => ["google_ads", "meta_ads"].includes(item.provider)));
  const warnings = [];
  if (!report.rowCount) warnings.push("NO_DATA");
  providers.filter((item) => item.sourceCount && !item.rowCount).forEach((item) => warnings.push(`NO_${item.provider.toUpperCase()}_ROWS`));
  providers.filter((item) => item.stale).forEach((item) => warnings.push(`STALE_${item.provider.toUpperCase()}`));
  if (analytics?.rowCount && adsMetrics.conversions) {
    const difference = percentageDifference(analytics.metrics.conversions, adsMetrics.conversions);
    if (difference >= 20) warnings.push("CONVERSION_ATTRIBUTION_DIFFERENCE");
  }
  if (analytics?.rowCount && adsMetrics.revenue) {
    const difference = percentageDifference(analytics.metrics.revenue, adsMetrics.revenue);
    if (difference >= 20) warnings.push("REVENUE_ATTRIBUTION_DIFFERENCE");
  }
  return {
    reportMonth: report.reportMonth,
    status: warnings.length ? "review" : report.rowCount ? "ready" : "empty",
    warnings,
    canonicalTotals: report.totals,
    providers,
    attributionComparison: {
      ga4Conversions: analytics?.metrics.conversions || 0,
      adPlatformConversions: adsMetrics.conversions,
      conversionDifferencePercent: percentageDifference(analytics?.metrics.conversions, adsMetrics.conversions),
      ga4Revenue: analytics?.metrics.revenue || 0,
      adPlatformRevenue: adsMetrics.revenue,
      revenueDifferencePercent: percentageDifference(analytics?.metrics.revenue, adsMetrics.revenue),
      note: "Ad platforms and GA4 use different attribution and identity models; differences are review signals, not automatic errors.",
    },
    policy: {
      deliveryMetrics: "Google Ads + Meta Ads",
      outcomeMetrics: analytics?.rowCount ? "GA4" : "Ad platforms fallback",
      preventsDoubleCounting: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function createAutomatedConnectorReport(ownerId) {
  const data = await unifiedConnectorReportData(ownerId);
  if (!data.reportMonth || !data.rowCount) return null;
  const automationKey = `connectors:${data.reportMonth}`;
  const db = await readDb();
  const fingerprintPayload = {
    reportMonth: data.reportMonth,
    totals: data.totals,
    previousTotals: data.previousTotals,
    breakdown: [...data.breakdown]
      .map((item) => ({
        provider: item.provider,
        channel: item.channel,
        campaignId: item.campaignId,
        campaignName: item.campaignName,
        spend: item.spend,
        impressions: item.impressions,
        clicks: item.clicks,
        conversions: item.conversions,
        revenue: item.revenue,
        sessions: item.sessions,
        users: item.users,
      }))
      .sort((left, right) => `${left.provider}:${left.campaignId || left.channel}`.localeCompare(`${right.provider}:${right.campaignId || right.channel}`)),
    sources: [...data.sources]
      .map((item) => ({ id: item.id, provider: item.provider, externalAccountId: item.externalAccountId }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
  const dataFingerprint = crypto.createHash("sha256").update(JSON.stringify(fingerprintPayload)).digest("hex");
  const existing = (db.ai_runs || [])
    .filter((item) => item.ownerId === ownerId && item.automationKey === automationKey)
    .sort((left, right) => String(right.updatedAt || right.createdAt).localeCompare(String(left.updatedAt || left.createdAt)))[0];
  if (existing?.dataFingerprint === dataFingerprint) {
    return { id: existing.id, reportMonth: data.reportMonth, existing: true, updated: false };
  }
  const user = (db.auth_users || []).find((item) => item.id === ownerId) || { id: ownerId };
  const usage = await consumeApiUsage(user, "ai_report", { endpoint: "worker:connector-report", reportMonth: data.reportMonth });
  if (!usage.allowed) {
    await createRecord("audit_logs", { action: "connector:auto_report_quota_exceeded", reportMonth: data.reportMonth }, ownerId);
    return null;
  }
  const actionableChannels = data.breakdown.filter((item) => ["google_ads", "meta_ads"].includes(item.provider) && item.spend > 0);
  const best = [...actionableChannels].sort((a, b) => b.roas - a.roas || b.conversions - a.conversions)[0] || null;
  const weakest = [...actionableChannels].sort((a, b) => a.roas - b.roas || a.conversions - b.conversions)[0] || null;
  const payload = {
    reportMonth: data.reportMonth,
    reportType: "Automated multi-channel report",
    clientName: data.sources[0]?.name || "Connected advertising account",
    clientNeeds: "Summarize performance, explain risks, and propose a concrete next-month budget and creative action plan.",
    metrics: data.totals,
    previousMetrics: data.previousTotals,
    channels: data.breakdown,
    bestChannel: best,
    weakChannel: weakest,
    dataSources: data.sources,
  };
  const draft = await generateAiDraft(payload);
  const runPayload = {
    ...payload,
    ...draft,
    automationKey,
    dataFingerprint,
    status: "completed",
    mode: draft.mode === "live" ? "connector-live" : "connector-fallback",
    usageEventId: usage.eventId,
    usage,
  };
  const run = existing
    ? await upsertOwnedRecord("ai_runs", { id: existing.id, ...runPayload }, ownerId)
    : await createRecord("ai_runs", runPayload, ownerId);
  const existingReport = (db.reports || [])
    .filter((item) => item.ownerId === ownerId && (item.automationKey === automationKey || item.parentAutomationKey === automationKey) && item.generatedBy === "connector-worker")
    .sort((left, right) => String(right.updatedAt || right.createdAt).localeCompare(String(left.updatedAt || left.createdAt)))[0];
  const mayUpdateDraft = existingReport && ["draft", "generated"].includes(existingReport.status || "draft");
  const reportPayload = {
    automationKey: existingReport?.automationKey || automationKey,
    aiRunId: run.id,
    dataFingerprint,
    reportMonth: data.reportMonth,
    month: data.reportMonth,
    clientName: payload.clientName,
    reportType: payload.reportType,
    status: "draft",
    metrics: data.totals,
    previousMetrics: data.previousTotals,
    breakdown: data.breakdown,
    sources: data.sources,
    summary: draft.summary,
    risks: draft.risks,
    nextActions: draft.nextActions,
    clientReplyDraft: draft.clientReplyDraft,
    generatedBy: "connector-worker",
  };
  const report = mayUpdateDraft
    ? await upsertOwnedRecord("reports", { id: existingReport.id, ...reportPayload }, ownerId)
    : await createRecord("reports", {
      ...reportPayload,
      automationKey: existingReport ? `${automationKey}:revision:${dataFingerprint.slice(0, 12)}` : automationKey,
      parentAutomationKey: existingReport ? automationKey : null,
      supersedesReportId: existingReport?.id || null,
    }, ownerId);
  const updated = Boolean(existing && mayUpdateDraft);
  await createRecord("audit_logs", { action: updated ? "connector:auto_report_updated" : "connector:auto_report_created", reportMonth: data.reportMonth, recordId: report.id, aiRunId: run.id }, ownerId);
  return { id: run.id, reportId: report.id, reportMonth: data.reportMonth, existing: false, updated };
}

async function processDueConnectorSources() {
  const sources = await claimDueConnectorSources();
  const db = await readDb();
  const owners = new Set();
  const completed = [];
  const failed = [];
  for (const source of sources) {
    const range = connectorIncrementalRange(source, db.normalized_metrics);
    try {
      const result = await syncClaimedConnectorSource(source, range);
      await finalizeConnectorSchedule(source, result);
      completed.push({ sourceId: source.id, jobId: result.job.id, provider: normalizeConnectorType(source.type), rowCount: result.job.rowCount });
      if (source.autoReportEnabled !== false) owners.add(source.ownerId);
    } catch (error) {
      await finalizeConnectorSchedule(source, {}, error);
      failed.push({ sourceId: source.id, provider: normalizeConnectorType(source.type), code: String(error.message || "CONNECTOR_SYNC_FAILED").split(":")[0] });
    }
  }
  const reports = [];
  for (const ownerId of owners) {
    const report = await createAutomatedConnectorReport(ownerId);
    if (report && !report.existing) reports.push(report);
  }
  return { processed: sources.length, completed, failed, reports };
}

async function listGa4Properties(ownerId) {
  const { token } = await connectorAccessToken(ownerId, "ga4");
  try {
    const summaries = [];
    let pageToken = "";
    for (let page = 0; page < 10; page += 1) {
      const target = new URL(`${ga4AdminApiBaseUrl}/accountSummaries`);
      target.searchParams.set("pageSize", "200");
      if (pageToken) target.searchParams.set("pageToken", pageToken);
      const { body } = await fetchConnectorJson(target.toString(), {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      });
      summaries.push(...(body.accountSummaries || []));
      pageToken = body.nextPageToken || "";
      if (!pageToken) break;
    }
    return summaries.flatMap((account) => (account.propertySummaries || []).map((property) => ({
      accountId: String(account.account || "").replace(/^accounts\//, ""),
      accountName: account.displayName || "",
      propertyId: String(property.property || "").replace(/^properties\//, ""),
      propertyName: property.displayName || "",
    }))).filter((item) => /^\d+$/.test(item.propertyId));
  } catch (error) {
    if (String(error.message || "").split(":")[0] === "CONNECTOR_REAUTH_REQUIRED") {
      await updateConnectorCredential(ownerId, "ga4", { status: "needs_reauth", lastErrorCode: "GA4_AUTH_EXPIRED" });
    }
    throw error;
  }
}

async function selectGa4Property(ownerId, payload) {
  const propertyId = String(payload.propertyId || "").replace(/^properties\//, "");
  if (!/^\d+$/.test(propertyId)) throw new Error("GA4_PROPERTY_INVALID");
  const properties = await listGa4Properties(ownerId);
  const selected = properties.find((item) => item.propertyId === propertyId);
  if (!selected) throw new Error("GA4_PROPERTY_NOT_ACCESSIBLE");
  const db = await readDb();
  const credential = db.connector_credentials.find((item) => item.ownerId === ownerId && item.provider === "ga4" && item.status === "connected");
  if (!credential) throw new Error("CONNECTOR_NOT_CONNECTED");
  const existing = db.data_sources.find((item) => item.ownerId === ownerId && normalizeConnectorType(item.type) === "ga4" && item.externalAccountId === propertyId);
  return upsertOwnedRecord("data_sources", {
    id: existing?.id,
    type: "ga4",
    provider: "ga4",
    credentialId: credential.id,
    externalAccountId: propertyId,
    accountId: selected.accountId,
    accountName: selected.accountName,
    displayName: selected.propertyName || `GA4 ${propertyId}`,
    status: "connected",
    syncCadence: payload.syncCadence || "daily",
    autoReportEnabled: payload.autoReportEnabled !== false,
    backfillStartDate: /^\d{4}-\d{2}-\d{2}$/.test(payload.backfillStartDate || "") ? payload.backfillStartDate : null,
    nextSyncAt: existing?.nextSyncAt || new Date().toISOString(),
  }, ownerId);
}

function normalizedDate(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 8) return "";
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function normalizeGa4Report(body, source, ownerId) {
  const dimensions = (body.dimensionHeaders || []).map((item) => item.name);
  const metrics = (body.metricHeaders || []).map((item) => item.name);
  const valueAt = (row, headers, values, name) => {
    const index = headers.indexOf(name);
    return index >= 0 ? values[index]?.value || "" : "";
  };
  return (body.rows || []).map((row) => {
    const date = normalizedDate(valueAt(row, dimensions, row.dimensionValues || [], "date"));
    const channel = valueAt(row, dimensions, row.dimensionValues || [], "sessionDefaultChannelGroup") || "Unassigned";
    const metric = (name) => Number(valueAt(row, metrics, row.metricValues || [], name) || 0);
    return withId({
      ownerId,
      sourceId: source.id,
      provider: "ga4",
      externalAccountId: source.externalAccountId,
      date,
      channel,
      campaignId: null,
      campaignName: null,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: metric("keyEvents"),
      revenue: metric("purchaseRevenue"),
      sessions: metric("sessions"),
      users: metric("totalUsers"),
      sourceUpdatedAt: new Date().toISOString(),
    });
  }).filter((item) => item.date);
}

function validateSyncDateRange(payload) {
  const startDate = String(payload.startDate || "");
  const endDate = String(payload.endDate || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("SYNC_DATE_RANGE_INVALID");
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (end < start || end.getTime() - start.getTime() > 400 * 24 * 60 * 60 * 1000) throw new Error("SYNC_DATE_RANGE_INVALID");
  return { startDate, endDate };
}

async function syncGa4Source(ownerId, payload) {
  const { startDate, endDate } = validateSyncDateRange(payload);
  const db = await readDb();
  const source = db.data_sources.find((item) => item.id === payload.sourceId && item.ownerId === ownerId && normalizeConnectorType(item.type) === "ga4");
  if (!source) throw new Error("DATA_SOURCE_NOT_FOUND");
  const job = await createRecord("sync_jobs", {
    provider: "ga4",
    sourceId: source.id,
    externalAccountId: source.externalAccountId,
    startDate,
    endDate,
    status: "running",
    startedAt: new Date().toISOString(),
    attempts: 0,
  }, ownerId);
  try {
    const { token } = await connectorAccessToken(ownerId, "ga4");
    const requestBody = {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "keyEvents" }, { name: "purchaseRevenue" }],
      limit: "100000",
    };
    const combined = { dimensionHeaders: [], metricHeaders: [], rows: [] };
    let totalAttempts = 0;
    for (let page = 0; page < 20; page += 1) {
      const result = await fetchConnectorJson(`${ga4DataApiBaseUrl}/properties/${encodeURIComponent(source.externalAccountId)}:runReport`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ ...requestBody, offset: String(page * 100000) }),
      });
      totalAttempts += result.attempts;
      if (!combined.dimensionHeaders.length) combined.dimensionHeaders = result.body.dimensionHeaders || [];
      if (!combined.metricHeaders.length) combined.metricHeaders = result.body.metricHeaders || [];
      const pageRows = result.body.rows || [];
      combined.rows.push(...pageRows);
      const rowCount = Number(result.body.rowCount || pageRows.length);
      if (!pageRows.length || combined.rows.length >= rowCount) break;
      if (page === 19) throw new Error("GA4_RESULT_TOO_LARGE");
    }
    const rows = normalizeGa4Report(combined, source, ownerId);
    const operation = writeQueue.then(async () => {
      const latest = await readDb();
      latest.normalized_metrics = (Array.isArray(latest.normalized_metrics) ? latest.normalized_metrics : [])
        .filter((item) => item.ownerId !== ownerId || item.sourceId !== source.id || item.date < startDate || item.date > endDate);
      latest.normalized_metrics.push(...rows);
      const jobIndex = latest.sync_jobs.findIndex((item) => item.id === job.id && item.ownerId === ownerId);
      latest.sync_jobs[jobIndex] = { ...latest.sync_jobs[jobIndex], status: "completed", attempts: totalAttempts, rowCount: rows.length, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const sourceIndex = latest.data_sources.findIndex((item) => item.id === source.id && item.ownerId === ownerId);
      latest.data_sources[sourceIndex] = { ...latest.data_sources[sourceIndex], status: "synced", rowCount: rows.length, lastSyncedAt: new Date().toISOString(), nextSyncAt: nextConnectorRun(source), consecutiveFailures: 0, lastErrorCode: null, updatedAt: new Date().toISOString() };
      latest.data_syncs.push(withId({ ownerId, sourceId: source.id, provider: "ga4", status: "synced", startDate, endDate, rowCount: rows.length, attempts: totalAttempts, syncedAt: new Date().toISOString() }));
      latest.audit_logs.push(withId({ action: "connector:sync_completed", ownerId, provider: "ga4", recordId: job.id, rowCount: rows.length }));
      await writeDb(latest);
      return latest.sync_jobs[jobIndex];
    });
    writeQueue = operation.catch(() => {});
    const completedJob = await operation;
    return { job: completedJob, metrics: rows };
  } catch (error) {
    const code = String(error.message || "SYNC_FAILED").split(":")[0];
    await upsertOwnedRecord("sync_jobs", { id: job.id, status: "failed", errorCode: code, failedAt: new Date().toISOString() }, ownerId);
    if (code === "CONNECTOR_REAUTH_REQUIRED") await updateConnectorCredential(ownerId, "ga4", { status: "needs_reauth", lastErrorCode: "GA4_AUTH_EXPIRED" });
    throw error;
  }
}

function connectorStatus(type) {
  const normalized = normalizeConnectorType(type);
  if (normalized === "manual_csv") return { status: "ready", mode: "manual", provider: normalized };
  if (normalized === "google_sheets") return { status: connectorEnv.google_sheets ? "live-ready" : "csv-url-ready", mode: connectorEnv.google_sheets ? "api" : "public_csv", provider: normalized };
  if (connectorEnv[normalized]) return { status: "oauth-ready", mode: "oauth", provider: normalized, authorizationReady: true, vaultReady: connectorEncryptionReady() };
  return { status: "needs_credentials", mode: "disabled", provider: normalized, authorizationReady: false, vaultReady: connectorEncryptionReady() };
}

function normalizeConnectorType(type) {
  const value = String(type || "manual_csv").toLowerCase();
  if (["csv", "manual", "manual_csv"].includes(value)) return "manual_csv";
  if (["sheets", "sheet", "google_sheets"].includes(value)) return "google_sheets";
  return value;
}

function validateReportCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = (lines[0] || "").split(",").map((item) => item.trim().replace(/^"|"$/g, "").toLowerCase());
  const metrics = ["spend", "impressions", "clicks", "conversions", "revenue"];
  return {
    ok: lines.length > 1 && headers.includes("channel") && metrics.some((key) => headers.includes(key)),
    rowCount: Math.max(0, lines.length - 1),
    headers,
  };
}

function googleSheetsCsvUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || ""));
  } catch {
    throw new Error("Enter a valid Google Sheets URL");
  }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") throw new Error("Only HTTPS Google Sheets URLs are supported");
  const published = url.pathname.match(/^\/spreadsheets\/d\/e\/([A-Za-z0-9_-]+)/);
  const standard = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  const gid = url.searchParams.get("gid") || (url.hash.match(/gid=(\d+)/)?.[1]) || "0";
  if (published) return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv&gid=${encodeURIComponent(gid)}`;
  if (standard) return `https://docs.google.com/spreadsheets/d/${standard[1]}/export?format=csv&gid=${encodeURIComponent(gid)}`;
  throw new Error("The Google Sheets URL does not contain a spreadsheet ID");
}

async function fetchPublicSheetCsv(rawUrl) {
  let target = googleSheetsCsvUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    for (let redirect = 0; redirect < 4; redirect += 1) {
      const response = await fetch(target, { redirect: "manual", signal: controller.signal, headers: { accept: "text/csv,text/plain;q=0.9" } });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Google Sheets redirect is missing a destination");
        const next = new URL(location, target);
        const allowed = next.protocol === "https:" && (next.hostname === "docs.google.com" || next.hostname.endsWith(".googleusercontent.com"));
        if (!allowed) throw new Error("Google Sheets redirected to an untrusted host");
        target = next.toString();
        continue;
      }
      if (!response.ok) throw new Error(`Google Sheets CSV returned ${response.status}`);
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > 5_000_000) throw new Error("Google Sheets CSV exceeds the 5 MB limit");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 5_000_000) throw new Error("Google Sheets CSV exceeds the 5 MB limit");
      return bytes.toString("utf8").replace(/^\uFEFF/, "");
    }
    throw new Error("Google Sheets returned too many redirects");
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Google Sheets request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function countCsvRows(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

async function testDataConnector(payload) {
  const type = normalizeConnectorType(payload.type || payload.sourceType);
  const base = connectorStatus(type);
  if (type === "manual_csv") {
    const validation = validateReportCsv(payload.csv || payload.sampleCsv || "");
    return { ...base, ok: validation.ok, rowCount: validation.rowCount, headers: validation.headers, message: validation.ok ? "Manual CSV is ready for reporting." : "CSV needs a channel column, at least one KPI column, and one data row." };
  }
  if (type === "google_sheets" && payload.url) {
    const text = await fetchPublicSheetCsv(payload.url);
    const validation = validateReportCsv(text);
    return { ...base, ok: validation.ok, rowCount: validation.rowCount, headers: validation.headers, csv: validation.ok ? text : undefined, message: validation.ok ? "Google Sheets CSV was imported securely." : "The sheet is reachable but does not contain report-ready columns." };
  }
  if (base.status === "oauth-ready") return { ...base, ok: false, rowCount: 0, message: `${type} OAuth is configured; authorize an account before the first sync.` };
  return { ...base, ok: false, rowCount: 0, message: `${type} credentials are not configured yet.` };
}

async function createDataSync(payload, ownerId) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const source = payload.sourceId ? db.data_sources.find((item) => item.id === payload.sourceId && item.ownerId === ownerId) : null;
    if (payload.sourceId && !source) throw new Error("Data source not found");
    const test = await testDataConnector({ ...source, ...payload });
    const sync = withId({
      sourceId: source?.id || payload.sourceId || null,
      ownerId,
      clientName: payload.clientName || source?.clientName || "",
      type: payload.type || source?.type || "manual_csv",
      status: test.ok ? "synced" : "needs_credentials",
      mode: test.mode,
      provider: test.provider,
      rowCount: test.rowCount || source?.rowCount || 0,
      message: test.message,
      syncedAt: new Date().toISOString(),
    });
    db.data_syncs.push(sync);
    if (source) {
      const index = db.data_sources.findIndex((item) => item.id === source.id);
      db.data_sources[index] = { ...source, status: sync.status, lastSyncAt: sync.syncedAt, lastSyncId: sync.id, rowCount: sync.rowCount };
    }
    db.audit_logs.push(withId({ action: "create:data_syncs", recordId: sync.id }));
    await writeDb(db);
    return sync;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function sendEmailJob(job) {
  if (!job.to) throw new Error("Email job is missing recipient");
  if ((emailProvider === "api" || emailProvider === "resend") && emailApiUrl && emailApiKey) {
    const response = await fetch(emailApiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${emailApiKey}`,
      },
      body: JSON.stringify({
        from: job.from || emailFrom,
        to: job.to,
        subject: job.subject || "Your AgencyReport AI report is ready",
        html: job.html || `<p>${escapeHtml(job.body || "Your report is ready.")}</p>`,
        text: job.body || "",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || `Email provider returned ${response.status}`);
    return {
      status: "sent",
      provider: emailProvider,
      sentAt: new Date().toISOString(),
      providerMessageId: data.id || data.messageId || data.data?.id || null,
    };
  }
  return {
    status: emailProvider === "mock" ? "sent" : "ready_to_send",
    provider: emailProvider,
    sentAt: emailProvider === "mock" ? new Date().toISOString() : null,
    providerMessageId: emailProvider === "mock" ? `mock-${crypto.randomBytes(6).toString("hex")}` : null,
  };
}

async function updateEmailJobStatus(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.email_jobs.findIndex((item) => item.id === payload.id);
    if (index === -1) throw new Error("Email job not found");
    const updated = {
      ...db.email_jobs[index],
      ...definedFields(payload),
      updatedAt: new Date().toISOString(),
    };
    db.email_jobs[index] = updated;
    db.audit_logs.push(withId({ action: "update:email_jobs", recordId: updated.id }));
    await writeDb(db);
    return updated;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function sendStoredEmailJob(payload) {
  const db = await readDb();
  const job = db.email_jobs.find((item) => item.id === payload.id);
  if (!job) throw new Error("Email job not found");
  try {
    const result = await sendEmailJob(job);
    return await updateEmailJobStatus({ id: job.id, ...result });
  } catch (error) {
    return await updateEmailJobStatus({ id: job.id, status: "failed", provider: emailProvider, error: error.message });
  }
}

async function processDueSchedules() {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const now = new Date();
    const due = db.schedules.filter((schedule) => {
      if ((schedule.status || "active") !== "active") return false;
      return new Date(schedule.nextRunAt || schedule.createdAt || 0) <= now;
    });
    const createdRuns = [];
    const createdEmails = [];
    const updatedSchedules = [];
    for (const schedule of due) {
      const draft = await generateAiDraft(schedule);
      const run = withId({
        ...schedule,
        scheduleId: schedule.id,
        status: "completed",
        ...draft,
        mode: draft.mode === "live" ? "scheduled-live" : "scheduled-fallback",
      });
      db.ai_runs.push(run);
      createdRuns.push(run);
      if (schedule.deliveryEmail) {
        let email = withId({
          ownerId: schedule.ownerId,
          agencyName: schedule.agencyName,
          clientName: schedule.clientName,
          reportMonth: schedule.reportMonth,
          reportType: schedule.reportType,
          to: schedule.deliveryEmail,
          subject: `${schedule.clientName || "Client"} scheduled report draft`,
          body: `A scheduled report draft is ready for PM review. Schedule: ${schedule.cadence || "monthly"}.`,
          status: "queued",
          provider: emailProvider,
          scheduleId: schedule.id,
          queuedAt: new Date().toISOString(),
        });
        try {
          email = { ...email, ...(await sendEmailJob(email)) };
        } catch (error) {
          email = { ...email, status: "failed", error: error.message, provider: emailProvider };
        }
        db.email_jobs.push(email);
        createdEmails.push(email);
      }
      schedule.lastRunAt = now.toISOString();
      schedule.nextRunAt = nextScheduleRun(schedule, now);
      schedule.updatedAt = now.toISOString();
      updatedSchedules.push(schedule);
      db.audit_logs.push(withId({ action: "worker:run_schedule", recordId: schedule.id }));
    }
    await writeDb(db);
    return { processed: due.length, aiRuns: createdRuns, emailJobs: createdEmails, schedules: updatedSchedules };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function createRecord(collection, payload, ownerId = null) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const record = withId({ ...payload, ownerId: ownerId || payload.ownerId || null });
    db[collection].push(record);
    db.audit_logs.push(withId({ action: `create:${collection}`, recordId: record.id }));
    await writeDb(db);
    return record;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function upsertOwnedRecord(collection, payload, ownerId) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = payload.id ? db[collection].findIndex((item) => item.id === payload.id && item.ownerId === ownerId) : -1;
    const now = new Date().toISOString();
    const record = index >= 0
      ? { ...db[collection][index], ...definedFields(payload), ownerId, updatedAt: now }
      : withId({ ...definedFields(payload), ownerId, updatedAt: now });
    if (index >= 0) db[collection][index] = record;
    else db[collection].push(record);
    db.audit_logs.push(withId({ action: `${index >= 0 ? "update" : "create"}:${collection}`, recordId: record.id, ownerId }));
    await writeDb(db);
    return record;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function deleteOwnedRecord(collection, id, ownerId) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db[collection].findIndex((item) => item.id === id && item.ownerId === ownerId);
    if (index === -1) return null;
    const [record] = db[collection].splice(index, 1);
    db.audit_logs.push(withId({ action: `delete:${collection}`, recordId: id, ownerId }));
    await writeDb(db);
    return record;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function updatePortalSubmission(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.portal_submissions.findIndex((item) => item.id === payload.id || item.token === payload.token);
    if (index === -1) throw new Error("Portal submission not found");
    const updated = {
      ...db.portal_submissions[index],
      ...definedFields(payload),
      status: payload.status || "processed",
      processedAt: payload.processedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.portal_submissions[index] = updated;
    db.audit_logs.push(withId({ action: "update:portal_submissions", recordId: updated.id || updated.token }));
    await writeDb(db);
    return updated;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function updateBillingIntent(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.billing_intents.findIndex((item) => item.id === payload.id || item.token === payload.token);
    if (index === -1) throw new Error("Billing quote not found");
    const updated = {
      ...db.billing_intents[index],
      ...definedFields(payload),
      status: payload.status || "accepted",
      acceptedAt: payload.acceptedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.billing_intents[index] = updated;
    db.audit_logs.push(withId({ action: "update:billing_intents", recordId: updated.id || updated.token }));
    await writeDb(db);
    return updated;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function syncSubscriptionFromPayment(db, record, source) {
  if (!record) return null;
  db.subscriptions = Array.isArray(db.subscriptions) ? db.subscriptions : [];
  const email = String(record.accountEmail || record.email || "").trim().toLowerCase();
  if (!email) return null;
  const now = new Date().toISOString();
  const existingIndex = db.subscriptions.findIndex((item) => {
    const itemEmail = String(item.accountEmail || item.email || "").trim().toLowerCase();
    return item.status === "active" && itemEmail === email;
  });
  const subscription = {
    ...(existingIndex >= 0 ? db.subscriptions[existingIndex] : {}),
    accountEmail: record.accountEmail || record.email,
    accountName: record.accountName || record.clientName || "",
    plan: normalizePlan(record.plan),
    status: "active",
    source,
    sourceRecordId: record.id || record.token || null,
    paymentVerifiedAt: record.paymentVerifiedAt || now,
    updatedAt: now,
    createdAt: existingIndex >= 0 ? db.subscriptions[existingIndex].createdAt : now,
  };
  if (existingIndex >= 0) {
    db.subscriptions[existingIndex] = subscription;
  } else {
    db.subscriptions.push(withId(subscription));
  }
  return existingIndex >= 0 ? db.subscriptions[existingIndex] : db.subscriptions[db.subscriptions.length - 1];
}

async function recordPaymentEvent(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const eventPayload = {
      provider: payload.provider || paymentProvider,
      type: payload.type || payload.eventType || "payment.event",
      paymentStatus: payload.paymentStatus || payload.status || "received",
      token: payload.token || payload.CustomField1 || payload.data?.object?.metadata?.token || null,
      checkoutSessionId: payload.checkoutSessionId || payload.MerchantTradeNo || payload.data?.object?.id || null,
      raw: payload.raw || payload,
      receivedAt: new Date().toISOString(),
    };
    const duplicate = db.payment_events.find((item) =>
      item.provider === eventPayload.provider
      && item.type === eventPayload.type
      && item.checkoutSessionId === eventPayload.checkoutSessionId
      && item.paymentStatus === eventPayload.paymentStatus
    );
    if (duplicate) return duplicate;
    const event = withId(eventPayload);
    db.payment_events.push(event);
    const token = event.token;
    if (token && ["checkout.session.completed", "payment_intent.succeeded", "mock.payment_succeeded", "ecpay.payment_succeeded"].includes(event.type)) {
      const index = db.billing_intents.findIndex((item) => item.token === token || item.checkoutSessionId === event.checkoutSessionId);
      if (index >= 0) {
        db.billing_intents[index] = {
          ...db.billing_intents[index],
          paymentStatus: "paid",
          trustedPayment: true,
          status: db.billing_intents[index].status === "accepted" ? "accepted" : "paid",
          paidAt: new Date().toISOString(),
          paymentVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        syncSubscriptionFromPayment(db, db.billing_intents[index], "payment_webhook");
      }
    }
    db.audit_logs.push(withId({ action: "create:payment_events", recordId: event.id }));
    await writeDb(db);
    return event;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function connectorDeploymentStatus() {
  const requirements = {
    CONNECTOR_ENCRYPTION_KEY: connectorEncryptionReady(),
    APP_BASE_URL: Boolean(appBaseUrl),
    GOOGLE_OAUTH_CLIENT_ID: Boolean(googleOAuthClientId),
    GOOGLE_OAUTH_CLIENT_SECRET: Boolean(googleOAuthClientSecret),
    GOOGLE_ADS_DEVELOPER_TOKEN: Boolean(googleAdsDeveloperToken),
    META_APP_ID: Boolean(metaAppId),
    META_APP_SECRET: Boolean(metaAppSecret),
  };
  return {
    allReady: connectorEnv.ga4 && connectorEnv.google_ads && connectorEnv.meta_ads,
    vaultReady: connectorEncryptionReady(),
    missing: Object.entries(requirements).filter(([, ready]) => !ready).map(([key]) => key),
    providers: {
      ga4: connectorStatus("ga4"),
      googleAds: connectorStatus("google_ads"),
      metaAds: connectorStatus("meta_ads"),
    },
    versions: { googleAds: googleAdsApiVersion, metaGraph: metaGraphVersion },
    callbacks: appBaseUrl ? {
      ga4: `${appBaseUrl}/api/connectors/oauth/callback/ga4`,
      googleAds: `${appBaseUrl}/api/connectors/oauth/callback/google_ads`,
      metaAds: `${appBaseUrl}/api/connectors/oauth/callback/meta_ads`,
    } : {},
  };
}

async function recordRefundReconciliation(payload, ownerId) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    db.refund_records = Array.isArray(db.refund_records) ? db.refund_records : [];
    const intent = db.billing_intents.find((item) => item.id === payload.billingIntentId && item.ownerId === ownerId);
    if (!intent) throw new Error("BILLING_INTENT_NOT_FOUND");
    if (!intent.trustedPayment || intent.paymentStatus !== "paid") throw new Error("PAYMENT_NOT_VERIFIED");

    const amount = Number(payload.amount);
    const paidAmount = Number(intent.amount || 0);
    const providerRefundReference = String(payload.providerRefundReference || "").trim();
    const reason = String(payload.reason || "").trim();
    if (!Number.isInteger(amount) || amount <= 0) throw new Error("REFUND_AMOUNT_INVALID");
    if (!providerRefundReference) throw new Error("REFUND_REFERENCE_REQUIRED");
    if (!reason) throw new Error("REFUND_REASON_REQUIRED");
    if (db.refund_records.some((item) => item.provider === "ecpay" && item.providerRefundReference === providerRefundReference)) {
      throw new Error("REFUND_REFERENCE_DUPLICATE");
    }

    const priorAmount = db.refund_records
      .filter((item) => item.billingIntentId === intent.id && item.status === "recorded")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (amount > paidAmount - priorAmount) throw new Error("REFUND_AMOUNT_EXCEEDS_PAYMENT");

    const now = new Date().toISOString();
    const totalRefunded = priorAmount + amount;
    const fullyRefunded = totalRefunded === paidAmount;
    const record = withId({
      ownerId,
      billingIntentId: intent.id,
      provider: "ecpay",
      providerRefundReference,
      currency: intent.currency || "TWD",
      amount,
      reason,
      actorId: ownerId,
      status: "recorded",
      verificationStatus: "manual_reconciliation",
      recordedAt: now,
    });
    db.refund_records.push(record);

    const intentIndex = db.billing_intents.findIndex((item) => item.id === intent.id);
    db.billing_intents[intentIndex] = {
      ...intent,
      refundStatus: fullyRefunded ? "refunded" : "partially_refunded",
      refundedAmount: totalRefunded,
      updatedAt: now,
    };
    if (fullyRefunded) {
      db.subscriptions = (Array.isArray(db.subscriptions) ? db.subscriptions : []).map((item) => (
        item.sourceRecordId === intent.id && item.status === "active"
          ? { ...item, status: "canceled", cancelReason: "full_refund", canceledAt: now, updatedAt: now }
          : item
      ));
    }
    db.audit_logs.push(withId({
      action: "create:refund_records",
      recordId: record.id,
      ownerId,
      billingIntentId: intent.id,
    }));
    await writeDb(db);
    return record;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function createInvoiceFromQuote(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const quote = db.billing_intents.find((item) => item.id === payload.id || item.token === payload.token);
    if (!quote) throw new Error("Billing quote not found");
    if (quote.status !== "accepted") throw new Error("Quote must be accepted before invoicing");
    const existing = db.invoices.find((invoice) => invoice.quoteId === quote.id || invoice.quoteToken === quote.token);
    if (existing) return existing;
    const token = crypto.randomBytes(10).toString("hex");
    const invoice = withId({
      accountName: quote.accountName,
      accountEmail: quote.accountEmail,
      clientName: quote.clientName || payload.clientName || "",
      plan: quote.plan,
      currency: quote.currency || "TWD",
      amount: quote.amount || 0,
      status: "draft",
      quoteId: quote.id,
      quoteToken: quote.token,
      token,
      invoiceUrl: `/billing/invoice/${token}`,
      invoiceNumber: `AR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(db.invoices.length + 1).padStart(3, "0")}`,
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    db.invoices.push(invoice);
    db.audit_logs.push(withId({ action: "create:invoices", recordId: invoice.id, source: "accepted_quote" }));
    await writeDb(db);
    return invoice;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function ecpayCheckoutHtml(token, nonce) {
  const db = await readDb();
  const intent = db.billing_intents.find((item) => item.token === token || item.id === token);
  if (!intent) return null;
  if (paymentProvider !== "ecpay" || !ecpayReady()) {
    return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8" /><title>ECPay not configured</title></head><body><main><h1>綠界付款尚未設定完成</h1><p>請確認 PAYMENT_PROVIDER=ecpay、ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV 與回調網址。</p></main></body></html>`;
  }
  const payload = ecpayPayloadForIntent(intent);
  return autoSubmitForm(ecpayCheckoutUrl, payload, nonce);
}

async function ecpayResultHtml(url) {
  const tradeNo = url.searchParams.get("MerchantTradeNo") || url.searchParams.get("merchantTradeNo") || "";
  const token = url.searchParams.get("CustomField1") || url.searchParams.get("token") || "";
  const db = await readDb();
  const intent = db.billing_intents.find((item) => (token && item.token === token) || (tradeNo && item.checkoutSessionId === tradeNo));
  const paid = intent?.trustedPayment || intent?.paymentStatus === "paid";
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AgencyReport AI Payment Result</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f8f7;color:#10201f}
    main{max-width:620px;padding:30px;border:1px solid #d9e3df;border-radius:12px;background:white;box-shadow:0 20px 60px rgba(15,23,42,.12)}
    h1{margin:0 0 10px}.ok{color:#0f766e}.warn{color:#a16207}p{color:#60706d;line-height:1.7}a{display:inline-block;margin-top:12px;color:#0f766e;font-weight:800}
  </style>
</head>
<body>
  <main>
    <h1 class="${paid ? "ok" : "warn"}">${paid ? "付款已完成" : "付款結果處理中"}</h1>
    <p>${paid ? "你的方案已啟用，可以回到工作台繼續產生 AI 月報。" : "若你已完成付款，綠界通知可能需要幾秒鐘同步。請稍後回到工作台更新用量。"}</p>
    <p>交易編號：${escapeHtml(tradeNo || intent?.checkoutSessionId || "-")}</p>
    <a href="/">回到 AgencyReport AI</a>
  </main>
</body>
</html>`;
}

async function updateInvoiceStatus(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.invoices.findIndex((item) => item.id === payload.id || item.token === payload.token || item.invoiceNumber === payload.invoiceNumber);
    if (index === -1) throw new Error("Invoice not found");
    const now = new Date().toISOString();
    const updated = {
      ...db.invoices[index],
      ...definedFields(payload),
      status: payload.status || "paid",
      trustedPayment: Boolean(payload.trustedPayment),
      paidAt: payload.paidAt || now,
      paymentVerifiedAt: payload.trustedPayment ? payload.paymentVerifiedAt || now : db.invoices[index].paymentVerifiedAt || null,
      updatedAt: now,
    };
    db.invoices[index] = updated;
    if (updated.status === "paid" && updated.trustedPayment) {
      syncSubscriptionFromPayment(db, updated, "invoice_payment");
    }
    db.audit_logs.push(withId({ action: "update:invoices", recordId: updated.id || updated.token }));
    await writeDb(db);
    return updated;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function createShareLinkRecord(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const latestReport =
      payload.reportId
        ? db.reports.find((item) => item.id === payload.reportId && item.ownerId === payload.ownerId)
        : [...db.reports].reverse().find((item) => item.ownerId === payload.ownerId && (!payload.clientName || item.clientName === payload.clientName));
    const token = payload.token || crypto.randomBytes(10).toString("hex");
    const record = withId({
      ...payload,
      token,
      status: payload.status || "active",
      url: payload.url || `/client/report/${token}`,
      reportId: payload.reportId || latestReport?.id || null,
      reportSnapshot: payload.reportSnapshot || latestReport || null,
      expiresAt: payload.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    db.share_links.push(record);
    db.audit_logs.push(withId({ action: "create:share_links", recordId: record.id, source: "delivery_package" }));
    await writeDb(db);
    return record;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function authHeaderToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  const cookies = String(req.headers.cookie || "").split(";").map((value) => value.trim());
  const session = cookies.find((value) => value.startsWith("agencyreport_session="));
  return session ? decodeURIComponent(session.slice("agencyreport_session=".length)) : "";
}

function currentUsagePeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function normalizePlan(plan) {
  const key = String(plan || "free").trim();
  if (key === "white_label" || key === "white-label") return "whiteLabel";
  if (key === "pro" || key === "professional") return "professional";
  if (planUsageLimits[key]) return key;
  return "free";
}

function userBillingEmails(user) {
  return new Set([user?.email, user?.billingEmail, user?.accountEmail].filter(Boolean).map((email) => String(email).trim().toLowerCase()));
}

function resolveUserSubscription(db, user) {
  const emails = userBillingEmails(user);
  const subscriptions = Array.isArray(db.subscriptions) ? db.subscriptions : [];
  const activeSubscription = subscriptions
    .filter((item) => item.status === "active" && (item.userId === user.id || emails.has(String(item.accountEmail || item.email || "").trim().toLowerCase())))
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")))[0];
  if (activeSubscription) {
    return {
      plan: normalizePlan(activeSubscription.plan),
      source: "subscription",
      subscriptionId: activeSubscription.id,
    };
  }

  const paidInvoice = (Array.isArray(db.invoices) ? db.invoices : [])
    .filter((item) => item.status === "paid" && item.trustedPayment === true && emails.has(String(item.accountEmail || item.email || "").trim().toLowerCase()))
    .sort((a, b) => String(b.paidAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.paidAt || a.updatedAt || a.createdAt || "")))[0];
  if (paidInvoice) {
    return {
      plan: normalizePlan(paidInvoice.plan),
      source: "invoice",
      invoiceId: paidInvoice.id,
    };
  }

  const paidIntent = (Array.isArray(db.billing_intents) ? db.billing_intents : [])
    .filter((item) => item.trustedPayment === true && (item.paymentStatus === "paid" || item.status === "paid") && emails.has(String(item.accountEmail || item.email || "").trim().toLowerCase()))
    .sort((a, b) => String(b.paidAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.paidAt || a.updatedAt || a.createdAt || "")))[0];
  if (paidIntent) {
    return {
      plan: normalizePlan(paidIntent.plan),
      source: "billing_intent",
      billingIntentId: paidIntent.id,
    };
  }

  return { plan: "free", source: "free" };
}

function usageSummary(db, user, feature = "ai_report") {
  const subscription = resolveUserSubscription(db, user);
  const plan = normalizePlan(subscription.plan);
  const period = currentUsagePeriod();
  const limit = Number(planUsageLimits[plan]?.[feature] ?? planUsageLimits.free[feature] ?? 0);
  const events = Array.isArray(db.usage_events) ? db.usage_events : [];
  const used = events.filter((item) => item.userId === user.id && item.feature === feature && item.period === period && item.status === "consumed").length;
  return {
    feature,
    period,
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    subscription,
    planFeatures: planFeatures(plan),
  };
}

async function consumeApiUsage(user, feature = "ai_report", meta = {}) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    db.usage_events = Array.isArray(db.usage_events) ? db.usage_events : [];
    db.subscriptions = Array.isArray(db.subscriptions) ? db.subscriptions : [];
    const summary = usageSummary(db, user, feature);
    if (summary.used >= summary.limit) {
      db.audit_logs.push(withId({
        action: "limit:blocked",
        userId: user.id,
        feature,
        period: summary.period,
        plan: summary.plan,
      }));
      await writeDb(db);
      return { allowed: false, ...summary };
    }
    const event = withId({
      userId: user.id,
      userEmail: user.email,
      feature,
      period: summary.period,
      plan: summary.plan,
      status: "consumed",
      meta,
    });
    db.usage_events.push(event);
    db.audit_logs.push(withId({
      action: "usage:consume",
      recordId: event.id,
      userId: user.id,
      feature,
      period: summary.period,
      plan: summary.plan,
    }));
    await writeDb(db);
    return { allowed: true, ...usageSummary(db, user, feature), eventId: event.id };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function currentSession(req) {
  const token = authHeaderToken(req);
  if (!token) return null;
  const db = await readDb();
  const tokenHash = hashSessionToken(token);
  const session = db.auth_sessions.find((item) => (item.tokenHash === tokenHash || item.token === token) && item.status !== "revoked");
  if (!session || (session.expiresAt && new Date(session.expiresAt) < new Date())) return null;
  const user = db.auth_users.find((item) => item.id === session.userId);
  return user ? { session, user } : null;
}

const emailLinkedAccountCollections = new Set([
  "accounts",
  "billing_intents",
  "email_jobs",
  "invoices",
  "leads",
  "payment_events",
  "refund_records",
  "subscriptions",
]);

function accountRecordBelongsToUser(collection, item, user) {
  if (!item || typeof item !== "object") return false;
  if (collection === "auth_users") return item.id === user.id;
  if (item.ownerId === user.id || item.userId === user.id) return true;
  if (collection === "auth_sessions") return item.userId === user.id;
  if (collection === "audit_logs") {
    return item.ownerId === user.id
      || item.userId === user.id
      || (item.recordId === user.id && String(item.action || "").includes("auth_users"));
  }
  if (!emailLinkedAccountCollections.has(collection)) return false;
  const userEmail = String(user.email || "").trim().toLowerCase();
  return [item.email, item.userEmail, item.accountEmail, item.billingEmail]
    .some((value) => String(value || "").trim().toLowerCase() === userEmail);
}

function sanitizedAccountRecord(collection, item) {
  const copy = { ...item };
  if (collection === "auth_users") {
    delete copy.passwordHash;
    delete copy.emailVerificationTokenHash;
    delete copy.passwordResetTokenHash;
  }
  if (collection === "auth_sessions") {
    delete copy.token;
    delete copy.tokenHash;
  }
  if (collection === "oauth_states") {
    delete copy.stateHash;
    delete copy.pkceVerifierEncrypted;
  }
  if (collection === "connector_credentials") {
    delete copy.accessTokenEncrypted;
    delete copy.refreshTokenEncrypted;
    delete copy.providerPayloadEncrypted;
  }
  return copy;
}

function buildAccountDataExport(db, user) {
  const collections = {};
  Object.keys(emptyDb).forEach((collection) => {
    const records = (Array.isArray(db[collection]) ? db[collection] : [])
      .filter((item) => accountRecordBelongsToUser(collection, item, user))
      .map((item) => sanitizedAccountRecord(collection, item));
    if (records.length) collections[collection] = records;
  });
  return {
    format: "agencyreport-account-export-v1",
    exportedAt: new Date().toISOString(),
    legalVersion,
    account: sanitizedAccountRecord("auth_users", user),
    collections,
  };
}

async function deleteAuthAccount(userId, password, confirmation) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const user = db.auth_users.find((item) => item.id === userId);
    if (!user || !verifyPassword(password, user.passwordHash)) throw new Error("INVALID_PASSWORD");
    if (confirmation !== "DELETE") throw new Error("DELETE_CONFIRMATION_REQUIRED");
    const deleted = {};
    Object.keys(emptyDb).forEach((collection) => {
      const before = Array.isArray(db[collection]) ? db[collection] : [];
      const remaining = before.filter((item) => !accountRecordBelongsToUser(collection, item, user));
      const count = before.length - remaining.length;
      if (count) deleted[collection] = count;
      db[collection] = remaining;
    });
    db.audit_logs.push(withId({
      action: "account:deleted",
      subjectHash: hashSessionToken(`deleted:${user.id}:${user.email}`),
      deletedCollections: deleted,
    }));
    await writeDb(db);
    return { deleted: true, deletedCollections: deleted };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function oneTimeToken(hours = 1) {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
  };
}

function authActionUrl(req, action, token) {
  const origin = appBaseUrl || `http://${req.headers.host || `127.0.0.1:${port}`}`;
  return `${origin}/?${action}=${encodeURIComponent(token)}`;
}

async function sendAuthEmail({ to, subject, body }) {
  try {
    const url = String(body).match(/https?:\/\/\S+/)?.[0] || "";
    const html = url
      ? `<p>${escapeHtml(String(body).replace(url, "").trim())}</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700">${/reset/i.test(subject) || /重設/.test(subject) ? "Reset password / 重設密碼" : "Verify email / 驗證信箱"}</a></p><p style="word-break:break-all;color:#60706d">${escapeHtml(url)}</p>`
      : `<p>${escapeHtml(body)}</p>`;
    const result = await sendEmailJob({ to, subject, body, html });
    return result.status === "sent";
  } catch {
    return false;
  }
}

async function createAuthUser(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || !payload.password) throw new Error("Email and password are required");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("A valid email is required");
    if (String(payload.password).length < 10) throw new Error("Password must be at least 10 characters");
    if (payload.legalAccepted !== true || payload.legalVersion !== legalVersion) {
      throw new Error("You must accept the current Terms and Privacy Policy");
    }
    if (db.auth_users.some((user) => user.email === email)) throw new Error("User already exists");
    const verification = oneTimeToken(24);
    const user = withId({
      email,
      name: payload.name || payload.agencyName || email,
      role: "owner",
      passwordHash: hashPassword(payload.password),
      emailVerifiedAt: null,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
      legalVersion,
      legalAcceptedAt: new Date().toISOString(),
      legalAcceptedIpHash: payload.legalAcceptedIpHash || null,
      legalAcceptedUserAgent: payload.legalAcceptedUserAgent || null,
    });
    db.auth_users.push(user);
    db.consents.push(withId({
      ownerId: user.id,
      userId: user.id,
      type: "account_terms",
      legalVersion,
      status: "accepted",
      acceptedAt: user.legalAcceptedAt,
      acceptedIpHash: user.legalAcceptedIpHash,
      acceptedUserAgent: user.legalAcceptedUserAgent,
    }));
    db.audit_logs.push(withId({ action: "create:auth_users", recordId: user.id }));
    await writeDb(db);
    return { user, verificationToken: verification.token };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function createAuthSession(email, password) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const user = db.auth_users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) throw new Error("Invalid email or password");
    if (user.emailVerifiedAt === null) throw new Error("EMAIL_NOT_VERIFIED");
    const token = crypto.randomBytes(32).toString("hex");
    db.auth_sessions = db.auth_sessions.filter((item) => !item.expiresAt || new Date(item.expiresAt) >= new Date());
    const session = withId({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    db.auth_sessions.push(session);
    db.audit_logs.push(withId({ action: "create:auth_sessions", recordId: session.id }));
    await writeDb(db);
    return { session: { ...session, token }, user };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function issueEmailVerification(email) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const user = db.auth_users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user || user.emailVerifiedAt) return null;
    const verification = oneTimeToken(24);
    user.emailVerificationTokenHash = verification.tokenHash;
    user.emailVerificationExpiresAt = verification.expiresAt;
    user.updatedAt = new Date().toISOString();
    db.audit_logs.push(withId({ action: "auth:verification_requested", userId: user.id }));
    await writeDb(db);
    return { user, token: verification.token };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function verifyEmailAddress(token) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const tokenHash = hashSessionToken(token);
    const user = db.auth_users.find((item) => item.emailVerificationTokenHash === tokenHash);
    if (!user || !user.emailVerificationExpiresAt || new Date(user.emailVerificationExpiresAt) < new Date()) throw new Error("Invalid or expired verification link");
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    db.audit_logs.push(withId({ action: "auth:email_verified", userId: user.id }));
    await writeDb(db);
    return user;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function issuePasswordReset(email) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const user = db.auth_users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user) return null;
    const reset = oneTimeToken(1);
    user.passwordResetTokenHash = reset.tokenHash;
    user.passwordResetExpiresAt = reset.expiresAt;
    user.updatedAt = new Date().toISOString();
    db.audit_logs.push(withId({ action: "auth:password_reset_requested", userId: user.id }));
    await writeDb(db);
    return { user, token: reset.token };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function resetPasswordWithToken(token, password) {
  if (String(password || "").length < 10) throw new Error("Password must be at least 10 characters");
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const tokenHash = hashSessionToken(token);
    const user = db.auth_users.find((item) => item.passwordResetTokenHash === tokenHash);
    if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) throw new Error("Invalid or expired password reset link");
    user.passwordHash = hashPassword(password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.updatedAt = new Date().toISOString();
    db.auth_sessions.forEach((session) => {
      if (session.userId === user.id) session.status = "revoked";
    });
    db.audit_logs.push(withId({ action: "auth:password_reset_completed", userId: user.id }));
    await writeDb(db);
    return user;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function revokeAuthSession(token) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const tokenHash = hashSessionToken(token);
    const index = db.auth_sessions.findIndex((item) => item.tokenHash === tokenHash || item.token === token);
    if (index >= 0) {
      db.auth_sessions[index] = { ...db.auth_sessions[index], status: "revoked", revokedAt: new Date().toISOString() };
      db.audit_logs.push(withId({ action: "update:auth_sessions", recordId: db.auth_sessions[index].id }));
      await writeDb(db);
      return db.auth_sessions[index];
    }
    return null;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  const rateLimit = checkRateLimit(req, url);
  if (!rateLimit.allowed) {
    return json(res, 429, {
      error: "Too many requests",
      code: "RATE_LIMITED",
      limit: rateLimit.limit,
      resetAt: new Date(rateLimit.resetAt).toISOString(),
    });
  }
  if (url.pathname === "/api/health") {
    const readiness = await readinessReport();
    const ai = aiStatus();
    return json(res, 200, {
      ok: true,
      service: "AgencyReport AI API",
      storage: databaseUrl ? "postgres" : "json",
      readiness: {
        ready: readiness.ready,
        score: readiness.score,
        missingRequired: readiness.missingRequired,
      },
      ai,
      email: {
        provider: emailProvider,
        mode: emailStatus().mode,
        from: emailFrom,
      },
      worker: {
        secretRequired: Boolean(workerSecret),
      },
      payment: paymentStatus(),
      connectors: {
        googleSheets: connectorStatus("google_sheets"),
        googleAds: connectorStatus("google_ads"),
        metaAds: connectorStatus("meta_ads"),
        ga4: connectorStatus("ga4"),
        searchConsole: connectorStatus("search_console"),
      },
      connectorDeployment: connectorDeploymentStatus(),
      time: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/readiness" && req.method === "GET") {
    return json(res, 200, { item: await readinessReport() });
  }

  if (url.pathname === "/api/legal" && req.method === "GET") {
    return json(res, 200, {
      item: {
        version: legalVersion,
        privacyRequired: true,
        dataProcessingRequired: true,
        aiDisclosureRequired: true,
        reviewed: false,
        reviewRequired: false,
        note: "Basic operational notice; external counsel review is not a launch gate.",
      },
    });
  }

  if (url.pathname === "/api/plans" && req.method === "GET") {
    return json(res, 200, { items: publicPlans() });
  }

  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      payload.legalAcceptedIpHash = crypto.createHash("sha256").update(clientIp(req)).digest("hex");
      payload.legalAcceptedUserAgent = String(req.headers["user-agent"] || "").slice(0, 500);
      const { user, verificationToken } = await createAuthUser(payload);
      const verificationUrl = authActionUrl(req, "verify_email", verificationToken);
      const emailSent = await sendAuthEmail({
        to: user.email,
        subject: payload.language === "en" ? "Verify your AgencyReport AI account" : "驗證你的 AgencyReport AI 帳號",
        body: payload.language === "en" ? `Open this link within 24 hours to verify your account: ${verificationUrl}` : `請在 24 小時內開啟此連結完成帳號驗證：${verificationUrl}`,
      });
      return json(res, 201, { item: {
        requiresEmailVerification: true,
        emailSent,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...(process.env.NODE_ENV === "test" ? { verificationToken } : {}),
      } });
    } catch (error) {
      const message = error.message || "Registration failed";
      const status = message === "User already exists" ? 409 : 400;
      return json(res, status, { error: message });
    }
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const { session, user } = await createAuthSession(payload.email, payload.password);
      return json(res, 200, { item: {
        ...(process.env.NODE_ENV === "test" ? { token: session.token } : {}),
        expiresAt: session.expiresAt,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      } }, { "set-cookie": sessionCookie(session.token, session.expiresAt) });
    } catch (error) {
      const notVerified = error.message === "EMAIL_NOT_VERIFIED";
      return json(res, notVerified ? 403 : 401, { error: notVerified ? "Email verification required" : (error.message || "Invalid email or password"), code: notVerified ? "EMAIL_NOT_VERIFIED" : "INVALID_CREDENTIALS" });
    }
  }

  if (url.pathname === "/api/auth/verify-email" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const user = await verifyEmailAddress(payload.token);
      return json(res, 200, { item: { verified: true, email: user.email } });
    } catch (error) {
      return json(res, 400, { error: error.message || "Email verification failed", code: "VERIFY_EMAIL_FAILED" });
    }
  }

  if (url.pathname === "/api/auth/resend-verification" && req.method === "POST") {
    const payload = await readBody(req);
    const issued = await issueEmailVerification(payload.email);
    let emailSent = false;
    if (issued) {
      emailSent = await sendAuthEmail({
        to: issued.user.email,
        subject: payload.language === "en" ? "Verify your AgencyReport AI account" : "驗證你的 AgencyReport AI 帳號",
        body: payload.language === "en" ? `Open this link within 24 hours to verify your account: ${authActionUrl(req, "verify_email", issued.token)}` : `請在 24 小時內開啟此連結完成帳號驗證：${authActionUrl(req, "verify_email", issued.token)}`,
      });
    }
    return json(res, 200, { item: { accepted: true, ...(process.env.NODE_ENV === "test" ? { emailSent, ...(issued ? { verificationToken: issued.token } : {}) } : {}) } });
  }

  if (url.pathname === "/api/auth/request-password-reset" && req.method === "POST") {
    const payload = await readBody(req);
    const issued = await issuePasswordReset(payload.email);
    let emailSent = false;
    if (issued) {
      emailSent = await sendAuthEmail({
        to: issued.user.email,
        subject: payload.language === "en" ? "Reset your AgencyReport AI password" : "重設你的 AgencyReport AI 密碼",
        body: payload.language === "en" ? `Open this link within 1 hour to reset your password: ${authActionUrl(req, "reset_password", issued.token)}` : `請在 1 小時內開啟此連結重設密碼：${authActionUrl(req, "reset_password", issued.token)}`,
      });
    }
    return json(res, 200, { item: { accepted: true, ...(process.env.NODE_ENV === "test" ? { emailSent, ...(issued ? { resetToken: issued.token } : {}) } : {}) } });
  }

  if (url.pathname === "/api/auth/reset-password" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      await resetPasswordWithToken(payload.token, payload.password);
      return json(res, 200, { item: { reset: true } });
    } catch (error) {
      return json(res, 400, { error: error.message || "Password reset failed", code: "PASSWORD_RESET_FAILED" });
    }
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const auth = await currentSession(req);
    if (!auth) return json(res, 401, { error: "Unauthorized" });
    const db = await readDb();
    return json(res, 200, { item: { id: auth.user.id, email: auth.user.email, name: auth.user.name, role: auth.user.role, expiresAt: auth.session.expiresAt, usage: usageSummary(db, auth.user, "ai_report") } });
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    await revokeAuthSession(authHeaderToken(req));
    return json(res, 200, { ok: true }, { "set-cookie": clearSessionCookie() });
  }

  if (url.pathname === "/api/worker/run" && req.method === "POST") {
    if (!isWorkerAuthorized(req)) return json(res, 401, { error: "Unauthorized worker" });
    const [result, connectors] = await Promise.all([processDueSchedules(), processDueConnectorSources()]);
    return json(res, 200, {
      item: {
        processed: result.processed + connectors.processed,
        scheduleProcessed: result.processed,
        connectorProcessed: connectors.processed,
        aiRunIds: result.aiRuns.map((item) => item.id),
        connectorAiRunIds: connectors.reports.map((item) => item.id),
        emailJobIds: result.emailJobs.map((item) => item.id),
        scheduleIds: result.schedules.map((item) => item.id),
        connectorJobIds: connectors.completed.map((item) => item.jobId),
        connectorFailures: connectors.failed,
      },
    });
  }

  if (url.pathname === "/api/billing/webhook" && req.method === "POST") {
    const payload = await readAnyBody(req);
    if (!hasTrustedPaymentSignal(req, payload)) {
      return json(res, 403, { error: "Forbidden", code: "PAYMENT_WEBHOOK_UNVERIFIED" });
    }
    const event = await recordPaymentEvent({
      ...payload,
      provider: payload.provider || paymentProvider,
      type: payload.type || payload.eventType || "mock.payment_event",
    });
    return json(res, 200, { item: event });
  }

  if (url.pathname === "/api/billing/ecpay/return" && req.method === "POST") {
    const payload = await readAnyBody(req);
    if (!verifyEcpayCheckMacValue(payload) || !(await validateEcpayCallback(payload))) {
      return json(res, 403, { error: "Forbidden", code: "ECPAY_CHECK_MAC_INVALID" });
    }
    const paid = String(payload.RtnCode || "") === "1";
    const event = await recordPaymentEvent({
      ...payload,
      provider: "ecpay",
      type: paid ? "ecpay.payment_succeeded" : "ecpay.payment_failed",
      paymentStatus: paid ? "paid" : "failed",
      token: payload.CustomField1,
      checkoutSessionId: payload.MerchantTradeNo,
      raw: payload,
    });
    res.writeHead(200, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    res.end("1|OK");
    return event;
  }

  const connectorCallback = url.pathname.match(/^\/api\/connectors\/oauth\/callback\/(ga4|google_ads|meta_ads)$/);
  if (connectorCallback && req.method === "GET") {
    const provider = connectorCallback[1];
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    if (!code || !state) return json(res, 400, { error: "OAuth callback is missing code or state", code: "CONNECTOR_OAUTH_CALLBACK_INVALID" });
    try {
      await exchangeConnectorAuthorizationCode(provider, code, state);
      const destination = `${appBaseUrl || "/"}${appBaseUrl ? "/" : ""}?connector=${encodeURIComponent(provider)}&status=connected`;
      res.writeHead(302, securityHeaders({ location: destination, "cache-control": "no-store" }));
      return res.end();
    } catch (error) {
      const rawCode = String(error.message || "CONNECTOR_OAUTH_CALLBACK_FAILED").split(":")[0];
      const known = new Set([
        "CONNECTOR_PROVIDER_UNSUPPORTED",
        "CONNECTOR_OAUTH_STATE_INVALID",
        "CONNECTOR_OAUTH_STATE_REPLAYED",
        "CONNECTOR_OAUTH_STATE_EXPIRED",
        "CONNECTOR_TOKEN_EXCHANGE_FAILED",
        "CONNECTOR_SECRET_INVALID",
      ]);
      return json(res, 400, { error: "Connector authorization failed", code: known.has(rawCode) ? rawCode : "CONNECTOR_OAUTH_CALLBACK_FAILED" });
    }
  }

  const isPublicWrite =
    (url.pathname === "/api/leads" && req.method === "POST") ||
    (url.pathname === "/api/feedback" && req.method === "POST") ||
    (url.pathname === "/api/portal-submissions" && req.method === "POST") ||
    (url.pathname === "/api/billing/quote/accept" && req.method === "POST") ||
    (url.pathname === "/api/billing/invoice/pay" && req.method === "POST");
  if (!isPublicWrite) {
    const auth = await currentSession(req);
    if (!auth) return json(res, 401, { error: "Unauthorized" });
    req.auth = auth;
  }

  if (url.pathname === "/api/account/export" && req.method === "GET") {
    const db = await readDb();
    const exported = buildAccountDataExport(db, req.auth.user);
    const date = new Date().toISOString().slice(0, 10);
    return json(res, 200, { item: exported }, {
      "content-disposition": `attachment; filename="agencyreport-account-${date}.json"`,
      "cache-control": "no-store",
    });
  }

  if (url.pathname === "/api/account" && req.method === "DELETE") {
    try {
      const payload = await readBody(req);
      const result = await deleteAuthAccount(req.auth.user.id, payload.password, payload.confirmation);
      return json(res, 200, { item: result }, {
        "set-cookie": clearSessionCookie(),
        "cache-control": "no-store",
      });
    } catch (error) {
      const invalidPassword = error.message === "INVALID_PASSWORD";
      const invalidConfirmation = error.message === "DELETE_CONFIRMATION_REQUIRED";
      return json(res, 400, {
        error: invalidPassword ? "Password is incorrect" : invalidConfirmation ? "Type DELETE to confirm account deletion" : "Account deletion failed",
        code: error.message || "ACCOUNT_DELETE_FAILED",
      });
    }
  }

  if (url.pathname === "/api/connectors/oauth/start" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const item = await createConnectorOAuthAuthorization(req.auth.user.id, payload.provider || payload.type);
      return json(res, 201, { item });
    } catch (error) {
      const known = new Set([
        "CONNECTOR_PROVIDER_UNSUPPORTED",
        "CONNECTOR_ENCRYPTION_KEY_REQUIRED",
        "CONNECTOR_OAUTH_NOT_CONFIGURED",
      ]);
      const code = known.has(error.message) ? error.message : "CONNECTOR_OAUTH_START_FAILED";
      const status = code === "CONNECTOR_PROVIDER_UNSUPPORTED" ? 400 : 503;
      return json(res, status, { error: "Connector authorization could not be started", code });
    }
  }

  if (url.pathname === "/api/connectors/connections" && req.method === "GET") {
    const db = await readDb();
    const items = (Array.isArray(db.connector_credentials) ? db.connector_credentials : [])
      .filter((item) => item.ownerId === req.auth.user.id)
      .map(publicConnectorCredential);
    return json(res, 200, { items });
  }

  if (url.pathname === "/api/connectors/connections" && req.method === "DELETE") {
    try {
      const item = await disconnectConnector(req.auth.user.id, url.searchParams.get("provider") || "");
      return json(res, 200, { item });
    } catch (error) {
      return json(res, 400, { error: "Connector could not be disconnected", code: error.message === "CONNECTOR_PROVIDER_UNSUPPORTED" ? error.message : "CONNECTOR_DISCONNECT_FAILED" });
    }
  }

  if (url.pathname === "/api/connectors/ga4/properties" && req.method === "GET") {
    try {
      return json(res, 200, { items: await listGa4Properties(req.auth.user.id) });
    } catch (error) {
      const code = String(error.message || "GA4_PROPERTIES_FAILED").split(":")[0];
      return json(res, code === "CONNECTOR_NOT_CONNECTED" || code === "CONNECTOR_REAUTH_REQUIRED" ? 409 : 502, { error: "GA4 properties could not be loaded", code });
    }
  }

  if (url.pathname === "/api/connectors/ga4/select" && req.method === "POST") {
    try {
      const item = await selectGa4Property(req.auth.user.id, await readBody(req));
      return json(res, 201, { item });
    } catch (error) {
      const code = String(error.message || "GA4_PROPERTY_SELECT_FAILED").split(":")[0];
      return json(res, code === "CONNECTOR_NOT_CONNECTED" ? 409 : 400, { error: "GA4 property could not be selected", code });
    }
  }

  if (url.pathname === "/api/connectors/ga4/sync" && req.method === "POST") {
    try {
      const item = await syncGa4Source(req.auth.user.id, await readBody(req));
      return json(res, 200, { item });
    } catch (error) {
      const code = String(error.message || "GA4_SYNC_FAILED").split(":")[0];
      const status = code === "DATA_SOURCE_NOT_FOUND" ? 404 : code === "SYNC_DATE_RANGE_INVALID" ? 400 : code === "CONNECTOR_REAUTH_REQUIRED" ? 409 : 502;
      return json(res, status, { error: "GA4 synchronization failed", code });
    }
  }

  if (url.pathname === "/api/connectors/google-ads/customers" && req.method === "GET") {
    try {
      return json(res, 200, { items: await listGoogleAdsCustomers(req.auth.user.id) });
    } catch (error) {
      const code = String(error.message || "GOOGLE_ADS_CUSTOMERS_FAILED").split(":")[0];
      const status = ["CONNECTOR_NOT_CONNECTED", "CONNECTOR_REAUTH_REQUIRED"].includes(code)
        ? 409
        : code === "CONNECTOR_PERMISSION_DENIED"
          ? 403
          : code === "GOOGLE_ADS_DEVELOPER_TOKEN_REQUIRED"
            ? 503
            : 502;
      return json(res, status, {
        error: "Google Ads customers could not be loaded",
        code,
        providerStatus: error.providerStatus || "",
        providerMessage: error.providerMessage || "",
        providerReason: error.providerReason || "",
      });
    }
  }

  if (url.pathname === "/api/connectors/google-ads/select" && req.method === "POST") {
    try {
      const item = await selectGoogleAdsCustomer(req.auth.user.id, await readBody(req));
      return json(res, 201, { item });
    } catch (error) {
      const code = String(error.message || "GOOGLE_ADS_CUSTOMER_SELECT_FAILED").split(":")[0];
      const status = ["CONNECTOR_NOT_CONNECTED", "CONNECTOR_REAUTH_REQUIRED"].includes(code) ? 409 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 400;
      return json(res, status, { error: "Google Ads customer could not be selected", code });
    }
  }

  if (url.pathname === "/api/connectors/google-ads/sync" && req.method === "POST") {
    try {
      const item = await syncGoogleAdsSource(req.auth.user.id, await readBody(req));
      return json(res, 200, { item });
    } catch (error) {
      const code = String(error.message || "GOOGLE_ADS_SYNC_FAILED").split(":")[0];
      const status = code === "DATA_SOURCE_NOT_FOUND" ? 404 : code === "SYNC_DATE_RANGE_INVALID" ? 400 : code === "CONNECTOR_REAUTH_REQUIRED" ? 409 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 502;
      return json(res, status, { error: "Google Ads synchronization failed", code });
    }
  }

  if (url.pathname === "/api/connectors/meta-ads/accounts" && req.method === "GET") {
    try {
      return json(res, 200, { items: await listMetaAdAccounts(req.auth.user.id) });
    } catch (error) {
      const code = String(error.message || "META_AD_ACCOUNTS_FAILED").split(":")[0];
      const status = ["CONNECTOR_NOT_CONNECTED", "CONNECTOR_REAUTH_REQUIRED"].includes(code) ? 409 : code === "META_APP_SECRET_REQUIRED" ? 503 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 502;
      return json(res, status, { error: "Meta ad accounts could not be loaded", code });
    }
  }

  if (url.pathname === "/api/connectors/meta-ads/select" && req.method === "POST") {
    try {
      const item = await selectMetaAdAccount(req.auth.user.id, await readBody(req));
      return json(res, 201, { item });
    } catch (error) {
      const code = String(error.message || "META_AD_ACCOUNT_SELECT_FAILED").split(":")[0];
      const status = ["CONNECTOR_NOT_CONNECTED", "CONNECTOR_REAUTH_REQUIRED"].includes(code) ? 409 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 400;
      return json(res, status, { error: "Meta ad account could not be selected", code });
    }
  }

  if (url.pathname === "/api/connectors/meta-ads/sync" && req.method === "POST") {
    try {
      const item = await syncMetaAdsSource(req.auth.user.id, await readBody(req));
      return json(res, 200, { item });
    } catch (error) {
      const code = String(error.message || "META_ADS_SYNC_FAILED").split(":")[0];
      const status = code === "DATA_SOURCE_NOT_FOUND" ? 404 : code === "SYNC_DATE_RANGE_INVALID" ? 400 : code === "CONNECTOR_REAUTH_REQUIRED" ? 409 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 502;
      return json(res, status, { error: "Meta Ads synchronization failed", code });
    }
  }

  if (url.pathname === "/api/connectors/metrics" && req.method === "GET") {
    const db = await readDb();
    const sourceId = url.searchParams.get("sourceId") || "";
    const providerParam = url.searchParams.get("provider") || "";
    const provider = providerParam ? normalizeConnectorType(providerParam) : "";
    const items = (Array.isArray(db.normalized_metrics) ? db.normalized_metrics : [])
      .filter((item) => item.ownerId === req.auth.user.id)
      .filter((item) => !sourceId || item.sourceId === sourceId)
      .filter((item) => !provider || item.provider === provider)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return json(res, 200, { items });
  }

  if (url.pathname === "/api/connectors/report-data" && req.method === "GET") {
    const item = await unifiedConnectorReportData(req.auth.user.id, url.searchParams.get("month") || "");
    return json(res, 200, { item });
  }

  if (url.pathname === "/api/connectors/reconciliation" && req.method === "GET") {
    const item = await connectorReconciliation(req.auth.user.id, url.searchParams.get("month") || "");
    return json(res, 200, { item });
  }

  if (url.pathname === "/api/connectors/sync-status" && req.method === "GET") {
    const db = await readDb();
    const sources = (db.data_sources || []).filter((item) => item.ownerId === req.auth.user.id && ["ga4", "google_ads", "meta_ads"].includes(normalizeConnectorType(item.type)));
    const sourceIds = new Set(sources.map((item) => item.id));
    const jobs = (db.sync_jobs || []).filter((item) => item.ownerId === req.auth.user.id && sourceIds.has(item.sourceId)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 50);
    const audits = (db.audit_logs || [])
      .filter((item) => item.ownerId === req.auth.user.id && String(item.action || "").startsWith("connector:"))
      .sort((a, b) => String(b.createdAt || b.updatedAt).localeCompare(String(a.createdAt || a.updatedAt)))
      .slice(0, 30);
    return json(res, 200, { item: {
      sources: sources.map((item) => ({ id: item.id, provider: item.provider || item.type, displayName: item.displayName, status: item.status, lastSyncedAt: item.lastSyncedAt || null, nextSyncAt: item.nextSyncAt || null, rowCount: item.rowCount || 0, consecutiveFailures: item.consecutiveFailures || 0, lastErrorCode: item.lastErrorCode || null })),
      jobs: jobs.map((item) => ({ id: item.id, sourceId: item.sourceId, provider: item.provider, status: item.status, startDate: item.startDate, endDate: item.endDate, rowCount: item.rowCount || 0, attempts: item.attempts || 0, errorCode: item.errorCode || null, createdAt: item.createdAt, completedAt: item.completedAt || null })),
      audits: audits.map((item) => ({ id: item.id, action: item.action, provider: item.provider || null, recordId: item.recordId || null, rowCount: item.rowCount || null, reportMonth: item.reportMonth || null, createdAt: item.createdAt || item.updatedAt || null })),
    } });
  }

  if (url.pathname === "/api/connectors/sync" && req.method === "POST") {
    let source = null;
    try {
      const payload = await readBody(req);
      const db = await readDb();
      source = (db.data_sources || []).find((item) => item.id === payload.sourceId && item.ownerId === req.auth.user.id && ["ga4", "google_ads", "meta_ads"].includes(normalizeConnectorType(item.type)));
      if (!source) throw new Error("DATA_SOURCE_NOT_FOUND");
      const range = payload.startDate && payload.endDate ? validateSyncDateRange(payload) : connectorIncrementalRange(source, db.normalized_metrics);
      const item = await syncClaimedConnectorSource(source, range);
      await finalizeConnectorSchedule(source, item);
      return json(res, 200, { item });
    } catch (error) {
      const code = String(error.message || "CONNECTOR_SYNC_FAILED").split(":")[0];
      if (source) await finalizeConnectorSchedule(source, {}, error);
      const status = code === "DATA_SOURCE_NOT_FOUND" ? 404 : code === "SYNC_DATE_RANGE_INVALID" ? 400 : code === "CONNECTOR_REAUTH_REQUIRED" ? 409 : code === "CONNECTOR_PERMISSION_DENIED" ? 403 : 502;
      return json(res, status, { error: "Connector synchronization failed", code });
    }
  }

  if (url.pathname === "/api/billing/checkout" && req.method === "POST") {
    const status = paymentStatus();
    if (!status.checkoutEnabled) {
      return json(res, 503, {
        error: "Paid checkout is temporarily unavailable while payment provider approval is in progress",
        code: "PAYMENT_NOT_AVAILABLE",
      });
    }
    const payload = await readBody(req);
    const currency = payload.currency || "TWD";
    const plan = payload.plan || "starter";
    const amount = Number(payload.amount || planPrices[plan]?.[currency] || planPrices.starter.TWD);
    const payment = await createPaymentSession({ ...payload, plan, currency, amount });
    const intent = await createRecord("billing_intents", {
      ...payload,
      plan,
      currency: payment.currency || currency,
      amount: payment.amount || amount,
      token: payment.token,
      provider: payment.provider,
      paymentStatus: payment.paymentStatus,
      checkoutSessionId: payment.checkoutSessionId,
      status: "draft",
      quoteUrl: payment.quoteUrl,
      checkoutUrl: payment.checkoutUrl,
      ecpayMerchantTradeNo: payment.ecpayMerchantTradeNo,
      ecpayMerchantTradeDate: payment.ecpayMerchantTradeDate,
    }, req.auth.user.id);
    return json(res, 201, { item: intent });
  }

  if (url.pathname === "/api/billing/refunds" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const record = await recordRefundReconciliation(payload, req.auth.user.id);
      return json(res, 201, { item: record });
    } catch (error) {
      const codes = new Set([
        "BILLING_INTENT_NOT_FOUND",
        "PAYMENT_NOT_VERIFIED",
        "REFUND_AMOUNT_INVALID",
        "REFUND_REFERENCE_REQUIRED",
        "REFUND_REASON_REQUIRED",
        "REFUND_REFERENCE_DUPLICATE",
        "REFUND_AMOUNT_EXCEEDS_PAYMENT",
      ]);
      const code = codes.has(error.message) ? error.message : "REFUND_RECORD_FAILED";
      const status = code === "BILLING_INTENT_NOT_FOUND" ? 404 : code === "PAYMENT_NOT_VERIFIED" ? 409 : 400;
      return json(res, status, { error: "Refund reconciliation record was not created", code });
    }
  }

  if (url.pathname === "/api/usage" && req.method === "GET") {
    const db = await readDb();
    return json(res, 200, { item: usageSummary(db, req.auth.user, "ai_report") });
  }

  if (url.pathname === "/api/data-sources/test" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const result = await testDataConnector(payload);
      return json(res, result.ok ? 200 : 400, { item: result, ...(result.ok ? {} : { error: result.message }) });
    } catch (error) {
      return json(res, 400, { error: error.message || "Data source test failed", code: "DATA_SOURCE_INVALID" });
    }
  }

  if (url.pathname === "/api/data-sources/sync" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const sync = await createDataSync(payload, req.auth.user.id);
      return json(res, 201, { item: sync });
    } catch (error) {
      const missing = error.message === "Data source not found";
      return json(res, missing ? 404 : 400, { error: error.message || "Data source sync failed", code: missing ? "DATA_SOURCE_NOT_FOUND" : "DATA_SOURCE_SYNC_FAILED" });
    }
  }

  if (url.pathname === "/api/billing/quote/accept" && req.method === "POST") {
    const payload = await readBody(req);
    const quote = await updateBillingIntent({
      token: payload.token,
      id: payload.id,
      acceptedBy: payload.acceptedBy || payload.email || null,
      acceptanceNote: payload.acceptanceNote || "",
      legalVersion: payload.legalVersion || legalVersion,
      status: "accepted",
    });
    return json(res, 200, { item: quote });
  }

  if (url.pathname === "/api/billing/quote/invoice" && req.method === "POST") {
    const payload = await readBody(req);
    const invoice = await createInvoiceFromQuote(payload);
    return json(res, 201, { item: invoice });
  }

  if (url.pathname === "/api/billing/invoice/pay" && req.method === "POST") {
    const payload = await readBody(req);
    if (!hasTrustedPaymentSignal(req, payload)) {
      return json(res, 403, { error: "Forbidden", code: "PAYMENT_CONFIRMATION_UNVERIFIED" });
    }
    const invoice = await updateInvoiceStatus({
      token: payload.token,
      id: payload.id,
      invoiceNumber: payload.invoiceNumber,
      paymentMethod: payload.paymentMethod || "manual_confirmation",
      legalVersion: payload.legalVersion || legalVersion,
      trustedPayment: true,
      status: "paid",
    });
    return json(res, 200, { item: invoice });
  }

  if (url.pathname === "/api/report/deliver" && req.method === "POST") {
    const payload = await readBody(req);
    const delivery = await createRecord("deliveries", {
      ...payload,
      status: payload.status || "delivered",
      deliveredAt: new Date().toISOString(),
    }, req.auth.user.id);
    return json(res, 201, { item: delivery });
  }

  if (url.pathname === "/api/share-links" && req.method === "POST") {
    const payload = await readBody(req);
    const link = await createShareLinkRecord({ ...payload, ownerId: req.auth.user.id });
    return json(res, 201, { item: link });
  }

  if (url.pathname === "/api/email-jobs" && req.method === "POST") {
    const payload = await readBody(req);
    const job = await createRecord("email_jobs", {
      ...payload,
      status: payload.status || "queued",
      provider: payload.provider || "manual",
      body:
        payload.body ||
        `Your ${payload.reportMonth || ""} ${payload.reportType || "report"} is ready for review: ${payload.shareUrl || payload.url || ""}`.trim(),
      queuedAt: new Date().toISOString(),
    }, req.auth.user.id);
    return json(res, 201, { item: job });
  }

  if (url.pathname === "/api/email-jobs/send" && req.method === "POST") {
    const payload = await readBody(req);
    const job = await sendStoredEmailJob(payload);
    return json(res, 200, { item: job });
  }

  if (url.pathname === "/api/report/run" && req.method === "POST") {
    const payload = await readBody(req);
    const usage = await consumeApiUsage(req.auth.user, "ai_report", {
      endpoint: "/api/report/run",
      clientName: payload.clientName || "",
      reportMonth: payload.reportMonth || "",
      reportType: payload.reportType || "",
    });
    if (!usage.allowed) {
      return json(res, 403, {
        error: "LIMIT_EXCEEDED",
        code: "LIMIT_EXCEEDED",
        message: "Monthly AI report quota exceeded. Upgrade to continue.",
        item: usage,
      });
    }
    const draft = await generateAiDraft(payload);
    const run = await createRecord("ai_runs", {
      ...payload,
      status: "completed",
      ...draft,
      usageEventId: usage.eventId,
      usage,
    }, req.auth.user.id);
    return json(res, 201, { item: run });
  }

  if (url.pathname === "/api/report/schedule" && req.method === "POST") {
    const payload = await readBody(req);
    const schedule = await createRecord("schedules", {
      ...payload,
      status: "active",
      nextRunAt: payload.nextRunAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, req.auth.user.id);
    return json(res, 201, { item: schedule });
  }

  if (url.pathname === "/api/portal-submissions/process" && req.method === "POST") {
    const payload = await readBody(req);
    const updated = await updatePortalSubmission({
      ...payload,
      status: "processed",
      processedAt: payload.processedAt || new Date().toISOString(),
    });
    return json(res, 200, { item: updated });
  }

  const routes = {
    "/api/accounts": "accounts",
    "/api/team-members": "team_members",
    "/api/templates": "templates",
    "/api/leads": "leads",
    "/api/feedback": "feedback",
    "/api/data-sources": "data_sources",
    "/api/data-syncs": "data_syncs",
    "/api/consents": "consents",
    "/api/clients": "clients",
    "/api/reports": "reports",
    "/api/ai-runs": "ai_runs",
    "/api/schedules": "schedules",
    "/api/deliveries": "deliveries",
    "/api/share-links": "share_links",
    "/api/email-jobs": "email_jobs",
    "/api/invoices": "invoices",
    "/api/payment-events": "payment_events",
    "/api/billing/refunds": "refund_records",
    "/api/billing-intents": "billing_intents",
    "/api/portal-invites": "portal_invites",
    "/api/portal-submissions": "portal_submissions",
    "/api/intake": "intakes",
    "/api/audit-logs": "audit_logs",
  };
  const collection = routes[url.pathname];
  if (!collection) return json(res, 404, { error: "API route not found" });

  if (req.method === "GET") {
    const db = await readDb();
    const items = db[collection].filter((item) => item.ownerId === req.auth.user.id);
    return json(res, 200, { items });
  }

  if (req.method === "POST") {
    const protectedCollections = new Set(["subscriptions", "usage_events", "invoices", "payment_events", "refund_records", "billing_intents", "audit_logs"]);
    if (protectedCollections.has(collection)) {
      return json(res, 403, {
        error: "Forbidden",
        code: "PROTECTED_COLLECTION",
        message: "Use the dedicated API flow for billing, usage, and audit records.",
      });
    }
    const payload = await readBody(req);
    if (collection === "reports") {
      const record = await upsertOwnedRecord(collection, payload, req.auth.user.id);
      return json(res, 201, { item: record });
    }
    if (collection === "feedback") {
      const message = String(payload.message || "").trim();
      const email = String(payload.email || "").trim();
      const type = String(payload.type || "general").trim();
      if (message.length < 8) return json(res, 400, { error: "Feedback message is too short", code: "FEEDBACK_MESSAGE_REQUIRED" });
      if (message.length > 4000) return json(res, 400, { error: "Feedback message is too long", code: "FEEDBACK_MESSAGE_TOO_LONG" });
      if (email && !/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: "A valid email is required", code: "FEEDBACK_EMAIL_INVALID" });
      const allowedTypes = new Set(["bug", "idea", "billing", "connector", "general"]);
      const record = await createRecord("feedback", {
        type: allowedTypes.has(type) ? type : "general",
        message,
        email,
        name: String(payload.name || "").trim().slice(0, 120),
        page: String(payload.page || "").trim().slice(0, 500),
        language: String(payload.language || "").trim().slice(0, 16),
        status: "new",
        submittedAt: new Date().toISOString(),
      }, req.auth?.user?.id || null);
      return json(res, 201, { item: { id: record.id, status: record.status, submittedAt: record.submittedAt } });
    }
    const record = await createRecord(collection, payload, req.auth?.user?.id || null);
    return json(res, 201, { item: record });
  }

  if (req.method === "DELETE") {
    const id = url.searchParams.get("id") || "";
    if (!id) return json(res, 400, { error: "Record id is required" });
    const record = await deleteOwnedRecord(collection, id, req.auth.user.id);
    return record ? json(res, 200, { item: record }) : json(res, 404, { error: "Record not found" });
  }

  return json(res, 405, { error: "Method not allowed" });
}

async function serveStatic(req, res, url) {
  if (url.pathname === "/robots.txt") {
    res.writeHead(200, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end(robotsTxt());
  }
  if (url.pathname === "/sitemap.xml") {
    res.writeHead(200, securityHeaders({ "content-type": "application/xml;charset=utf-8" }));
    return res.end(sitemapXml());
  }
  if (url.pathname === "/legal") {
    res.writeHead(200, securityHeaders({ "content-type": "text/html;charset=utf-8" }));
    return res.end(injectGoogleTag(legalDocumentHtml(url.searchParams.get("lang") === "en" ? "en" : "zh")));
  }
  if (url.pathname.startsWith("/billing/quote/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const nonce = crypto.randomBytes(18).toString("base64");
    const html = injectGoogleTag(await quoteHtml(token, nonce));
    if (html) {
      res.writeHead(200, interactivePageHeaders(nonce, { "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Quote not found");
  }
  if (url.pathname.startsWith("/billing/ecpay/checkout/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const nonce = crypto.randomBytes(18).toString("base64");
    const html = injectGoogleTag(await ecpayCheckoutHtml(token, nonce));
    if (html) {
      res.writeHead(200, interactivePageHeaders(nonce, { "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Checkout not found");
  }
  if (url.pathname === "/billing/ecpay/result") {
    const html = injectGoogleTag(await ecpayResultHtml(url));
    res.writeHead(200, interactivePageHeaders("", { "content-type": "text/html;charset=utf-8" }));
    return res.end(html);
  }
  if (url.pathname.startsWith("/billing/invoice/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const html = injectGoogleTag(await invoiceHtml(token));
    if (html) {
      res.writeHead(200, interactivePageHeaders("", { "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Invoice not found");
  }
  if (url.pathname.startsWith("/client/report/")) {
    const isDownload = url.pathname.endsWith("/download");
    const parts = url.pathname.split("/").filter(Boolean);
    const token = decodeURIComponent(parts[2] || "");
    const html = injectGoogleTag(await clientReportHtml(token));
    if (html) {
      const headers = { "content-type": "text/html;charset=utf-8" };
      if (isDownload) {
        headers["content-disposition"] = `attachment; filename="agencyreport-${token}.html"`;
      }
      res.writeHead(200, securityHeaders(headers));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Report not found");
  }
  const requested = publicStaticPath(url.pathname);
  if (!requested) {
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Not found");
  }
  const filePath = path.resolve(root, decodeURIComponent(requested).replace(/^\/+/, ""));
  const relative = path.relative(root, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Forbidden");
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    res.writeHead(200, securityHeaders({ "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream" }));
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    return await serveStatic(req, res, url);
  } catch (error) {
    return json(res, 500, { error: error.message || "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`AgencyReport AI running at http://127.0.0.1:${port}`);
});
