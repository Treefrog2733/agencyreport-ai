# AgencyReport AI Launch Status

Last updated: 2026-06-16

## Implemented In Repository

- Public SaaS homepage and gated agency workspace.
- Login/register/session API.
- CSV and Google Sheets CSV import workflow.
- AI monthly report generation with OpenAI-compatible live mode and rule fallback.
- Free usage quota and paid-plan quota model.
- Upgrade modal and checkout flow.
- Starter, Agency, and Professional pricing.
- ECPay checkout and callback signature verification.
- Supabase/PostgreSQL support through `DATABASE_URL`.
- Render deployment baseline through `render.yaml`.
- Production readiness API and production smoke test.
- Security headers, static file allowlist, sensitive file blocking, API rate limit.
- `robots.txt`, `sitemap.xml`, deployment docs, and Render env checklist.

## Needs External Verification

- Latest changes pushed to GitHub. Latest deploy-ready commit: `bede8b9`.
- Render redeploy completed from the latest commit.
- Render environment variables match `RENDER_ENV_CHECKLIST.md`.
- `GET /api/health` on production returns `storage: "postgres"`. Verified on `https://agencyreport-ai.onrender.com/api/health`.
- `GET /api/readiness` on production returns `ready: true`.
- `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict` passes.
- Resend sender domain is verified.
- ECPay test or production checkout succeeds end to end.
- `virtualtrendworks.com` and `app.virtualtrendworks.com` DNS records point to Render.
- TLS certificate is active on the custom domain.

## Latest Production Smoke

Target tested: `https://agencyreport-ai.onrender.com`

Result: 32/35 passed.

Passing:

- Homepage responds and has no known mojibake.
- Security headers are present on homepage, robots, sitemap, and health endpoint.
- `robots.txt` and `sitemap.xml` respond.
- Sensitive files are blocked.
- PostgreSQL storage is active.
- OpenAI is live-ready.
- Resend is live-ready.
- Worker secret is configured.

Failing:

- Payment provider is still `mock`.
- `/api/readiness` reports `ready: false`.
- Required readiness check `payment` fails.
- Newer backend builds return `payment.missing` and a detailed readiness message showing the exact missing payment environment variables.

Required next Render environment variables:

```env
PAYMENT_PROVIDER=ecpay
ECPAY_MODE=production
ECPAY_MERCHANT_ID=...
ECPAY_HASH_KEY=...
ECPAY_HASH_IV=...
ECPAY_RETURN_URL=https://app.virtualtrendworks.com/api/billing/ecpay/return
ECPAY_ORDER_RESULT_URL=https://app.virtualtrendworks.com/billing/ecpay/result
ECPAY_CLIENT_BACK_URL=https://app.virtualtrendworks.com
```

Current custom domain status:

- `https://app.virtualtrendworks.com/api/health` does not resolve yet.
- Add the Render custom domain and DNS record before running the custom-domain smoke test.

## Current Known Limitation

The local HTTP regression check could not be completed in an earlier Codex tool session because the command runner reported a usage-limit rejection. Static checks passed:

```bash
node --check server.js
node --check app.js
node --check scripts/production-smoke.js
```

Run the production smoke test after pushing and redeploying to verify the runtime behavior.
