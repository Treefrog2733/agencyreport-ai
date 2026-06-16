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
const connectorEnv = {
  google_sheets: Boolean(process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  google_ads: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET),
  meta_ads: Boolean(process.env.META_ACCESS_TOKEN || process.env.META_APP_ID),
  ga4: Boolean(process.env.GA4_PROPERTY_ID && (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS)),
  search_console: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS),
};
let writeQueue = Promise.resolve();
let pgPool = null;
let pgStoreReady = false;

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
  data_sources: [],
  data_syncs: [],
  consents: [],
  reports: [],
  ai_runs: [],
  schedules: [],
  intakes: [],
  deliveries: [],
  share_links: [],
  email_jobs: [],
  payment_events: [],
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

const publicStaticFiles = new Set(["/index.html", "/app.js", "/styles.css"]);
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
    ...extra,
  };
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

function emailStatus() {
  const hasLiveCredentials = Boolean(emailApiUrl && emailApiKey && emailFrom);
  const liveProvider = emailProvider === "api" || emailProvider === "resend";
  return {
    provider: emailProvider,
    mode: liveProvider && hasLiveCredentials ? "live-ready" : emailProvider,
    ready: liveProvider && hasLiveCredentials,
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
      )
    `);
    pgStoreReady = true;
  }
  return pgPool;
}

async function readDb() {
  const pool = await postgresPool();
  if (pool) {
    const result = await pool.query("select value from agencyreport_store where key = $1", ["main"]);
    if (!result.rowCount) {
      await writeDb(emptyDb);
      return { ...emptyDb };
    }
    return { ...emptyDb, ...result.rows[0].value };
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
    await pool.query(
      `insert into agencyreport_store (key, value, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      ["main", JSON.stringify({ ...emptyDb, ...db })]
    );
    return;
  }
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function json(res, status, body) {
  res.writeHead(status, securityHeaders({
    "content-type": "application/json;charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-worker-secret, x-agency-webhook-secret, stripe-signature",
  }));
  res.end(JSON.stringify(body));
}

