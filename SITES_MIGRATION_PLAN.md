# AgencyReport AI Sites Migration Plan

## Objective

Move the public product experience to the Sites/edge runtime without breaking
existing AgencyReport AI customers, reports, subscriptions, connector records,
or payment callbacks.

## Migration Principles

1. Keep the PostgreSQL database as the source of truth until a verified export,
   import, and reconciliation process exists.
2. Run the new application alongside the current production application. No DNS
   cutover occurs until the acceptance checklist passes.
3. Preserve externally registered callback URLs while their provider approval
   is active. OAuth and ECPay URLs change only in a planned compatibility
   release.
4. Every migrated route requires an authenticated success case, unauthorized
   rejection case, and a failure/rollback case.

## Feature Inventory And Target

| Feature | Current dependency | Target state | Acceptance evidence |
| --- | --- | --- | --- |
| Public homepage, resources, pricing | Render static HTML | Sites public routes | SEO pages, analytics, language, and CTA tests pass |
| Account registration, login, password changes | Node sessions + PostgreSQL | Edge-compatible account API backed by PostgreSQL | Register, login, logout, reset, and session expiry tests pass |
| Workspace and report archive | Node API + PostgreSQL | Sites app routes + same PostgreSQL records | Existing customer sees the same reports and settings |
| AI import and report generation | OpenAI API + usage records | Edge API with server-held secrets | Quota, AI success, and fallback tests pass |
| PDF/HTML export and share links | Node rendering + PostgreSQL | Edge export route or compatible retained service | Report visual and download tests pass |
| ECPay checkout and return webhook | Signed ECPay form + callback URL | Edge-compatible signed checkout + dual callback window | Test payment is verified exactly once |
| Resend delivery | Resend API + job records | Edge send route + durable job status | Draft, send, and failed delivery tests pass |
| Google Ads and GA4 OAuth | OAuth callbacks + encrypted tokens | Edge callback routes + encrypted token vault | Connect, refresh, sync, disconnect tests pass |
| Meta Ads OAuth | Credentials not configured | Configure Meta first, then migrate | Authorization and sync tests pass |
| Scheduled synchronisation | GitHub Actions + Node worker secret | Edge scheduled trigger or retained worker during transition | Due jobs are processed once and retries are logged |

## Phased Delivery

### Phase 0: Baseline and safety

- Export a schema and record-count baseline from PostgreSQL.
- Freeze the public route contract and capture smoke-test results.
- Record the live OAuth and ECPay callback URLs.
- Keep the current Render service live as the rollback target.

### Phase 1: Sites public surface

- Move the homepage, pricing, resources, legal pages, analytics, and feedback
  to Sites.
- Route all product CTAs to the existing app until the protected workspace is
  ready.
- Validate public performance, metadata, sitemap, robots, responsive layout,
  and contact conversion.

### Phase 2: Edge application foundation

- Add a server-only API boundary, database adapter, secure session handling,
  audit logging, rate limits, and an encrypted connector-token vault.
- Implement read-only account, client, report, subscription, and archive views
  against the existing PostgreSQL data.
- Reconcile record counts and ownership filters with production.

### Phase 3: Write workflows

- Migrate report creation, AI import chat, AI generation, export, delivery,
  feedback, and archived-report retrieval.
- Add idempotency keys for report runs, delivery jobs, and payment events.
- Keep writes dual-observable: compare the new result with the old route before
  enabling the new UI for customers.

### Phase 4: External integrations

- Add ECPay dual callback support, then switch checkout only after a verified
  test order.
- Add Google Ads, GA4, and Meta callback compatibility without invalidating
  existing connector grants.
- Move scheduled syncs only after retry and duplicate-prevention tests pass.

### Phase 5: Cutover

- Enable Sites workspace for an internal canary account first.
- Run the full acceptance matrix with a production-like account.
- Switch `app.virtualtrendworks.com` only after payment, OAuth, report export,
  and archive verification pass.
- Retain the Render service as rollback for at least one billing cycle.

## Current Readiness Snapshot (2026-07-16)

- AI: live-ready (OpenAI)
- Email: live-ready (Resend)
- Payment: live-ready (ECPay webhook configured)
- Google Ads: OAuth-ready
- GA4: OAuth-ready
- Meta Ads: blocked until `META_APP_ID` and `META_APP_SECRET` are configured
- Render plan: free, therefore subject to idle cold starts

## Definition Of Done

The migration is complete only when all of the following are true:

1. New and existing users can authenticate and access only their own records.
2. Existing reports, client data, plan limits, and delivery records are visible
   and unchanged in the new workspace.
3. A user can import source data, generate an AI report, export PDF and HTML,
   share the report, and send or prepare a delivery email.
4. A successful ECPay payment upgrades access once; duplicate callbacks do not
   duplicate a subscription or charge state.
5. Google Ads, GA4, and Meta connectors can connect, synchronize, refresh, and
   disconnect without exposing tokens to the browser.
6. All automated smoke tests pass and a human acceptance pass completes on
   desktop and mobile.
7. A tested rollback returns traffic to the existing service without data loss.
