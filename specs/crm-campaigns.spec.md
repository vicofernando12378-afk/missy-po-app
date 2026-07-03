# Spec — CRM Campaigns (crm_campaigns)

## Purpose
Define the contract for email campaign dispatch via Brevo, including consent enforcement and event tracking.

## Collection: `crm_campaigns`

### Document shape
```js
{
  name: string,
  channel: "email",          // v1: email only
  segmentId: string,
  subject: string,
  templateHtml: string,
  status: "borrador" | "programada" | "enviando" | "enviada",
  scheduledAt: Timestamp | null,
  stats: { sent, delivered, opened, clicked, bounced, unsubscribed },
  createdAt: Timestamp,
}
```

### Consent enforcement
- Only leads with `consent.email == true` receive emails.
- Unsubscribe event from Brevo webhook sets `consent.email = false` on the lead.

### Brevo integration
- Brevo API key stored as Firebase Secret: `BREVO_API_KEY`
- Existing app uses `myp_correos` collection with Firebase Trigger Email extension for transactional emails.
- Campaigns use Brevo REST API directly (not Trigger Email — bulk send, not transactional).

### Acceptance criteria
- [ ] `sendCampaign` callable rejects unauthenticated + non-admin callers
- [ ] `sendCampaign` skips leads without `consent.email == true`
- [ ] `emailWebhook` creates `crm_interaction` of type `email_open` on open event
- [ ] `emailWebhook` sets `consent.email = false` on unsubscribe event
- [ ] Campaign `stats` update correctly from webhook events