function legalHtml() {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
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
      <p class="eyebrow">AgencyReport AI ? legal-2026-06-16</p>
      <h1>???????????</h1>
      <p>???????? MVP ?????????????????????????? SaaS??????????????????</p>
      <h2>????</h2>
      <ul>
        <li>AgencyReport AI ????????????????????? KPI ???AI ??????????</li>
        <li>AI ?????????????????????????????????????????</li>
      </ul>
      <h2>????</h2>
      <ul>
        <li>?????????????????Email ????????????????????????????</li>
        <li>?????????????????????????????????????????</li>
      </ul>
      <h2>AI ???</h2>
      <ul>
        <li>??????????????????????? AI ???</li>
        <li>? AI ????????????????????</li>
      </ul>
      <h2>????</h2>
      <ul>
        <li>??????????????????????????????????????????????</li>
        <li>?????????????????? Email ???????</li>
      </ul>
    </article>
  </main>
</body>
</html>`;
}
async function quoteHtml(token) {
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
      <p class="eyebrow">AgencyReport AI Quote · ${quote.id}</p>
      <h1>${quote.accountName || "Agency"} 服務報價確認</h1>
      <p>這是一份付款前確認頁，可替換為 Stripe、綠界、藍新或正式金流連結。</p>
      <div class="amount">${quote.currency || "TWD"} ${amount}</div>
      <div class="grid">
        <div class="card"><span>方案</span><strong>${quote.plan || "starter"}</strong></div>
        <div class="card"><span>狀態</span><strong>${quote.status || "draft"}</strong></div>
        <div class="card"><span>帳號 Email</span><strong>${quote.accountEmail || "-"}</strong></div>
        <div class="card"><span>建立時間</span><strong>${quote.createdAt || "-"}</strong></div>
      </div>
      <h2>下一步</h2>
      <ul><li>確認方案、金額與服務範圍。</li><li>正式上線前請替換為真實金流付款頁。</li><li>付款後代理商可啟用自動報告、客戶入口與交付流程。</li></ul>
      <a class="button" href="/legal" target="_blank" rel="noreferrer">查看條款與隱私</a>
      <button class="button" id="acceptQuoteBtn" type="button" ${quote.status === "accepted" ? "disabled" : ""}>${quote.status === "accepted" ? "已接受報價" : "接受報價"}</button>
      <div class="status ${quote.status === "accepted" ? "ok" : ""}" id="quoteStatus">${quote.status === "accepted" ? `已於 ${quote.acceptedAt || "-"} 接受。` : "接受後，代理商會收到可追蹤的 quote accepted 紀錄。"}</div>
    </article>
  </main>
  <script>
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
          body: JSON.stringify({ token, legalVersion: "legal-2026-06-06" })
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
      <p class="eyebrow">AgencyReport AI Invoice · ${invoice.invoiceNumber || invoice.id}</p>
      <h1>${invoice.accountName || "Agency"} 發票草稿</h1>
      <p>此頁為 MVP 發票確認頁，可在正式上線時替換為會計系統、金流或電子發票服務。</p>
      <div class="amount">${invoice.currency || "TWD"} ${amount}</div>
      <div class="grid">
        <div class="card"><span>Invoice</span><strong>${invoiceLabel}</strong></div>
        <div class="card"><span>狀態</span><strong>${invoice.status || "draft"}</strong></div>
        <div class="card"><span>方案</span><strong>${invoice.plan || "-"}</strong></div>
        <div class="card"><span>到期日</span><strong>${invoice.dueAt || "-"}</strong></div>
        <div class="card"><span>帳號 Email</span><strong>${invoice.accountEmail || "-"}</strong></div>
        <div class="card"><span>Quote</span><strong>${invoice.quoteToken || invoice.quoteId || "-"}</strong></div>
      </div>
      <h2>付款前確認</h2>
      <ul><li>請確認方案、金額、到期日與服務範圍。</li><li>正式上線前請串接真實付款、發票與會計流程。</li><li>付款完成後即可啟用客戶入口、自動報告與交付流程。</li></ul>
      <a class="button" href="/legal" target="_blank" rel="noreferrer">查看條款與隱私</a>
      <button class="button" id="payInvoiceBtn" type="button" ${invoice.status === "paid" ? "disabled" : ""}>${invoice.status === "paid" ? "已確認付款" : "確認付款"}</button>
      <div class="status ${invoice.status === "paid" ? "ok" : ""}" id="invoicePayStatus">${invoice.status === "paid" ? `已於 ${invoice.paidAt || "-"} 確認付款。` : "此 MVP 按鈕代表手動付款確認；正式上線時請改接金流 callback。"}</div>
    </article>
  </main>
  <script>
    const token = ${JSON.stringify(invoice.token || token)};
    const button = document.querySelector("#payInvoiceBtn");
    const statusBox = document.querySelector("#invoicePayStatus");
    button?.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "處理中...";
      try {
        const response = await fetch("/api/billing/invoice/pay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token, legalVersion: "legal-2026-06-06" })
        });
        if (!response.ok) throw new Error("Pay failed");
        const data = await response.json();
        button.textContent = "已確認付款";
        statusBox.className = "status ok";
        statusBox.textContent = "已於 " + (data.item.paidAt || new Date().toISOString()) + " 確認付款。";
      } catch (error) {
        button.disabled = false;
        button.textContent = "確認付款";
        statusBox.className = "status";
        statusBox.textContent = "確認失敗，請稍後再試或聯繫代理商。";
      }
    });
  </script>
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

function withId(payload) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload,
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

function paymentStatus() {
  const stripeReady = Boolean(stripeSecretKey && stripeSuccessUrl && stripeCancelUrl);
  const ecpayReady = Boolean(ecpayMerchantId && ecpayHashKey && ecpayHashIv && ecpayReturnUrl && ecpayOrderResultUrl);
  const liveReady = (
    (paymentProvider === "stripe" && stripeReady && Boolean(stripeWebhookSecret)) ||
    (paymentProvider === "ecpay" && ecpayReady)
  );
  return {
    provider: paymentProvider,
    mode: liveReady ? "live-ready" : paymentProvider === "mock" ? "mock" : "needs_credentials",
    webhookReady: paymentProvider === "stripe" ? Boolean(stripeWebhookSecret) : paymentProvider === "ecpay" ? ecpayReady : false,
    checkoutUrl: paymentProvider === "ecpay" ? ecpayCheckoutUrl : undefined,
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

function autoSubmitForm(action, fields) {
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
    <h1>正在前往綠界付款</h1>
    <p>若頁面沒有自動跳轉，請按下方按鈕繼續。</p>
    <form method="post" action="${escapeHtml(action)}">
      ${inputs}
      <button class="button" type="submit">前往付款</button>
    </form>
  </main>
  <script>document.forms[0].submit();</script>
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

function readinessReport() {
  const checks = [
    {
      id: "database",
      label: "Production database",
      ok: Boolean(databaseUrl),
      required: true,
      detail: databaseUrl ? "DATABASE_URL configured." : "Set DATABASE_URL to PostgreSQL before paid launch.",
    },
    {
      id: "auth",
      label: "Auth sessions",
      ok: true,
      required: true,
      detail: "Password auth and bearer sessions are enabled.",
    },
    {
      id: "ai",
      label: "AI provider",
      ok: Boolean(aiApiKey),
      required: true,
      detail: aiApiKey ? `${aiProvider} configured.` : "Set OPENAI_API_KEY or AI_API_KEY for live AI drafts.",
    },
    {
      id: "email",
      label: "Email provider",
      ok: emailStatus().ready,
      required: true,
      detail: emailStatus().ready ? `${emailProvider} email configured.` : "Set EMAIL_PROVIDER=resend, RESEND_API_KEY, and EMAIL_FROM, or use EMAIL_PROVIDER=api with EMAIL_API_URL and EMAIL_API_KEY.",
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
      ok: paymentStatus().mode === "live-ready" && paymentStatus().webhookReady,
      required: true,
      detail: paymentStatus().mode === "live-ready" && paymentStatus().webhookReady
        ? `${paymentProvider} checkout and verified return flow configured.`
        : "Set Stripe credentials or ECPay MerchantID, HashKey, HashIV, ReturnURL, and OrderResultURL.",
    },
    {
      id: "connectors",
      label: "Data connectors",
      ok: connectorEnv.google_ads || connectorEnv.meta_ads || connectorEnv.ga4 || connectorEnv.google_sheets,
      required: false,
      detail: "At least one live connector is recommended; public Sheets CSV can still run MVP delivery.",
    },
    {
      id: "legal",
      label: "Legal template",
      ok: true,
      required: false,
      detail: "MVP legal route exists; replace with counsel-reviewed terms before paid public traffic.",
    },
    {
      id: "backup",
      label: "Backup policy",
      ok: Boolean(process.env.BACKUP_POLICY_URL || process.env.BACKUP_ENABLED),
      required: false,
      detail: "Set BACKUP_POLICY_URL or BACKUP_ENABLED after choosing the production database provider.",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      ok: Boolean(process.env.SENTRY_DSN || process.env.MONITORING_URL),
      required: false,
      detail: "Set SENTRY_DSN or MONITORING_URL for error and uptime monitoring.",
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
      throw new Error(message);
    }
    const content = data.choices?.[0]?.message?.content || "";
    return normalizeAiDraft(payload, parseAiJson(content), { provider: aiProvider, model: aiModel });
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAiDraft(payload) {
  if ((aiProvider === "openai" || aiProvider === "openai-compatible") && aiApiKey) {
    try {
      return { ...(await callOpenAiCompatible(payload)), mode: "live" };
    } catch (error) {
      return { ...fallbackAiDraft(payload), mode: "fallback", providerError: error.message };
    }
  }
  return { ...fallbackAiDraft(payload), mode: "fallback" };
}

function isWorkerAuthorized(req) {
  if (!workerSecret) return true;
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

function connectorStatus(type) {
  const normalized = type || "manual_csv";
  if (normalized === "manual_csv") return { status: "ready", mode: "manual", provider: normalized };
  if (normalized === "google_sheets") return { status: connectorEnv.google_sheets ? "live-ready" : "csv-url-ready", mode: connectorEnv.google_sheets ? "api" : "public_csv", provider: normalized };
  if (connectorEnv[normalized]) return { status: "live-ready", mode: "api", provider: normalized };
  return { status: "needs_credentials", mode: "mock", provider: normalized };
}

function countCsvRows(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

async function testDataConnector(payload) {
  const type = payload.type || payload.sourceType || "manual_csv";
  const base = connectorStatus(type);
  if (type === "manual_csv") {
    const rowCount = countCsvRows(payload.csv || payload.sampleCsv || "");
    return { ...base, ok: rowCount > 1, rowCount, message: rowCount > 1 ? "Manual CSV is parseable." : "Manual CSV needs a header and at least one row." };
  }
  if (type === "google_sheets" && payload.url) {
    const response = await fetch(payload.url);
    if (!response.ok) throw new Error(`Google Sheets CSV returned ${response.status}`);
    const text = await response.text();
    return { ...base, ok: true, rowCount: countCsvRows(text), message: "Google Sheets CSV is reachable." };
  }
  if (base.status === "live-ready") return { ...base, ok: true, rowCount: 0, message: `${type} credentials are configured.` };
  return { ...base, ok: false, rowCount: 0, message: `${type} credentials are not configured yet.` };
}

async function createDataSync(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const source = payload.sourceId ? db.data_sources.find((item) => item.id === payload.sourceId) : null;
    const test = await testDataConnector({ ...source, ...payload });
    const sync = withId({
      sourceId: source?.id || payload.sourceId || null,
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
      ...payload,
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
      const draft = fallbackAiDraft(schedule);
      const run = withId({
        ...schedule,
        scheduleId: schedule.id,
        status: "completed",
        ...draft,
        mode: "scheduled-fallback",
      });
      db.ai_runs.push(run);
      createdRuns.push(run);
      if (schedule.deliveryEmail) {
        const email = withId({
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

async function createRecord(collection, payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const record = withId(payload);
    db[collection].push(record);
    db.audit_logs.push(withId({ action: `create:${collection}`, recordId: record.id }));
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
      ...payload,
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
      ...payload,
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
    const event = withId({
      provider: payload.provider || paymentProvider,
      type: payload.type || payload.eventType || "payment.event",
      paymentStatus: payload.paymentStatus || payload.status || "received",
      token: payload.token || payload.CustomField1 || payload.data?.object?.metadata?.token || null,
      checkoutSessionId: payload.checkoutSessionId || payload.MerchantTradeNo || payload.data?.object?.id || null,
      raw: payload.raw || payload,
      receivedAt: new Date().toISOString(),
    });
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

async function ecpayCheckoutHtml(token) {
  const db = await readDb();
  const intent = db.billing_intents.find((item) => item.token === token || item.id === token);
  if (!intent) return null;
  if (paymentProvider !== "ecpay" || !ecpayReady()) {
    return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8" /><title>ECPay not configured</title></head><body><main><h1>綠界付款尚未設定完成</h1><p>請確認 PAYMENT_PROVIDER=ecpay、ECPAY_MERCHANT_ID、ECPAY_HASH_KEY、ECPAY_HASH_IV 與回調網址。</p></main></body></html>`;
  }
  const payload = ecpayPayloadForIntent(intent);
  return autoSubmitForm(ecpayCheckoutUrl, payload);
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
      ...payload,
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
        ? db.reports.find((item) => item.id === payload.reportId)
        : [...db.reports].reverse().find((item) => !payload.clientName || item.clientName === payload.clientName);
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
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
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
  const session = db.auth_sessions.find((item) => item.token === token && item.status !== "revoked");
  if (!session || (session.expiresAt && new Date(session.expiresAt) < new Date())) return null;
  const user = db.auth_users.find((item) => item.id === session.userId);
  return user ? { session, user } : null;
}

