# AgencyReport AI Marketing Operations

This document records the accounts, ownership, and recurring checks needed to grow organic traffic without putting passwords or API secrets in the repository.

## Measurement and Discovery

| Service | Purpose | Status | Owner |
| --- | --- | --- | --- |
| Google Analytics 4 | Measure landing-page traffic, sign-up intent, and report-generation funnel | Google tag installed | Workspace owner |
| Google Search Console | Submit sitemap, inspect indexation, monitor search queries and Core Web Vitals | Verification in progress for `https://app.virtualtrendworks.com/` | Workspace owner |
| Bing Webmaster Tools | Submit the same sitemap and monitor Bing search performance | Pending | Workspace owner |

## Safe Access Record

Do not write passwords, API keys, recovery codes, or payment credentials in this repository or a plain-text file. Store them in the account owner's password manager instead.

The local ignored file `private/marketing-access.txt` can record the service name, property URL, owner email, password-manager item name, and last review date. It is intentionally ignored by Git.

## First 30 Days

1. Verify Search Console and submit `https://app.virtualtrendworks.com/sitemap.xml`.
2. Add the same site and sitemap to Bing Webmaster Tools.
3. Inspect the homepage and each resource URL after publication, then request indexing only for the changed URLs.
4. Review Search Console weekly: impressions, clicks, queries, indexed pages, and mobile usability.
5. Expand the resource center only from real search-query demand or customer questions. Prioritize one detailed guide at a time over thin, repetitive posts.

## Content Standard

Every new resource should have a distinct search intent, a concise answer above the fold, original practical guidance, an internal link to the product, a canonical URL, and a sitemap entry. Do not publish unreviewed AI claims, fabricated customer outcomes, or copied competitor content.
