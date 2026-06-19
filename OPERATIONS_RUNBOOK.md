# AgencyReport AI Operations Runbook

Last reviewed: 2026-06-20 (Asia/Taipei)

This runbook keeps early operations role-based and low-cost. The repository owner is the service owner, and `support@virtualtrendworks.com` is the single customer-facing intake address until a dedicated support team exists.

## Response targets

| Event | First response | Resolution target | Evidence |
| --- | ---: | ---: | --- |
| Service unavailable, suspected data exposure, or payment callback failure | 4 hours | Contain the same day | GitHub monitor issue, Render logs, audit record |
| Failed report, AI degraded, or email delivery failure | 1 business day | 2 business days | Report ID, AI error category, email job ID |
| Payment dispute, duplicate charge, or refund request | 1 business day | 5 business days or provider timeline | Billing intent, ECPay trade number, callback and refund record |
| Account export, correction, or deletion request | 3 business days | 14 days unless a lawful retention need applies | Authenticated request and anonymous deletion audit |
| Backup or restore-drill failure | 4 hours | Restore a verified run within 1 business day | GitHub run and encrypted artifact digest |

## Daily checks

1. Review the latest **AgencyReport Production Smoke**, **AgencyReport Worker**, and **Encrypted Database Backup** runs in GitHub Actions.
2. Confirm open monitor issues have an owner and current status comment.
3. Check failed email jobs, failed AI runs, and unpaid or disputed billing intents.
4. Never place API keys, database URLs, customer CSV data, or report content in GitHub issues or support replies.

## Incident flow

1. **Acknowledge:** record detection time, affected service, and current user impact.
2. **Contain:** disable the affected integration or paid checkout when integrity is uncertain; keep rules-based reporting available when only AI is degraded.
3. **Diagnose:** use sanitized health status, Render logs, tenant-scoped audit IDs, and provider dashboards. Do not copy secrets into tickets.
4. **Recover:** deploy the smallest verified fix, then run production smoke and the affected workflow again.
5. **Close:** document cause, affected period, recovery evidence, and one prevention action.

## Payment operations

- Do not enable paid traffic until `PAYMENT_PROVIDER=ecpay`, production credentials are configured, and `--require-payment` passes.
- Reconcile ECPay `MerchantTradeNo`, amount, billing-intent token, callback signature, and trusted-payment flag before granting a paid plan.
- Complete the refund in ECPay first, then record it through `POST /api/billing/refunds` with the billing intent ID, amount, ECPay refund reference, and reason. The system retains the actor and timestamp, rejects duplicate or excessive refunds, and cancels the plan after a full refund. Never mark a payment refunded from an unverified browser return alone.

## Privacy and account requests

- Require an authenticated session and password confirmation for self-service export or deletion.
- For email requests, verify account ownership before disclosing or changing data.
- Preserve only payment, security, or dispute records that have a documented retention need; primary tenant data is removed through the account deletion flow.

## Escalation

- Customer intake: `support@virtualtrendworks.com`
- Automated incidents: GitHub issue titled `[monitor] AgencyReport production smoke failed`
- Infrastructure: Render, Supabase, Cloudflare, Resend, OpenAI, or ECPay provider dashboard according to the failing readiness category
