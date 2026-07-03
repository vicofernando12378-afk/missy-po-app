# Spec — CRM Leads (crm_leads)

## Purpose
Define the contract for the lead lifecycle: creation, stage transitions, scoring, and decay.

## Collection: `crm_leads`

### Required fields on create
- `name` (string, non-empty)
- `source` (enum: whatsapp | telegram | instagram | facebook | tiktok | youtube | web | manual | club)

### Stage machine
```
nuevo → contactado → calificado → en_seguimiento → cliente
                                                  ↘ perdido
Any stage → perdido (escape hatch)
```
Stage transitions are **not** enforced server-side in v1 — enforced in UI only.

### Scoring v1
| Event | Points |
|-------|--------|
| Inbound interaction | +10 |
| Email open | +5 |
| Product link click | +15 |
| Purchase | +30 |
| Inactivity decay (after 14d) | −1/day |

Score is clamped to [0, 100].

### Acceptance criteria
- [ ] `createLead` throws if `name` missing or `source` invalid
- [ ] `updateLeadStage` throws if stage not in enum
- [ ] `computeScoreDecay` returns unchanged score if inactivity < 14d
- [ ] `computeScoreDecay` decays 1pt/day after 14d threshold
- [ ] Score never goes below 0
- [ ] `recordInteraction` (inbound) increments score by correct SCORE_EVENTS delta
- [ ] `recordInteraction` (outbound) does NOT increment score
