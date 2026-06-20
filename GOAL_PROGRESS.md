# AgencyReport AI Goal Progress

Last updated: 2026-06-20 (Asia/Taipei)

## Previous goal: public registration and production operations

Status: blocked only by external ECPay production approval and credentials.

Verified complete:

- Multi-tenant ownership isolation, account export/deletion, XSS protection, CSP, hashed sessions, and password reset revocation.
- PostgreSQL schema v4 on Supabase with normalized tenant records, connector indexes, constraints, monitoring, encrypted backup, and restore drill.
- Production deployment at `https://app.virtualtrendworks.com`, verified Resend sender domain, live OpenAI generation, worker automation, and bilingual UI.
- Production smoke coverage passed 54/54; unconfigured production checkout is explicitly disabled and cannot create mock payments.
- ECPay signature, callback, amount, duplicate event, trusted payment, and refund reconciliation flows pass automated stage tests.
- Light-theme upgrade modal contrast is verified from both workspace and public landing entry points.

Remaining external gate:

- Obtain ECPay production Merchant ID, HashKey, and HashIV.
- Configure production environment variables.
- Complete one low-value real payment, refund, and reconciliation exercise.

## New goal: automated advertising data connectors

Build a production-ready, multi-tenant connector platform for Google Ads, Meta Ads, and GA4, including OAuth authorization, encrypted refresh-token storage, account/property selection, scheduled incremental synchronization, retries and quota handling, normalized KPI data, sync observability, disconnect/reconnect controls, and automatic monthly-report generation from synchronized data.

Initial delivery order:

1. Shared encrypted connector credential and sync-job architecture.
2. GA4 Data API connector.
3. Google Ads API connector.
4. Meta Marketing API connector.
5. Unified KPI normalization, scheduled sync, AI report integration, UI, tests, and production rollout.

### Connector goal progress

- [x] Shared OAuth start and callback contract for GA4, Google Ads, and Meta Ads.
- [x] Google PKCE, short-lived hashed state, replay protection, and authorization-code exchange.
- [x] AES-256-GCM connector token vault with tenant-bound additional authenticated data.
- [x] Tenant-scoped connection status and disconnect lifecycle; account exports redact all OAuth and token material.
- [x] Connector security, GA4, Google Ads, Meta Ads, incremental scheduling, reauthorization, quota backoff, reconciliation, audit trail, unified reporting, and auto-report smoke expanded to 73 assertions.
- [x] GA4 account/property discovery, Property selection, token refresh, paginated Data API synchronization, quota retry, and tenant-scoped UI.
- [x] PostgreSQL schema v4 connector indexes and normalized GA4 KPI storage.
- [x] GA4 first release deployed at `https://app.virtualtrendworks.com`; production database validation and 54/54 operational smoke passed.
- [x] Google Ads API v24 customer discovery, MCC/client selection, `login-customer-id`, GAQL `searchStream`, transient retry, tenant-scoped UI, and normalized campaign KPI storage.
- [x] Google Ads and Meta connector releases deployed at `https://app.virtualtrendworks.com`; current production operational smoke passes 52/52.
- [ ] Configure production Google OAuth client, Google Ads developer token, and connector encryption key; complete a real client-account authorization and reconciliation run.
- [x] Meta Graph API v25 long-lived token exchange, app-secret proof, paginated ad-account selection, daily campaign Insights synchronization, retry handling, tenant-scoped UI, and normalized KPI storage.
- [ ] Configure the production Meta app and complete App Review / Business Verification plus a real ad-account reconciliation run.
- [x] Unified KPI model avoids GA4/ad-platform outcome double counting and exposes tenant-scoped report data.
- [x] Daily/weekly/monthly connector scheduling, 90-day initial backfill, two-day rolling attribution refresh, worker locks, exponential quota backoff, reauthorization state, and sync observability UI.
- [x] Connector worker creates one reusable AI run and report draft per tenant/month while enforcing the account's AI quota.
- [x] Daily GitHub Actions worker triggers both report schedules and connector synchronization and surfaces connector job/failure counts in operational logs.
- [x] Reconciliation API and UI expose provider coverage, freshness, canonical KPI policy, attribution-difference warnings, and a credential-safe connector audit trail.
- [x] Public readiness now distinguishes manual imports from full direct-connector readiness and reports missing environment gates plus pinned provider API versions.
- [ ] Configure production provider credentials, complete real-account reconciliation, and monitor the first scheduled production runs.
