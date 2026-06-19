# AgencyReport AI

See [LAUNCH_READINESS.md](LAUNCH_READINESS.md) for the evidence-based production launch gate and the remaining external approvals.

AgencyReport AI is a monetizable SaaS MVP for marketing agencies. It helps agencies turn client requirements, CSV or Google Sheets data, and campaign KPIs into a client-ready monthly report with charts, AI-generated insights, next-month action items, and delivery records.

The current product direction is simple: a public SaaS homepage first, then a gated agency workspace where users can import data and generate reports with minimal setup.

## Product Scope

- Public homepage with professional SaaS positioning and pricing.
- Login/register flow before entering the agency workspace.
- Client and report workflow for agencies.
- CSV and public Google Sheets CSV import.
- Monthly report generation with KPI charts and AI narrative.
- OpenAI-backed report draft generation with rule-based fallback.
- Free usage limit with upgrade modal after the quota is reached.
- Starter, Agency, and Professional pricing tiers.
- ECPay payment flow for Taiwan payment collection.
- Supabase/PostgreSQL production storage through `DATABASE_URL`.
- Render deployment configuration and production smoke test.
- Basic security headers, sensitive file blocking, API rate limit, `robots.txt`, and `sitemap.xml`.

## Pricing

| Plan | Monthly price | Best for | Included |
| --- | ---: | --- | --- |
| Starter | NT$790 | Solo operators and small agencies testing the workflow | 10 AI reports/month, CSV/Sheets import, AI suggestions, HTML/PDF-friendly export |
| Agency | NT$2,490 | Small agencies with recurring clients | 50 AI reports/month, multiple clients, branded report flow, AI next actions, payment/delivery records |
| Professional | NT$5,990 | Agencies that want semi-automated delivery | 150 AI reports/month, client portal, scheduling, email drafts, white-label direction, advanced AI analysis |

Free users can generate 3 AI reports. After the free quota is reached, the frontend opens the upgrade plan modal and routes checkout through the billing API.

## Architecture

```text
Browser frontend
  index.html / styles.css / app.js
        |
Node.js API server
  server.js
        |
Normalized PostgreSQL record store when DATABASE_URL is set
Local data/db.json fallback for development
        |
OpenAI / Resend / ECPay / connector credentials
```

Production state is stored in schema-v3 `agencyreport_records` rows, keyed by collection and record ID with explicit owner IDs. Writes use a transactional staging table, differential upserts, and deletion reconciliation so unchanged rows retain their database timestamps. Tenant/report indexes plus unique account-email, session-token-hash, and billing-token indexes enforce common lookup and identity invariants. An owner/payload constraint prevents tenant metadata drift. `agencyreport_metadata` records schema state. The legacy `agencyreport_store` JSONB row is retained only as a migration rollback source; local development can still use `data/db.json`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open:

```text
http://127.0.0.1:4173
```

Useful checks:

```bash
node --check server.js
node --check app.js
node --check scripts/production-smoke.js
npm run smoke:browser -- --url=http://127.0.0.1:4173/
npm run db:check
npm run smoke:ai
npm run smoke:ai-runtime
npm run smoke:legal
npm run smoke:worker
npm run smoke:i18n
npm run smoke:auth-privacy
npm run smoke:connectors
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd start
```

### Browser smoke test

If Chrome headless stalls during GPU initialization, run:

```powershell
npm run smoke:browser -- --url=http://127.0.0.1:4280/
```

The script launches Chrome or Edge with GPU and sandbox-safe flags:

- `--disable-gpu`
- `--disable-software-rasterizer`
- `--no-sandbox`
- `--disable-setuid-sandbox`
- `--disable-dev-shm-usage`

It writes a DOM dump, screenshot, and log to `artifacts/browser-smoke/`. A healthy run reports `DOM: OK`, `Screenshot: OK`, and no blocking GPU warning.

## Production Environment

Copy `.env.example` for local testing or set the same values in Render.

Required before paid public launch:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DATABASE_SSL=true

AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-4o-mini

EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
EMAIL_FROM=AgencyReport AI <hello@reports.virtualtrendworks.com>

WORKER_SECRET=long-random-secret

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_MAX=20
LEGAL_VERSION=legal-2026-06-18

APP_BASE_URL=https://app.virtualtrendworks.com
PAYMENT_PROVIDER=ecpay
ECPAY_MODE=production
ECPAY_MERCHANT_ID=...
ECPAY_HASH_KEY=...
ECPAY_HASH_IV=...
ECPAY_RETURN_URL=https://app.virtualtrendworks.com/api/billing/ecpay/return
ECPAY_ORDER_RESULT_URL=https://app.virtualtrendworks.com/billing/ecpay/result
ECPAY_CLIENT_BACK_URL=https://app.virtualtrendworks.com
```

Optional but recommended before scaling:

```env
SENTRY_DSN=
MONITORING_URL=
BACKUP_ENABLED=true
BACKUP_POLICY_URL=
BACKUP_ENCRYPTION_KEY=long-random-secret
GOOGLE_SHEETS_API_KEY=
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
META_ACCESS_TOKEN=
META_APP_ID=
GA4_PROPERTY_ID=
```

## API Areas

Core:

- `GET /api/health`
- `GET /api/readiness`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/account/export`
- `DELETE /api/account` with the current password and an exact `DELETE` confirmation

