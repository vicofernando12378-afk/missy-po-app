# Spec — Social Lead Capture (Meta IG/FB + YouTube)

## Purpose
Automatically create CRM leads from Instagram comments/DMs, Facebook comments/DMs, and YouTube comments.

## Intent dictionary (v1 — commercial intent)
```
ES: precio, cuanto cuesta, disponible, quiero, envío, talla, stock,
    comprar, pedido, enviar, quiero comprar, me interesa, cuanto vale
```

## Capture logic
| Source | Trigger | Lead created? |
|--------|---------|---------------|
| Instagram DM | Any DM | Always |
| Instagram comment | Contains intent keyword | Yes |
| Facebook DM | Any DM | Always |
| Facebook comment | Contains intent keyword | Yes |
| YouTube comment | Contains intent keyword | Yes (polling every 30 min) |
| TikTok | No webhook available | Manual weekly process only |

## Meta webhook security
- GET: verify `hub.verify_token` matches `META_VERIFY_TOKEN` secret
- POST: validate `X-Hub-Signature-256` header against `META_APP_SECRET`

## Acceptance criteria
- [ ] Meta GET verification challenge returns `hub.challenge`
- [ ] Invalid POST signature returns 403
- [ ] Instagram DM → lead created with `source: "instagram"`, `type: "dm"`
- [ ] Instagram comment without intent keyword → no lead created
- [ ] Instagram comment with "precio" → lead created with `type: "comment"`
- [ ] YouTube comment with intent keyword → lead in Kanban within 30 minutes
