# AgencyReport AI Legal Review Checklist

This package is an operational draft for review by Taiwan counsel. It is not legal advice and `LEGAL_REVIEWED` must remain `false` until counsel approves the published text.

## Provider identity

- [ ] Confirm the contracting legal entity behind Virtual Trend Works.
- [ ] Add business registration number, registered address, and customer-service contact details.
- [ ] Confirm whether sales are B2B only or also offered to consumers.

## Terms and billing

- [ ] Confirm subscription renewal, cancellation, invoice, tax, and delinquency language.
- [ ] Confirm Taiwan digital-service cooling-off rules and any lawful exception.
- [ ] Approve refund eligibility, response target, and payment-dispute procedure.
- [ ] Approve liability cap, warranty disclaimer, governing law, and competent court.

## Privacy and AI

- [ ] Confirm controller/processor roles for agency and end-client data.
- [ ] Approve data categories, purposes, lawful basis, retention periods, and deletion flow.
- [ ] Review international-transfer language and provider processing regions.
- [ ] Review the subprocessor list: Render, Supabase/PostgreSQL, OpenAI, Resend, ECPay, and GitHub Actions.
- [ ] Approve AI disclosure, required human review, fallback behavior, and prohibited use cases.
- [ ] Define security-incident notification and cooperation timing.

## Publication

- [ ] Confirm Traditional Chinese and English meaning are equivalent.
- [ ] Set a new immutable `LEGAL_VERSION` effective date after approval.
- [ ] Set `LEGAL_REVIEWED=true` only after the final published text is approved.
- [ ] Preserve each user's accepted version and trigger re-consent for material changes.
- [ ] Archive the approved source and counsel sign-off outside the application repository.
