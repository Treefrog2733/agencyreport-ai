# Render Environment Checklist

Use this checklist before switching real traffic to `https://app.virtualtrendworks.com`.

## Required

| Key | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Required by the app runtime. |
| `DATABASE_URL` | `postgresql://...` | Use Supabase pooled or direct PostgreSQL connection string. |
| `DATABASE_SSL` | `true` | Keep enabled for Supabase. |
| `AI_PROVIDER` | `openai` | Live AI drafts require OpenAI. |
| `OPENAI_API_KEY` | `sk-proj-...` | Store only in Render secret env vars. |
| `AI_MODEL` | `gpt-4o-mini` | Current default production model. |
| `EMAIL_PROVIDER` | `resend` | Required for delivery emails. |
| `RESEND_API_KEY` | `re_...` | Store only in Render secret env vars. |
| `EMAIL_FROM` | `AgencyReport AI <hello@reports.virtualtrendworks.com>` | Requires verified Resend domain. |
| `WORKER_SECRET` | long random string | Must match GitHub secret `WORKER_SECRET`. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Optional API abuse protection window. |
| `RATE_LIMIT_MAX` | `120` | Optional max API requests per IP per window. |
| `AUTH_RATE_LIMIT_MAX` | `20` | Optional tighter login/register request limit. |
| `LEGAL_VERSION` | `legal-2026-06-18` | Must match the published policy version. |
| `LEGAL_REVIEWED` | `true` | Set only after legal review of the published version. |
| `BACKUP_ENABLED` | `true` | Signals that the scheduled encrypted backup is active. |
| `BACKUP_POLICY_URL` | GitHub backup workflow URL | Operational evidence for the readiness page. |
| `MONITORING_URL` | GitHub production smoke workflow URL | Operational evidence for the readiness page. |
| `APP_BASE_URL` | `https://app.virtualtrendworks.com` | Used for payment callback URLs. |
| `PAYMENT_PROVIDER` | `ecpay` | Use `mock` only for local testing. |
| `ECPAY_MODE` | `production` | Use `stage` only for ECPay test mode. |
| `ECPAY_MERCHANT_ID` | from ECPay | Store only in Render secret env vars. |
| `ECPAY_HASH_KEY` | from ECPay | Store only in Render secret env vars. |
| `ECPAY_HASH_IV` | from ECPay | Store only in Render secret env vars. |
| `ECPAY_RETURN_URL` | `https://app.virtualtrendworks.com/api/billing/ecpay/return` | Must match ECPay dashboard. |
| `ECPAY_ORDER_RESULT_URL` | `https://app.virtualtrendworks.com/billing/ecpay/result` | Browser result page after payment. |
| `ECPAY_CLIENT_BACK_URL` | `https://app.virtualtrendworks.com` | Customer back link. |

## GitHub Secrets

| Secret | Value |
| --- | --- |
| `APP_URL` | `https://app.virtualtrendworks.com` |
| `WORKER_SECRET` | Same value as Render `WORKER_SECRET` |
| `DATABASE_URL` | Same Supabase PostgreSQL connection string |
| `BACKUP_ENCRYPTION_KEY` | Long random secret stored outside the repository |

## Final Verification

Run locally:

```bash
npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict
npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-operational --require-payment
```

Run in GitHub Actions:

1. Open **Actions**.
2. Select **AgencyReport Production Smoke**.
3. Click **Run workflow**.
4. Confirm every required check passes.