Agency workflow:

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/reports`
- `POST /api/reports`
- `POST /api/report/run`
- `POST /api/share-links`
- `GET /client/report/{token}`
- `GET /client/report/{token}/download`

Client intake:

- `POST /api/portal-invites`
- `GET /client/intake/{token}`
- `POST /api/portal-submissions`
- `POST /api/portal-submissions/process`

Automation and delivery:

- `POST /api/report/schedule`
- `POST /api/worker/run`
- `POST /api/email-jobs`
- `POST /api/email-jobs/send`

Billing:

- `POST /api/billing/checkout`
- `POST /api/billing/ecpay/return`
- `GET /billing/ecpay/checkout/{token}`
- `GET /billing/ecpay/result`
- `POST /api/billing/webhook`

Data connectors:

- `POST /api/data-sources`
- `POST /api/data-sources/test`
- `POST /api/data-sources/sync`

## OpenAI Report Flow

When a user generates a monthly report:

1. The frontend parses the uploaded CSV or Sheets data.
2. Rules calculate base KPIs, channel ranking, and chart data.
3. The backend receives the client request, KPI summary, best channel, weak channel, and report context.
4. OpenAI returns a structured JSON draft:
   - summary
   - risks
   - nextActions
   - clientReplyDraft
   - reportOutline
   - dataChecks
   - automationPlan
   - confidence
5. If AI fails, the backend stores a fallback draft so the user can still continue.
6. Usage is recorded against the account plan.

## Payment Flow

Local development defaults to `PAYMENT_PROVIDER=mock`.

Production should use:

```env
PAYMENT_PROVIDER=ecpay
```

In ECPay mode:

1. The frontend calls `POST /api/billing/checkout`.
2. The server creates a billing intent and returns `/billing/ecpay/checkout/{token}`.
3. The checkout page auto-submits a signed ECPay AIO form.
4. ECPay posts back to `/api/billing/ecpay/return`.
5. The server verifies `CheckMacValue`.
6. Paid events activate the subscription and increase report quota.

## Render Deployment

Recommended production setup:

- Render Web Service
- Supabase PostgreSQL
- OpenAI API key
- Resend verified sending domain
- ECPay production credentials
- Custom domain: `app.virtualtrendworks.com`

Use `render.yaml` as the Render Blueprint baseline, or create a Web Service manually:

```text
Build command: npm install
Start command: npm start
Health check path: /api/health
```

After deploying, check:

```text
https://your-render-service.onrender.com/api/health
https://your-render-service.onrender.com/api/readiness
```

When DNS is connected:

```text
https://app.virtualtrendworks.com/api/health
https://app.virtualtrendworks.com/api/readiness
```

## Production Smoke Test

Run:

```bash
npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict
```

The smoke test verifies:

- homepage responds and contains the product brand
- homepage HTML has no known mojibake
- homepage, API, robots, and sitemap responses include basic security headers
- `robots.txt` exposes the sitemap
- `sitemap.xml` responds

Production requests use a 65-second timeout and retry eligible GET failures up to three times so Render free-tier cold starts do not create immediate false outages. Scheduled monitoring enforces core database, auth, AI, email, and worker health. Run the workflow manually with `require_operational=true`, or pass `--require-operational`, for the stricter backup and monitoring launch gate.
- sensitive files such as `.env`, `server.js`, `data/db.json`, `package.json`, and `render.yaml` are blocked
- `/api/health` is OK
- production storage is PostgreSQL
- OpenAI, Resend, and Worker secret are live-ready
- Payment diagnostics are visible; ECPay can remain a post-launch review item until the public URL is live
- `/api/readiness` reports all required checks as passing
- both Traditional Chinese and English legal pages respond with a versioned policy

Before paid traffic, also run `npm run smoke:ai`. It performs a minimal live OpenAI report generation and fails unless the provider returns live structured summary, risk, action, client-message, and usage data. A ChatGPT subscription does not supply OpenAI API credits; API billing must be active separately.

`npm run smoke:ai-runtime` uses a local fake provider to verify the operational state machine without spending API credits. A quota or provider failure must switch health and readiness to `degraded` with a sanitized error code while rules-based report output remains available; the next successful live response must automatically restore `live-ready` status.

The public legal center is available at `/legal` and `/legal?lang=en`. Run `npm run smoke:legal` to verify bilingual section parity, the registered policy version, support contact, subprocessors, security headers, and mojibake protection. These pages remain the product's basic operational notice; external counsel review is not enforced as a launch gate.

`npm run smoke:worker` verifies that the scheduled-report worker rejects unauthenticated calls, processes each due schedule once, generates an AI draft with safe fallback, advances the next run, sends the queued email, preserves tenant ownership, and keeps client content out of automation logs.

`npm run smoke:i18n` verifies that every translated HTML key exists in both Traditional Chinese and English, both catalogs remain symmetric, HTML IDs stay unique, and public source files contain no replacement-character or private-use mojibake. English visual smoke also rejects visible CJK text on both the public landing page and every workspace view.

`npm run smoke:auth-privacy` runs production-shaped password-reset and verification-resend requests against existing and missing addresses, ensuring that public responses cannot be used for account enumeration. Authentication emails follow the selected interface language and contain a clickable one-time action link.

`npm run smoke:connectors` verifies report-ready CSV validation, Google Sheets URL allowlisting, localhost and arbitrary-host SSRF rejection, source ownership, and tenant-isolated sync history. Public Sheets imports are limited to HTTPS Google domains, validated across redirects, capped at 5 MB, and aborted after 12 seconds.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push to `main`, pull request, and manual dispatch. It enforces syntax, dependency, security, ECPay signature, backup integrity, bilingual legal-document, browser, desktop English, mobile English, and mobile Traditional Chinese regressions. Browser screenshots, report PDFs, DOM output, and server logs are uploaded as a 14-day workflow artifact even when a check fails.

## Security And Launch Notes

Implemented launch hardening:

- Static serving is allowlisted to public frontend files.
- Sensitive project files return `403` or `404`.
- JSON and HTML responses include basic security headers.
- API requests have configurable IP rate limits.
- Auth endpoints use a tighter rate limit bucket.
- Browser-side client, delivery, invoice, and report caches are scoped by authenticated user ID.
- Account exports omit password and session credential material.
- Account deletion removes only the authenticated tenant's linked records, revokes every session, and leaves an anonymous deletion audit hash.
- ECPay callback and health checks are excluded from rate limiting to avoid blocking payment and uptime checks.
- `.env` and `.env.local` are ignored by Git.
- `robots.txt` blocks private API, billing, and client report paths.

Still recommended before real paid traffic:

- Review privacy policy, terms, AI disclosure, refund policy, and data processing terms with counsel.
- Verify Resend sender domain.
- Submit the live public URL for ECPay review, then run one ECPay production or test checkout end to end.
- Add GitHub secrets for the encrypted backup workflow and run one restore drill.
- Confirm the scheduled production monitor can open and close an outage issue.
- Add error reporting such as Sentry.
- Confirm DNS and TLS for `virtualtrendworks.com` and `app.virtualtrendworks.com`.

## Launch Checklist

- [x] Push latest launch-hardening code to GitHub.
- [x] Confirm Render redeploy succeeds.
- [ ] Set all required Render environment variables.
- [ ] Confirm `GET /api/health` returns `storage: "postgres"`.
- [ ] Confirm `GET /api/readiness` returns `ready: true`.
- [ ] Run `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict`.
- [ ] Run `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-operational --require-payment`.
- [ ] Register and log in through the public site.
- [ ] Generate a report with sample CSV data.
- [ ] Confirm free quota blocks after the limit.
- [ ] Confirm upgrade modal opens.
- [ ] Submit the public URL for ECPay review.
- [ ] After ECPay approval, run `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-payment`.
- [ ] Complete one ECPay checkout test.
- [ ] Verify email delivery.
- [ ] Bind the custom domain and confirm TLS.

## Repository Files

- `index.html` - public homepage, auth screen, agency workspace, report UI.
- `styles.css` - landing and workspace visual system.
- `app.js` - frontend state, language switching, report generation, billing UI.
- `server.js` - Node API, static serving, auth, billing, OpenAI, worker, storage.
- `render.yaml` - Render deployment baseline.
- `.env.example` - production environment template.
- `production.env.example` - concise production env template.
- `DEPLOYMENT.md` - Render, DNS, ECPay, smoke test deployment guide.
- `RENDER_ENV_CHECKLIST.md` - copy-paste checklist for Render env vars.
- `scripts/db-check.js` - database connectivity check.
- `scripts/db-migrate.js` - dry-run/apply migration from the legacy JSONB row to normalized records.
- `scripts/db-backup.js` - encrypted PostgreSQL backup and verification.
- `scripts/db-restore-drill.js` - decrypt and load a backup into PostgreSQL temporary tables, verify row counts, then roll back.
- `scripts/backup-smoke.js` - encryption, checksum, tamper, wrong-key, and duplicate-record regression test.
- `scripts/email-check.js` - email provider check.
- `scripts/production-smoke.js` - production readiness smoke test.
- `scripts/security-smoke.js` - tenant, session, legal-consent, password, account export, and account deletion lifecycle regression test.
- `scripts/payment-smoke.js` - ECPay stage signature and callback regression test.
- `scripts/ai-smoke.js` - isolated live OpenAI report-generation regression test.
- `.github/workflows/ci.yml` - push/PR regression gate with retained browser and report evidence.
