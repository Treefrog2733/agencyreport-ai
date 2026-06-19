#!/usr/bin/env node

const { spawn } = require("node:child_process");

const port = Number(process.env.LEGAL_SMOKE_PORT || 4396);
const baseUrl = `http://127.0.0.1:${port}`;
const expectedVersion = "legal-2026-06-18";
const child = spawn(process.execPath, ["server.js"], {
  cwd: require("node:path").resolve(__dirname, ".."),
  windowsHide: true,
  env: {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "test",
    DATABASE_URL: "",
    LEGAL_VERSION: expectedVersion,
    LEGAL_REVIEWED: "false",
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
  throw new Error("Legal smoke server did not start");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

async function run() {
  await waitForServer();
  const [zhResponse, enResponse, apiResponse] = await Promise.all([
    fetch(`${baseUrl}/legal`),
    fetch(`${baseUrl}/legal?lang=en`),
    fetch(`${baseUrl}/api/legal`),
  ]);
  const [zh, en, api] = await Promise.all([zhResponse.text(), enResponse.text(), apiResponse.json()]);
  assert(zhResponse.ok && /<html lang="zh-Hant">/.test(zh), "Traditional Chinese legal page responds");
  assert(enResponse.ok && /<html lang="en">/.test(en), "English legal page responds");
  assert(api.item?.version === expectedVersion, "legal API exposes the expected version");
  assert(api.item?.reviewRequired === false, "external counsel review is not a launch gate");
  assert(zh.includes("基本營運告知") && en.includes("Basic operational notice"), "both pages identify the basic operational notice");
  assert(zh.includes(expectedVersion) && en.includes(expectedVersion), "both pages show the registered legal version");
  ["服務條款", "隱私政策", "AI 透明度", "訂閱、取消與退款", "資料處理附錄", "資料權利"].forEach((heading) => assert(zh.includes(heading), `Chinese section present: ${heading}`));
  ["Terms of Service", "Privacy Policy", "AI transparency", "Subscriptions, cancellation and refunds", "Data Processing Addendum", "Data rights"].forEach((heading) => assert(en.includes(heading), `English section present: ${heading}`));
  [zh, en].forEach((html, index) => {
    const label = index ? "English" : "Chinese";
    assert(html.includes("support@virtualtrendworks.com"), `${label} page exposes support contact`);
    assert(["Render", "Supabase / PostgreSQL", "OpenAI", "Resend", "ECPay", "GitHub Actions"].every((provider) => html.includes(provider)), `${label} page lists subprocessors`);
    assert(!/[\uFFFD\uF386\uEE6A]/.test(html), `${label} page has no known mojibake`);
  });
  assert(Boolean(zhResponse.headers.get("content-security-policy")), "legal page sends CSP");
  assert(zhResponse.headers.get("x-frame-options") === "DENY", "legal page blocks framing");
}

run()
  .catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => child.kill());
