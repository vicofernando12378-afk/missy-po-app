# Spec — CRM Segments (crm_segments)

## Purpose
Define rules for dynamic segmentation of leads. Segments are evaluated nightly and materialized for fast queries.

## Collection: `crm_segments`

### Document shape
```js
{
  name: string,
  description: string,
  rules: [{ field: string, operator: string, value: any }],  // AND logic in v1
  leadIds: string[],        // materialized — refreshed nightly
  leadCount: number,
  lastComputedAt: Timestamp,
}
```

### Supported operators (v1)
| Operator | Meaning |
|----------|---------|
| `==` | Equals |
| `!=` | Not equals |
| `>` | Greater than |
| `>=` | Greater than or equal |
| `<` | Less than |
| `array-contains` | Tag or segmentId membership |

### Seeded segments
1. **Miembros del Club** — `source == "club"`
2. **Leads sin convertir en 30 días** — `stage != "cliente" AND createdAt < now-30d`

### Acceptance criteria
- [ ] `evaluateRule(lead, rule)` returns boolean correctly for all operators
- [ ] `evaluateSegment(lead, rules)` applies AND logic across all rules
- [ ] `recomputeSegments` Cloud Function updates `leadIds` and `leadCount` for all segments
- [ ] Segment UI shows real-time `leadCount` preview before save