async function createAuthUser(payload) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email || !payload.password) throw new Error("Email and password are required");
    if (db.auth_users.some((user) => user.email === email)) throw new Error("User already exists");
    const user = withId({
      email,
      name: payload.name || payload.agencyName || email,
      role: "owner",
      passwordHash: hashPassword(payload.password),
    });
    db.auth_users.push(user);
    db.audit_logs.push(withId({ action: "create:auth_users", recordId: user.id }));
    await writeDb(db);
    return user;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function createAuthSession(email, password) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const user = db.auth_users.find((item) => item.email === String(email || "").trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) throw new Error("Invalid email or password");
    const session = withId({
      userId: user.id,
      token: crypto.randomBytes(32).toString("hex"),
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    db.auth_sessions.push(session);
    db.audit_logs.push(withId({ action: "create:auth_sessions", recordId: session.id }));
    await writeDb(db);
    return { session, user };
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

async function revokeAuthSession(token) {
  const operation = writeQueue.then(async () => {
    const db = await readDb();
    const index = db.auth_sessions.findIndex((item) => item.token === token);
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
    const readiness = readinessReport();
    return json(res, 200, {
      ok: true,
      service: "AgencyReport AI API",
      storage: databaseUrl ? "postgres" : "json",
      readiness: {
        ready: readiness.ready,
        score: readiness.score,
        missingRequired: readiness.missingRequired,
      },
      ai: {
        provider: aiProvider,
        mode: aiApiKey ? "live-ready" : "fallback",
        model: aiApiKey ? aiModel : "rules",
      },
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
      time: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/readiness" && req.method === "GET") {
    return json(res, 200, { item: readinessReport() });
  }

  if (url.pathname === "/api/legal" && req.method === "GET") {
    return json(res, 200, {
      item: {
        version: "legal-2026-06-06",
        privacyRequired: true,
        dataProcessingRequired: true,
        aiDisclosureRequired: true,
        note: "MVP legal template. Replace with counsel-reviewed terms before paid public launch.",
      },
    });
  }

  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const payload = await readBody(req);
      const user = await createAuthUser(payload);
      const { session } = await createAuthSession(user.email, payload.password);
      return json(res, 201, { item: { token: session.token, expiresAt: session.expiresAt, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
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
      return json(res, 200, { item: { token: session.token, expiresAt: session.expiresAt, user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
    } catch (error) {
      return json(res, 401, { error: error.message || "Invalid email or password" });
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
    return json(res, 200, { ok: true });
  }

  if (url.pathname === "/api/worker/run" && req.method === "POST") {
    if (!isWorkerAuthorized(req)) return json(res, 401, { error: "Unauthorized worker" });
    const result = await processDueSchedules();
    return json(res, 200, { item: result });
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
    if (!verifyEcpayCheckMacValue(payload)) {
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

  const isPublicWrite =
    (url.pathname === "/api/leads" && req.method === "POST") ||
    (url.pathname === "/api/portal-submissions" && req.method === "POST") ||
    (url.pathname === "/api/billing/quote/accept" && req.method === "POST") ||
    (url.pathname === "/api/billing/invoice/pay" && req.method === "POST");
  if (!isPublicWrite) {
    const auth = await currentSession(req);
    if (!auth) return json(res, 401, { error: "Unauthorized" });
    req.auth = auth;
  }

  if (url.pathname === "/api/billing/checkout" && req.method === "POST") {
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
    });
    return json(res, 201, { item: intent });
  }

  if (url.pathname === "/api/usage" && req.method === "GET") {
    const db = await readDb();
    return json(res, 200, { item: usageSummary(db, req.auth.user, "ai_report") });
  }

  if (url.pathname === "/api/data-sources/test" && req.method === "POST") {
    const payload = await readBody(req);
    const result = await testDataConnector(payload);
    return json(res, 200, { item: result });
  }

  if (url.pathname === "/api/data-sources/sync" && req.method === "POST") {
    const payload = await readBody(req);
    const sync = await createDataSync(payload);
    return json(res, 201, { item: sync });
  }

  if (url.pathname === "/api/billing/quote/accept" && req.method === "POST") {
    const payload = await readBody(req);
    const quote = await updateBillingIntent({
      token: payload.token,
      id: payload.id,
      acceptedBy: payload.acceptedBy || payload.email || null,
      acceptanceNote: payload.acceptanceNote || "",
      legalVersion: payload.legalVersion || "legal-2026-06-06",
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
      legalVersion: payload.legalVersion || "legal-2026-06-06",
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
    });
    return json(res, 201, { item: delivery });
  }

  if (url.pathname === "/api/share-links" && req.method === "POST") {
    const payload = await readBody(req);
    const link = await createShareLinkRecord(payload);
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
    });
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
    });
    return json(res, 201, { item: run });
  }

  if (url.pathname === "/api/report/schedule" && req.method === "POST") {
    const payload = await readBody(req);
    const schedule = await createRecord("schedules", {
      ...payload,
      status: "active",
      nextRunAt: payload.nextRunAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
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
    return json(res, 200, { items: db[collection] });
  }

  if (req.method === "POST") {
    const protectedCollections = new Set(["subscriptions", "usage_events", "invoices", "payment_events", "billing_intents", "audit_logs"]);
    if (protectedCollections.has(collection)) {
      return json(res, 403, {
        error: "Forbidden",
        code: "PROTECTED_COLLECTION",
        message: "Use the dedicated API flow for billing, usage, and audit records.",
      });
    }
    const payload = await readBody(req);
    const record = await createRecord(collection, payload);
    return json(res, 201, { item: record });
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
    return res.end(legalHtml());
  }
  if (url.pathname.startsWith("/billing/quote/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const html = await quoteHtml(token);
    if (html) {
      res.writeHead(200, securityHeaders({ "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Quote not found");
  }
  if (url.pathname.startsWith("/billing/ecpay/checkout/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const html = await ecpayCheckoutHtml(token);
    if (html) {
      res.writeHead(200, securityHeaders({ "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Checkout not found");
  }
  if (url.pathname === "/billing/ecpay/result") {
    const html = await ecpayResultHtml(url);
    res.writeHead(200, securityHeaders({ "content-type": "text/html;charset=utf-8" }));
    return res.end(html);
  }
  if (url.pathname.startsWith("/billing/invoice/")) {
    const token = decodeURIComponent(url.pathname.split("/").pop() || "");
    const html = await invoiceHtml(token);
    if (html) {
      res.writeHead(200, securityHeaders({ "content-type": "text/html;charset=utf-8" }));
      return res.end(html);
    }
    res.writeHead(404, securityHeaders({ "content-type": "text/plain;charset=utf-8" }));
    return res.end("Invoice not found");
  }
  if (url.pathname.startsWith("/client/report/")) {
    const isDownload = url.pathname.endsWith("/download");
    const parts = url.pathname.split("/").filter(Boolean);
    const token = decodeURIComponent(parts[2] || "");
    const html = await clientReportHtml(token);
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
