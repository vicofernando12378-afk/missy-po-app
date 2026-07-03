# Spec — Telegram IA Agent (crm_bot_config/telegram)

## Purpose
Define the contract for the Telegram AI agent: message handling, lead creation, STT/TTS pipeline, escalation, and admin panel.

## Architecture
```
Telegram update → telegramWebhook (responds 200 immediately)
  → Cloud Task → processMessage.js
    → find/create crm_lead (source: "telegram")
    → if voice note: STT → text
    → llmRouter.js → deepseek.js (+ anthropic fallback)
      → core.js builds context + tools
    → response: text or TTS audio
    → save crm_interaction (inbound + outbound)
    → send response via Telegram Bot API
```

## Agent tools (5 — scoped to business)
| Tool | Firestore collection |
|------|---------------------|
| `buscarProducto` | `myp_productos` |
| `consultarPedido` | `myp_pedidos` |
| `crearLead` / `actualizarLead` | `crm_leads` |
| `agendarSeguimiento` | `crm_tasks` |
| `transferirAHumano` | `crm_conversations` |

## LLM provider
- Default: DeepSeek (OpenAI-compatible API, low cost, supports function calling)
- Fallback: Anthropic (more mature tool calling)
- NEVER: general-purpose LLM without tools and business scope

## Firestore: crm_bot_config/telegram
```js
{
  systemPrompt: string,
  businessHours: { start: "09:00", end: "20:00", timezone: "America/Lima" },
  escalationKeywords: string[],
  escalationRules: object,
  voiceEnabled: boolean,
  voiceId: string,         // ElevenLabs voice ID
  llmProvider: "deepseek",
  llmFallbackProvider: "anthropic" | null,
}
```

## Acceptance criteria
- [ ] `/start` command → lead created with `source: "telegram"`
- [ ] Text message → coherent response scoped to pet shop business
- [ ] Voice note → STT transcription → response (text or audio if voiceEnabled)
- [ ] Escalation keyword → `crm_conversation.status = "esperando_humano"`
- [ ] Frustration detection → escalation to human
- [ ] Rate limiting: max 20 messages/hour per chatId
- [ ] Admin panel: edit systemPrompt, toggle voice, view active conversations
- [ ] Each conversation logged as crm_interactions on the lead
