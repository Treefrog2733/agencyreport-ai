# AgencyReport AI Launch Status

Last updated: 2026-06-18

## Verified In Current Worktree

- Multi-tenant ownership isolation for clients, reports, billing, usage, and audit records.
- PostgreSQL normalized record storage (schema v2) with owner and collection indexes.
- Legacy JSONB migration with timestamp-based cutover protection; the legacy row is preserved.
- Supabase migration completed: 377 records migrated and schema v2 verified.
- Encrypted AES-256-GCM + gzip database backup and restore verification tool.
- Pre- and post-migration encrypted backups created locally.
- Password hashing, hashed server sessions, email verification, password reset, and session revocation.
- Production browser sessions use HttpOnly, SameSite=Lax, Secure cookies; Bearer tokens remain test/API compatible.
- CSP, HSTS, frame blocking, sensitive-file blocking, rate limiting, and no wildcard API CORS.
- Versioned Terms/Privacy acceptance captured with time, policy version, IP hash, and user agent.
- Traditional Chinese and English legal pages.
- Complete English workspace smoke gate: visible CJK text fails the test.
- Desktop English, mobile English, and mobile Traditional Chinese workspace tests pass with no horizontal overflow.
- ECPay stage smoke passes signed checkout, forged callback rejection, signed wrong-amount rejection, valid callback, and trusted paid-state update.
- Security smoke passes tenant isolation, session, legal-consent, and password-reset checks.
- Local production smoke correctly fails the email readiness gate while the sender is still the temporary Resend domain.
- Dependency audit reports 0 known production vulnerabilities.

## Automated Operations Added

- Daily production smoke workflow with an outage issue opened on failure and closed on recovery.
- Daily encrypted PostgreSQL backup workflow with 30-day artifact retention.
- Database commands:

  ```bash
  npm run db:check
  npm run db:migrate
  npm run db:migrate -- --apply
  npm run db:backup
  node scripts/db-backup.js --verify <backup-file>
  ```

- Verification commands:

  ```bash
  npm run smoke:security
  npm run smoke:payment
  npm run smoke:workspace -- --lang en
  npm run smoke:prod -- --url <url> --strict
  npm run smoke:prod -- --url <url> --strict --require-operational --require-payment
  ```

## External Launch Blockers

1. Push this worktree and allow Render to deploy the new commit.
2. Add `app.virtualtrendworks.com` as a Render custom domain.
3. In Cloudflare, add `CNAME app -> agencyreport-ai.onrender.com` as DNS-only until Render provisions TLS.
4. Add and verify `reports.virtualtrendworks.com` in Resend, then set:

   ```env
   EMAIL_FROM=AgencyReport AI <hello@reports.virtualtrendworks.com>
   ```

   The current sender is `onboarding@resend.dev` and is intentionally rejected by the new production readiness gate.
5. Have the published `legal-2026-06-18` draft reviewed for Taiwan paid SaaS use, then set `LEGAL_REVIEWED=true`.
6. Add GitHub secrets `APP_URL`, `WORKER_SECRET`, `DATABASE_URL`, and `BACKUP_ENCRYPTION_KEY`.
7. After the public URL is reachable, submit it to ECPay and add the production merchant credentials in Render.

## Current DNS And Provider Evidence

- `virtualtrendworks.com` nameservers: Cloudflare (`june.ns.cloudflare.com`, `louis.ns.cloudflare.com`).
- `app.virtualtrendworks.com`: not resolved as of 2026-06-18.
- Resend API key: send-only; it cannot create or inspect domains.
- Local runtime sender: `AgencyReport AI <onboarding@resend.dev>`.
- Local payment provider: `mock`; production ECPay credentials are not present locally.

## Final Go-Live Gate

Do not call the system fully production-ready until this passes:

```bash
npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict --require-operational --require-payment
```

Also complete one real low-value ECPay transaction, receive one verification/reset email from the verified domain, and restore one encrypted backup into a disposable PostgreSQL database.
