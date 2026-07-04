#!/usr/bin/env node

const baseRequiredChecks = ["database", "auth", "ai", "email", "worker"];
const sensitivePaths = ["/.env", "/server.js", "/data/db.json", "/package.json", "/render.yaml"];
const mojibakePattern = /[\uFFFD\uF386\uEE6A]|\u876E|\u7362|\u95AE|\u648C|\u6470|\u9903|\u7E5A|\u977D|\u92B4|\u920D|\u7508|\u761A|\u969E|\u96FF|\u64B1|\u875D|\?\?\?/;
let requestTimeoutMs = 65000;

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefix = `${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function normalizeBaseUrl(raw) {
  const value = raw || process.env.APP_URL || process.env.APP_BASE_URL || process.env.PUBLIC_APP_URL || "http://127.0.0.1:4173";
  return String(value).replace(/\/$/, "");
}

async function fetchText(url, options = {}) {
  const retryable = !options.method || String(options.method).toUpperCase() === "GET";
  let lastError;
  for (let attempt = 0; attempt < (retryable ? 3 : 1); attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      if (retryable && [502, 503, 504].includes(response.status) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        continue;
      }
      return { response, text };
    } catch (error) {
      lastError = error.name === "AbortError" ? new Error(`${url} timed out after ${requestTimeoutMs}ms`) : error;
      if (!retryable || attempt === 2) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error(`${url} failed`);
}

async function fetchJson(url, options = {}) {
  const { response, text } = await fetchText(url, options);
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 160)}`);
  }
  return { response, body };
}

function check(condition, message, details = "") {
  return { ok: Boolean(condition), message, details };
}

function headerValue(response, name) {
  return response.headers.get(name) || "";
}

function checkSecurityHeaders(response, label) {
  return [
    check(headerValue(response, "x-content-type-options").toLowerCase() === "nosniff", `${label} sends nosniff header`),
    check(headerValue(response, "x-frame-options").toUpperCase() === "DENY", `${label} blocks framing`),
    check(Boolean(headerValue(response, "referrer-policy")), `${label} sends referrer policy`),
    check(Boolean(headerValue(response, "content-security-policy")), `${label} sends content security policy`),
    check(Boolean(headerValue(response, "strict-transport-security")), `${label} sends HSTS`),
  ];
}

