# Google OAuth Verification Packet

Use this checklist when submitting AgencyReport AI for Google OAuth verification.

## App identity

- App name: AgencyReport AI
- Company / developer: Virtual Trend Works
- Production domain: https://app.virtualtrendworks.com
- Authorized domain: virtualtrendworks.com
- Homepage URL: https://app.virtualtrendworks.com/
- Privacy Policy URL: https://app.virtualtrendworks.com/privacy
- Terms of Service URL: https://app.virtualtrendworks.com/terms
- Data deletion URL: https://app.virtualtrendworks.com/data-deletion
- Support email: support@virtualtrendworks.com
- Backup contact email: chenbobe12@gmail.com

## OAuth client

OAuth app type: Web application

Authorized redirect URIs:

- https://app.virtualtrendworks.com/api/connectors/oauth/callback/ga4
- https://app.virtualtrendworks.com/api/connectors/oauth/callback/google_ads

Do not submit the Meta callback to Google. It belongs in Meta developer settings only:

- https://app.virtualtrendworks.com/api/connectors/oauth/callback/meta_ads

## Google scopes used by the app

### https://www.googleapis.com/auth/analytics.readonly

Purpose:

AgencyReport AI reads the Google Analytics properties selected by the signed-in user and synchronizes reporting metrics such as active users, sessions, conversions, revenue, traffic source, and date-based trends. The data is used to generate monthly marketing reports, KPI summaries, charts, risks, and next-month recommendations for the user's own client reporting workflow.

Data handling:

The app only reads analytics data after explicit user authorization. Access tokens and refresh tokens are encrypted at rest. Analytics data is stored under the user's workspace and is not sold or used for unrelated advertising.

### https://www.googleapis.com/auth/adwords

Purpose:

AgencyReport AI reads Google Ads accounts accessible to the authorized user, lets the user select a reportable customer account, and synchronizes advertising delivery and performance metrics such as spend, impressions, clicks, conversions, and conversion value. The data is used to build monthly advertising reports and AI-assisted action recommendations.

Data handling:

The app uses Google Ads data only for the connected user's reporting workspace. The service does not modify campaigns, budgets, ads, keywords, or account settings. Access tokens and refresh tokens are encrypted at rest and can be revoked by the user from their Google Account.

## Demo video script

Record a short screen capture that shows the following flow:

1. Open https://app.virtualtrendworks.com and sign in.
2. Open the workspace integrations or settings area.
3. Click the Google Analytics connection button.
4. Complete Google OAuth consent.
5. Return to AgencyReport AI and show the GA4 property list loading.
6. Select a GA4 property and run synchronization.
7. Click the Google Ads connection button.
8. Complete Google OAuth consent.
9. Return to AgencyReport AI and show accessible Google Ads customers loading.
10. Select a non-manager Google Ads customer and run synchronization.
11. Generate a monthly report from the synchronized metrics.
12. Show the report preview and PDF/HTML export.
13. Mention that users can revoke Google access from Google Account security settings and request deletion at https://app.virtualtrendworks.com/data-deletion.

## Verification wording to avoid

- Do not claim the app optimizes, edits, creates, or manages Google Ads campaigns unless those write features are actually implemented and reviewed.
- Do not describe AI output as final advice. Use "draft", "recommendation", "summary", and "requires user review".
- Do not list unimplemented connectors or future features in the OAuth scope justification.

## Current production limitation

Meta Ads is excluded from Google OAuth verification. Meta production access may still require Meta Business verification and separate app review.
