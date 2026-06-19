# AgencyReport AI Launch Readiness

Last evidence review: 2026-06-19 (Asia/Taipei)

This document separates verified production state, locally verified changes that still need deployment, and external approvals. A checked item must have direct runtime, database, browser, or automated-test evidence.

## Verified production infrastructure

- [x] **Custom application domain:** Render exposes `https://app.virtualtrendworks.com` as the primary URL.
- [x] **DNS:** Cloudflare has a DNS-only CNAME from `app.virtualtrendworks.com` to `agencyreport-ai.onrender.com`.
- [x] **Email domain:** Resend shows `reports.virtualtrendworks.com` as verified with Sending enabled in Tokyo (`ap-northeast-1`).
- [x] **Email DNS:** DKIM, SPF MX, and SPF TXT records are verified; DMARC exists at `_dmarc.virtualtrendworks.com`.
- [x] **Production database:** Supabase PostgreSQL 17.6 is reachable over SSL.
- [x] **Database schema:** schema v3 is applied to 379 records with seven indexes and validated primary-key and owner/payload constraints.
- [x] **Database integrity:** zero owner mismatches and zero invalid JSON payloads.

## Locally complete, awaiting Git deployment

- [x] Tenant-scoped records, account export/deletion, password reset session revocation, and 20 security assertions.
- [x] Transactional differential PostgreSQL upserts and schema-v3 indexes/constraints.
- [x] Encrypted backup format, checksum/tamper checks, and rollback-only restore drill.
- [x] ECPay signature, amount, merchant, duplicate-callback, and trusted-payment tests.
- [x] Nonce-based CSP on quote and ECPay redirect pages; invoice page is read-only.
- [x] Bilingual legal center, policy version tracking, subprocessors, AI/refund/DPA sections, and counsel checklist.
- [x] Traditional Chinese and English catalog parity plus visible English landing/workspace CJK rejection.
- [x] Frontend dynamic-content escaping and browser XSS injection test.
- [x] Scheduled worker: authenticated, idempotent, tenant-scoped, AI-first with fallback, and automatic email processing.
- [x] Secure manual CSV and public Google Sheets import with SSRF, redirect, timeout, and size controls.
- [x] Bilingual clickable verification/reset emails and account-enumeration protection.
- [x] Current dependency audit reports zero known vulnerabilities.
- [x] Production smoke includes HTTPS enforcement, cold-start retries, and separate core-service versus full operational gates; the local production-mode run passed 51/51 checks.
- [x] **GitHub automation secrets:** repository Actions secrets now include `DATABASE_URL`, `BACKUP_ENCRYPTION_KEY`, `WORKER_SECRET`, and `APP_URL`; values remain encrypted and were not exposed during verification.
- [x] **Backup automation:** manually triggered run `27844337774` completed successfully and produced encrypted artifact `agencyreport-db-27844337774` (52.9 KB) after the restore drill.
- [x] **Worker automation:** manually triggered run `27844384272` completed successfully against the production application URL.
- [x] **Release CI:** commit `1e65df5` passed AgencyReport CI run `27844509691`, including core, security, bilingual, browser, desktop, and mobile checks.
- [x] **Production deployment:** commit `1e65df5` is served at `https://app.virtualtrendworks.com`; the deployed core production smoke passed 51/51 checks.
- [x] **Production monitoring:** manual monitor run `27844664556` completed successfully against the custom domain and closed the prior outage issue.

## Deployment evidence gap

- [x] Commit and push the hardened working tree as `1e65df5` on `main`.
- [x] Confirm the custom production domain serves the hardened release through a 51/51 strict core smoke run.
- [ ] Run `npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-operational` after Taiwan counsel approves the published legal text. The current run passes 52/54 and fails only the aggregate readiness assertion and `legal` review gate.
- [ ] Run desktop/mobile Traditional Chinese and English visual tests against the deployed commit.

## External launch gates

- [ ] **Taiwan legal review:** counsel must approve the final entity details, consumer/digital-service refund wording, international transfers, retention, liability, and jurisdiction. Then publish a new immutable `LEGAL_VERSION` and set `LEGAL_REVIEWED=true`.
- [ ] **ECPay production approval:** obtain and configure production Merchant ID, HashKey, and HashIV after public-site review; then complete one low-value real payment and refund/reconciliation check.
- [ ] **OpenAI live capacity:** the 2026-06-20 live smoke reached OpenAI but returned `quota exceeded`; enable API billing/quota, then rerun `npm run smoke:ai` until live provider and structured-output assertions pass.
- [x] **Scheduled production monitoring:** manual workflow run `27844664556` succeeded after the hardened commit was deployed; the daily schedule remains enabled.
- [ ] **Operational ownership:** choose the person and response target for payment disputes, privacy/deletion requests, failed reports, and monitoring alerts.

## Launch decision

**Current decision: not ready for unrestricted paid public registration.** The product code and production database are substantially hardened, while the deployed application is behind the working tree and the legal, ECPay, live-AI, and scheduled-automation gates still require direct evidence.

The site may remain online for controlled review and ECPay approval, but paid traffic should wait until every item under Deployment evidence gap and External launch gates is checked.
