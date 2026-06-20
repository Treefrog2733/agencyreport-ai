# AgencyReport AI Launch Readiness

Last evidence review: 2026-06-20 (Asia/Taipei)

This document separates verified production state, locally verified changes that still need deployment, and external approvals. A checked item must have direct runtime, database, browser, or automated-test evidence.

## Verified production infrastructure

- [x] **Custom application domain:** Render exposes `https://app.virtualtrendworks.com` as the primary URL.
- [x] **DNS:** Cloudflare has a DNS-only CNAME from `app.virtualtrendworks.com` to `agencyreport-ai.onrender.com`.
- [x] **Email domain:** Resend shows `reports.virtualtrendworks.com` as verified with Sending enabled in Tokyo (`ap-northeast-1`).
- [x] **Email DNS:** DKIM, SPF MX, and SPF TXT records are verified; DMARC exists at `_dmarc.virtualtrendworks.com`.
- [x] **Production database:** Supabase PostgreSQL 17.6 is reachable over SSL.
- [x] **Database schema:** schema v3 is applied to 379 records with seven indexes and validated primary-key and owner/payload constraints.
- [x] **Database integrity:** zero owner mismatches and zero invalid JSON payloads.

## Verified application controls

- [x] Tenant-scoped records, account export/deletion, password reset session revocation, and 20 security assertions.
- [x] Transactional differential PostgreSQL upserts and schema-v3 indexes/constraints.
- [x] Encrypted backup format, checksum/tamper checks, and rollback-only restore drill.
- [x] ECPay signature, amount, merchant, duplicate-callback, trusted-payment, and tenant-scoped refund reconciliation tests (15/15 assertions).
- [x] Nonce-based CSP on quote and ECPay redirect pages; invoice page is read-only.
- [x] Low-cost bilingual operating notice, policy version tracking, subprocessors, AI/refund/DPA sections, and consent records; external counsel review is not a launch gate.
- [x] Traditional Chinese and English catalog parity plus visible English landing/workspace CJK rejection.
- [x] Frontend dynamic-content escaping and browser XSS injection test.
- [x] Scheduled worker: authenticated, idempotent, tenant-scoped, AI-first with fallback, and automatic email processing.
- [x] Secure manual CSV and public Google Sheets import with SSRF, redirect, timeout, and size controls.
- [x] Bilingual clickable verification/reset emails and account-enumeration protection.
- [x] Current dependency audit reports zero known vulnerabilities.
- [x] Production smoke includes HTTPS enforcement, cold-start retries, and separate core-service versus full operational gates; the local production-mode run passed 51/51 checks.
- [x] AI runtime monitoring records live provider degradation with sanitized quota/rate/auth/timeout categories, keeps rules fallback available, and automatically recovers readiness after the next successful live request; the local degradation/recovery smoke passed 9/9 assertions.
- [x] **GitHub automation secrets:** repository Actions secrets now include `DATABASE_URL`, `BACKUP_ENCRYPTION_KEY`, `WORKER_SECRET`, and `APP_URL`; values remain encrypted and were not exposed during verification.
- [x] **Backup automation:** manually triggered run `27844337774` completed successfully and produced encrypted artifact `agencyreport-db-27844337774` (52.9 KB) after the restore drill.
- [x] **Worker automation:** manually triggered run `27844384272` completed successfully against the production application URL.
- [x] **Release CI:** commit `1e65df5` passed AgencyReport CI run `27844509691`, including core, security, bilingual, browser, desktop, and mobile checks.
- [x] **Production deployment:** commit `1e65df5` is served at `https://app.virtualtrendworks.com`; the deployed core production smoke passed 51/51 checks.
- [x] **Production monitoring:** manual monitor run `27844664556` completed successfully against the custom domain and closed the prior outage issue.
- [x] **Production visual QA:** desktop and mobile runs passed in both Traditional Chinese and English across landing, overview, case, report, AI, delivery, billing, settings, and chart views (36 rendered states total).

## Deployment evidence gap

- [x] Commit and push the hardened working tree as `1e65df5` on `main`.
- [x] Confirm the custom production domain serves the hardened release through a 51/51 strict core smoke run.
- [x] Run `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-operational` after deploying the simplified legal gate; all 53 checks passed with no missing required services.
- [x] Run desktop/mobile Traditional Chinese and English visual tests against the deployed commit.
- [x] Deploy refund reconciliation commit `745bdac`; the custom production domain exposed the new release and passed the strict operational smoke test 53/53 on 2026-06-20.
- [x] Deploy payment safety commit `a613158`; production reports `checkoutEnabled=false` while ECPay credentials are absent, so public registration remains available without creating misleading mock payments.

## External launch gates

- [ ] **ECPay production approval:** obtain and configure production Merchant ID, HashKey, and HashIV after public-site review; then complete one low-value real payment and refund/reconciliation check.
- [x] **OpenAI live capacity:** after API balance was added, the 2026-06-20 live smoke passed provider, structured summary/risk/action/client-message, and usage assertions.
- [x] **Scheduled production monitoring:** manual workflow run `27844664556` succeeded after the hardened commit was deployed; the daily schedule remains enabled.
- [x] **Operational ownership:** the repository owner is the service owner, `support@virtualtrendworks.com` is the single intake address, and `OPERATIONS_RUNBOOK.md` defines response targets for payment, privacy, report, monitoring, and backup events.

## Launch decision

**Current decision: ready for controlled public registration, but not paid checkout.** The hardened application, PostgreSQL, live OpenAI generation, Resend, CI, backup, worker, monitoring, bilingual notices, visual paths, and operational ownership are verified. Paid traffic still waits on ECPay production approval and one real payment/refund reconciliation exercise.

The site may remain online for controlled review and ECPay approval, but paid traffic should wait until every item under Deployment evidence gap and External launch gates is checked.