async function run() {
  const baseUrl = normalizeBaseUrl(argValue("--url"));
  requestTimeoutMs = Math.max(5000, Number(argValue("--timeout", "65000")) || 65000);
  const strict = process.argv.includes("--strict");
  const requirePayment = process.argv.includes("--require-payment");
  const requireOperational = process.argv.includes("--require-operational");
  const requiredChecks = [
    ...baseRequiredChecks,
    ...(requireOperational ? ["backup", "monitoring"] : []),
    ...(requirePayment ? ["payment"] : []),
  ];
  const results = [];
  const parsedTarget = new URL(baseUrl);
  const localTarget = ["localhost", "127.0.0.1", "::1"].includes(parsedTarget.hostname);
  results.push(check(localTarget || parsedTarget.protocol === "https:", "public target uses HTTPS", parsedTarget.protocol));

  const home = await fetchText(`${baseUrl}/`);
  results.push(check(home.response.ok, "homepage responds", `${home.response.status}`));
  results.push(check(/AgencyReport AI/.test(home.text), "homepage contains product brand"));
  results.push(check(!mojibakePattern.test(home.text), "homepage has no known mojibake"));
  results.push(...checkSecurityHeaders(home.response, "homepage"));

  const robots = await fetchText(`${baseUrl}/robots.txt`);
  results.push(check(robots.response.ok && /Sitemap:/.test(robots.text), "robots.txt exposes sitemap"));
  results.push(...checkSecurityHeaders(robots.response, "robots.txt"));

  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
  results.push(check(sitemap.response.ok && /<urlset/.test(sitemap.text), "sitemap.xml responds"));
  results.push(...checkSecurityHeaders(sitemap.response, "sitemap.xml"));

  const legalZh = await fetchText(`${baseUrl}/legal`);
  results.push(check(legalZh.response.ok && /<html lang="zh-Hant">/.test(legalZh.text), "Traditional Chinese legal page responds"));
  results.push(check(["服務條款", "隱私政策", "AI 透明度", "資料處理附錄"].every((text) => legalZh.text.includes(text)), "Traditional Chinese legal package is complete"));
  results.push(check(!mojibakePattern.test(legalZh.text), "Traditional Chinese legal page has no known mojibake"));
  const legalEn = await fetchText(`${baseUrl}/legal?lang=en`);
  results.push(check(legalEn.response.ok && /Terms, Privacy and AI Notice/.test(legalEn.text), "English legal page responds"));
  results.push(check(["Terms of Service", "Privacy Policy", "AI transparency", "Data Processing Addendum"].every((text) => legalEn.text.includes(text)), "English legal package is complete"));
  const legalApi = await fetchJson(`${baseUrl}/api/legal`);
  results.push(check(/^legal-\d{4}-\d{2}-\d{2}$/.test(legalApi.body.item?.version || ""), "legal API exposes a versioned policy", legalApi.body.item?.version || "missing"));
  results.push(check(legalZh.text.includes(legalApi.body.item?.version || "missing") && legalEn.text.includes(legalApi.body.item?.version || "missing"), "legal pages match the registered API version"));

  const plansApi = await fetchJson(`${baseUrl}/api/plans`);
  const plans = Array.isArray(plansApi.body.items) ? plansApi.body.items : [];
  const expectedPlanLimits = { free: 3, starter: 10, agency: 50, professional: 150 };
  results.push(check(plansApi.response.ok && plans.length === 4, "plans API exposes four customer-facing plans"));
  Object.entries(expectedPlanLimits).forEach(([plan, limit]) => {
    const found = plans.find((item) => item.key === plan);
    results.push(check(
      found?.usage?.ai_report === limit && found?.limits?.aiReports === limit,
      `plans API ${plan} limit is consistent`,
      found ? JSON.stringify({ usage: found.usage, limits: found.limits }) : "missing"
    ));
  });
  results.push(check(plans.find((item) => item.key === "professional")?.features?.googleAdsConnector === true, "professional plan exposes automated connectors"));
  results.push(check(plans.find((item) => item.key === "agency")?.features?.googleAdsConnector === false, "agency plan keeps automated connectors gated"));

  for (const pathname of sensitivePaths) {
    const sensitive = await fetchText(`${baseUrl}${pathname}`);
    results.push(check([403, 404].includes(sensitive.response.status), `sensitive file blocked: ${pathname}`, `${sensitive.response.status}`));
  }

  const health = await fetchJson(`${baseUrl}/api/health`);
  results.push(check(health.response.ok && health.body.ok === true, "health endpoint ok", `${health.response.status}`));
  results.push(...checkSecurityHeaders(health.response, "health endpoint"));
  results.push(check(health.body.storage === "postgres", "production storage is postgres", `storage=${health.body.storage}`));
  results.push(check(health.body.ai?.mode === "live-ready", "AI provider is live-ready", JSON.stringify(health.body.ai || {})));
  results.push(check(health.body.email?.mode === "live-ready", "email provider is live-ready", JSON.stringify(health.body.email || {})));
  results.push(check(
    !requirePayment || health.body.payment?.mode === "live-ready",
    requirePayment ? "payment provider is live-ready" : "payment provider can remain post-launch review",
    JSON.stringify(health.body.payment || {})
  ));
  if (health.body.payment?.mode !== "live-ready") {
    results.push(check(Array.isArray(health.body.payment?.missing) && health.body.payment.missing.length > 0, "payment diagnostics list missing settings", JSON.stringify(health.body.payment || {})));
    results.push(check(health.body.payment?.checkoutEnabled === false, "unconfigured production checkout is disabled", JSON.stringify(health.body.payment || {})));
  } else {
    results.push(check(health.body.payment?.checkoutEnabled === true, "configured production checkout is enabled", JSON.stringify(health.body.payment || {})));
  }

  const readiness = await fetchJson(`${baseUrl}/api/readiness`);
  const item = readiness.body.item || readiness.body;
  results.push(check(readiness.response.ok, "readiness endpoint responds", `${readiness.response.status}`));
  const checks = Array.isArray(item.checks) ? item.checks : [];
  const baseReady = baseRequiredChecks.every((id) => checks.find((entry) => entry.id === id)?.ok === true);
  results.push(check(
    requireOperational ? item.ready === true : baseReady,
    requireOperational ? "full operational readiness ready=true" : "core service readiness is healthy",
    `missing=${(item.missingRequired || []).join(",") || "none"}`
  ));
  requiredChecks.forEach((id) => {
    const found = checks.find((entry) => entry.id === id);
    results.push(check(found?.ok === true, `required readiness check: ${id}`, found?.detail || "missing"));
  });

  const failed = results.filter((item) => !item.ok);
  const icon = (ok) => (ok ? "OK" : "FAIL");
  console.log(`AgencyReport AI production smoke test`);
  console.log(`Target: ${baseUrl}`);
  results.forEach((item) => {
    console.log(`${icon(item.ok)} ${item.message}${item.details ? ` - ${item.details}` : ""}`);
  });
  console.log(`Result: ${results.length - failed.length}/${results.length} passed`);

  if (failed.length && strict) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
