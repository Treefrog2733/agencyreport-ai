const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
loadLocalEnv();

const provider = (process.env.EMAIL_PROVIDER || "manual").toLowerCase();
const apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || "";
const apiUrl = process.env.EMAIL_API_URL || (provider === "resend" ? "https://api.resend.com/emails" : "");
const from = process.env.EMAIL_FROM || "";
const testTo = process.env.EMAIL_TEST_TO || "";

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

async function main() {
  const liveProvider = provider === "api" || provider === "resend";
  const ready = liveProvider && Boolean(apiUrl && apiKey && from);
  if (!ready) {
    console.error(JSON.stringify({
      ok: false,
      provider,
      missing: [
        liveProvider ? null : "EMAIL_PROVIDER=resend or EMAIL_PROVIDER=api",
        apiUrl ? null : "EMAIL_API_URL",
        apiKey ? null : "RESEND_API_KEY or EMAIL_API_KEY",
        from ? null : "EMAIL_FROM",
      ].filter(Boolean),
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  if (!testTo) {
    console.log(JSON.stringify({
      ok: true,
      provider,
      mode: "live-ready",
      apiUrl,
      from,
      test: "Set EMAIL_TEST_TO to send a real test email.",
    }, null, 2));
    return;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: testTo,
      subject: "AgencyReport AI email test",
      html: "<p>AgencyReport AI email delivery is configured.</p>",
      text: "AgencyReport AI email delivery is configured.",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(JSON.stringify({ ok: false, provider, status: response.status, error: data.error?.message || data.message || "Email provider rejected the request." }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ ok: true, provider, sentTo: testTo, providerMessageId: data.id || data.messageId || data.data?.id || null }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
