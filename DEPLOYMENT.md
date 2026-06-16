# AgencyReport AI Deployment

Target domain:

```text
virtualtrendworks.com
```

Recommended free/low-cost stack:

- Domain/DNS: Cloudflare
- App hosting: Render Web Service, free instance
- Database: Supabase PostgreSQL
- Email: Resend
- Scheduled worker: GitHub Actions scheduled workflow

## 1. Buy And Prepare The Domain

Buy `virtualtrendworks.com` from Cloudflare Registrar, or buy it from another registrar and point the nameservers to Cloudflare.

Use these subdomains:

```text
virtualtrendworks.com
www.virtualtrendworks.com
app.virtualtrendworks.com
reports.virtualtrendworks.com
```

Recommended public app URL:

```text
https://app.virtualtrendworks.com
```

## 2. Deploy To Render

Create a new Render Web Service from the GitHub repository.

Use:

```text
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
Instance Type: Free
```

The included `render.yaml` can also be used by Render Blueprint.

Add these environment variables in Render:

```env
NODE_ENV=production
DATABASE_URL=your-supabase-postgres-url
DATABASE_SSL=true
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4o-mini
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=AgencyReport AI <hello@reports.virtualtrendworks.com>
WORKER_SECRET=your-long-random-worker-secret
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_MAX=20
APP_BASE_URL=https://app.virtualtrendworks.com
PAYMENT_PROVIDER=ecpay
ECPAY_MODE=production
ECPAY_MERCHANT_ID=your-ecpay-merchant-id
ECPAY_HASH_KEY=your-ecpay-hash-key
ECPAY_HASH_IV=your-ecpay-hash-iv
ECPAY_RETURN_URL=https://app.virtualtrendworks.com/api/billing/ecpay/return
ECPAY_ORDER_RESULT_URL=https://app.virtualtrendworks.com/billing/ecpay/result
ECPAY_CLIENT_BACK_URL=https://app.virtualtrendworks.com
```

For a copy-paste checklist, see `RENDER_ENV_CHECKLIST.md`.

After deploy, confirm:

```text
https://your-render-service.onrender.com/api/health
```

You can also run the production smoke test:

```bash
npm run smoke:prod -- --url https://your-render-service.onrender.com
npm run smoke:prod -- --url https://app.virtualtrendworks.com
```

## 3. Connect Custom Domain

In Render, add this custom domain:

```text
app.virtualtrendworks.com
```

The public homepage currently uses `https://app.virtualtrendworks.com/` for canonical, Open Graph, robots, and sitemap URLs. If the final public site should live at `https://virtualtrendworks.com/` instead, update `index.html`, `APP_BASE_URL`, `ECPAY_*_URL`, and the Render custom domain before launch.

Render will show the exact DNS target. In Cloudflare DNS, add the record Render gives you. It is usually:

```text
Type: CNAME
Name: app
Target: your-render-service.onrender.com
Proxy: DNS only until Render verifies TLS
```

Optional redirects:

```text
virtualtrendworks.com -> https://app.virtualtrendworks.com
www.virtualtrendworks.com -> https://app.virtualtrendworks.com
```

Suggested Cloudflare DNS records:

```text
Type   Name      Target
CNAME  app       your-render-service.onrender.com
CNAME  www       app.virtualtrendworks.com
CNAME  reports   resend-provided-target
```

Keep the `app` record as DNS only until Render confirms the custom domain and certificate. After TLS is active, you can decide whether to enable Cloudflare proxy.

## 4. Verify Resend Email Domain

In Resend, add:

```text
reports.virtualtrendworks.com
```

Copy the DNS records Resend provides into Cloudflare DNS.

After Resend marks it as verified, set:

```env
EMAIL_FROM=AgencyReport AI <hello@reports.virtualtrendworks.com>
```

Then redeploy/restart Render and test:

```bash
npm run email:check
```

For a live test, set:

```env
EMAIL_TEST_TO=your-email@example.com
```

Do not keep `EMAIL_TEST_TO` in production unless you need it for a manual test.

## 5. Configure Free Scheduled Worker

The repository includes:

```text
.github/workflows/worker-cron.yml
.github/workflows/production-smoke.yml
```

Add these GitHub repository secrets:

```text
APP_URL=https://app.virtualtrendworks.com
WORKER_SECRET=the-same-worker-secret-used-in-render
```

The workflow calls:

```text
POST https://app.virtualtrendworks.com/api/worker/run
```

The production smoke workflow runs:

```text
npm run smoke:prod -- --url $APP_URL --strict
```

You can also open GitHub Actions and manually run **AgencyReport Production Smoke** after every Render deploy.

## 6. ECPay URLs

After the app is live and the custom domain is connected, set these URLs in ECPay:

```text
Store URL: https://app.virtualtrendworks.com
Return URL: https://app.virtualtrendworks.com/api/billing/ecpay/return
Order Result URL: https://app.virtualtrendworks.com/billing/ecpay/result
Client Back URL: https://app.virtualtrendworks.com
```

Render environment variables:

```text
APP_BASE_URL=https://app.virtualtrendworks.com
PAYMENT_PROVIDER=ecpay
ECPAY_MODE=production
ECPAY_MERCHANT_ID=your-merchant-id
ECPAY_HASH_KEY=your-hash-key
ECPAY_HASH_IV=your-hash-iv
ECPAY_RETURN_URL=https://app.virtualtrendworks.com/api/billing/ecpay/return
ECPAY_ORDER_RESULT_URL=https://app.virtualtrendworks.com/billing/ecpay/result
ECPAY_CLIENT_BACK_URL=https://app.virtualtrendworks.com
```

Checkout behavior:

1. The app creates a billing intent through `POST /api/billing/checkout`.
2. In `PAYMENT_PROVIDER=ecpay` mode, the returned `checkoutUrl` points to `/billing/ecpay/checkout/{token}`.
3. That page auto-submits the signed ECPay AIO form to ECPay.
4. ECPay posts payment status to `/api/billing/ecpay/return`.
5. The server verifies `CheckMacValue`; only verified successful payments become trusted paid subscriptions.

## 7. Final Readiness Check

Open:

```text
https://app.virtualtrendworks.com/api/health
https://app.virtualtrendworks.com/api/readiness
```

Required items should pass:

```text
database
auth
ai
email
worker
payment
```

When ECPay credentials and callback URLs are configured, `payment` should pass readiness.

Run the same checks from your local machine:

```bash
npm run smoke:prod -- --url https://app.virtualtrendworks.com --strict
```

The smoke test verifies:

- homepage responds and contains `AgencyReport AI`
- no known mojibake appears in the shipped HTML
- homepage and API responses include basic security headers
- `robots.txt` and `sitemap.xml` respond for public launch indexing
- sensitive server files such as `.env`, `server.js`, `data/db.json`, `package.json`, and `render.yaml` are blocked
- `/api/health` is OK
- production storage is PostgreSQL
- OpenAI, Resend, Worker secret, and ECPay are live-ready
- `/api/readiness` reports all required checks as passing
