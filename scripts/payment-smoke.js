#!/usr/bin/env node

const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = Number(process.env.PAYMENT_SMOKE_PORT || 4393);
const root = path.resolve(__dirname, "..");
const testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agencyreport-payment-"));
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
    PAYMENT_PROVIDER: "ecpay",
    ECPAY_MODE: "stage",
    ECPAY_MERCHANT_ID: merchantId,
    ECPAY_HASH_KEY: hashKey,
    ECPAY_HASH_IV: hashIv,
    APP_BASE_URL: baseUrl,
    ECPAY_RETURN_URL: `${baseUrl}/api/billing/ecpay/return`,
    ECPAY_ORDER_RESULT_URL: `${baseUrl}/billing/ecpay/result`,
    ECPAY_CLIENT_BACK_URL: baseUrl,
    WORKER_SECRET: "payment-smoke-worker-secret",
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

async function waitForServer() {
  for (let index = 0; index < 80; index += 1) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Payment smoke server did not start");
}

async function json(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${pathname}: ${body.error || response.status}`);
  return body.item ?? body.items ?? body;
}

function hiddenFields(html) {
  return Object.fromEntries([...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)" \/>/g)]
    .map((match) => [match[1], match[2].replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#039;", "'")]));
}

async function run() {
  await waitForServer();
  const suffix = Date.now();
  const email = `payment-${suffix}@example.test`;
  const password = "PaymentSmoke123!";
  const registered = await json("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Payment Test", email, password, legalAccepted: true, legalVersion: "legal-2026-06-18" }),
  });
  await json("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: registered.verificationToken }) });
  const auth = await json("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const headers = { authorization: `Bearer ${auth.token}` };
  const intent = await json("/api/billing/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify({ plan: "starter", currency: "TWD", accountEmail: email }),
  });
  const checkoutResponse = await fetch(`${baseUrl}${intent.checkoutUrl}`);
  const checkoutHtml = await checkoutResponse.text();
  const checkoutCsp = checkoutResponse.headers.get("content-security-policy") || "";
  const checkoutNonce = checkoutCsp.match(/'nonce-([^']+)'/)?.[1] || "";
  const fields = hiddenFields(checkoutHtml);
  const signatureMatches = fields.CheckMacValue === checkMac(fields);
  const quoteResponse = await fetch(`${baseUrl}${intent.quoteUrl}`);
  const quoteHtml = await quoteResponse.text();
  const quoteCsp = quoteResponse.headers.get("content-security-policy") || "";
  const quoteNonce = quoteCsp.match(/'nonce-([^']+)'/)?.[1] || "";
  await json("/api/billing/quote/accept", {
    method: "POST",
    body: JSON.stringify({ token: intent.token, legalVersion: "legal-2026-06-18" }),
  });
  const invoice = await json("/api/billing/quote/invoice", {
    method: "POST",
    headers,
    body: JSON.stringify({ token: intent.token }),
  });
  const invoiceResponse = await fetch(`${baseUrl}${invoice.invoiceUrl}`);
  const invoiceHtml = await invoiceResponse.text();
  const invoiceCsp = invoiceResponse.headers.get("content-security-policy") || "";

  const forged = new URLSearchParams({
    MerchantID: merchantId,
    MerchantTradeNo: fields.MerchantTradeNo,
    CustomField1: fields.CustomField1,
    RtnCode: "1",
    CheckMacValue: "FORGED",
  });
  const forgedResponse = await fetch(`${baseUrl}/api/billing/ecpay/return`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: forged,
  });

  const callback = {
    MerchantID: merchantId,
    MerchantTradeNo: fields.MerchantTradeNo,
    TradeAmt: fields.TotalAmount,
    RtnCode: "1",
    RtnMsg: "Succeeded",
    PaymentDate: "2026/06/18 12:00:00",
    PaymentType: "Credit_CreditCard",
    CustomField1: fields.CustomField1,
  };
  callback.CheckMacValue = checkMac(callback);
  const wrongAmount = { ...callback, TradeAmt: String(Number(callback.TradeAmt) + 1) };
  wrongAmount.CheckMacValue = checkMac(wrongAmount);
  const wrongAmountResponse = await fetch(`${baseUrl}/api/billing/ecpay/return`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(wrongAmount),
  });
  const paidResponse = await fetch(`${baseUrl}/api/billing/ecpay/return`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(callback),
  });
  const partialRefund = await fetch(`${baseUrl}/api/billing/refunds`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ billingIntentId: intent.id, amount: 100, providerRefundReference: `RF-${suffix}-1`, reason: "Smoke test partial refund" }),
  });
  const duplicateRefund = await fetch(`${baseUrl}/api/billing/refunds`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ billingIntentId: intent.id, amount: 1, providerRefundReference: `RF-${suffix}-1`, reason: "Duplicate reference" }),
  });
  const excessiveRefund = await fetch(`${baseUrl}/api/billing/refunds`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ billingIntentId: intent.id, amount: Number(fields.TotalAmount), providerRefundReference: `RF-${suffix}-2`, reason: "Excessive refund" }),
  });
  const finalRefund = await fetch(`${baseUrl}/api/billing/refunds`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ billingIntentId: intent.id, amount: Number(fields.TotalAmount) - 100, providerRefundReference: `RF-${suffix}-3`, reason: "Smoke test final refund" }),
  });
  const refunds = await json("/api/billing/refunds", { headers });
  const intents = await json("/api/billing-intents", { headers });
  const updated = intents.find((item) => item.id === intent.id);
  const checks = {
    checkoutUsesStageEndpoint: /payment-stage\.ecpay\.com\.tw/.test(checkoutHtml),
    checkoutHasRequiredFields: Boolean(fields.MerchantID && fields.MerchantTradeNo && fields.TotalAmount && fields.ReturnURL),
    checkoutSignatureMatches: signatureMatches,
    checkoutUsesNonceCsp: Boolean(checkoutNonce) && checkoutHtml.includes(`nonce="${checkoutNonce}"`) && !/script-src[^;]*'unsafe-inline'/.test(checkoutCsp),
    quoteUsesNonceCsp: Boolean(quoteNonce) && quoteHtml.includes(`nonce="${quoteNonce}"`) && !/script-src[^;]*'unsafe-inline'/.test(quoteCsp),
    invoiceIsReadOnly: !invoiceHtml.includes("payInvoiceBtn") && !invoiceHtml.includes("/api/billing/invoice/pay") && !/script-src[^;]*'unsafe-inline'/.test(invoiceCsp),
    forgedCallbackRejected: forgedResponse.status === 403,
    signedWrongAmountRejected: wrongAmountResponse.status === 403,
    validCallbackAccepted: paidResponse.status === 200 && (await paidResponse.text()) === "1|OK",
    paidIntentIsTrusted: updated?.paymentStatus === "paid" && updated?.trustedPayment === true,
    partialRefundRecorded: partialRefund.status === 201,
    duplicateRefundRejected: duplicateRefund.status === 400,
    excessiveRefundRejected: excessiveRefund.status === 400,
    fullRefundRecorded: finalRefund.status === 201 && updated?.refundStatus === "refunded" && updated?.refundedAmount === Number(fields.TotalAmount),
    refundHistoryIsTenantScoped: refunds.length === 2 && refunds.every((item) => item.ownerId === auth.user.id),
  };
  Object.entries(checks).forEach(([name, ok]) => console.log(`${ok ? "OK" : "FAIL"} ${name}`));
  if (!checks.paidIntentIsTrusted) console.log(`Payment state: ${JSON.stringify(updated || null)}`);
  if (Object.values(checks).some((ok) => !ok)) process.exitCode = 1;
}

run().catch((error) => {
  console.error(`Payment smoke failed: ${error.message}`);
  process.exitCode = 1;
}).finally(() => child.kill());
