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
PAYMENT_PROVIDER=mock
```

After deploy, confirm:

```text
https://your-render-service.onrender.com/api/health
```

## 3. Connect Custom Domain

In Render, add this custom domain:

```text
app.virtualtrendworks.com
```

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

## 6. ECPay URLs

After the app is live, use these URLs for ECPay:

```text
Store URL: https://app.virtualtrendworks.com
Return URL: https://app.virtualtrendworks.com/api/billing/ecpay/return
Order Result URL: https://app.virtualtrendworks.com/billing/ecpay/result
Client Back URL: https://app.virtualtrendworks.com
```

Payment code still needs the ECPay provider implementation before production payments.

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

Before ECPay is implemented, `payment` will remain the final blocking item.
