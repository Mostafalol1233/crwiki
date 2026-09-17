---
name: OpenRouter working model
description: Which OpenRouter free model is confirmed working for this project
---

**Rule:** Use `nex-agi/nex-n2.5-pro:free` as the primary AI model via OpenRouter, with fallbacks `nex-agi/nex-n2.5-mini:free` → `dots-studio/dots-3-note-preview:free` → `z-ai/glm-5.2:free` → `google/gemma-4-31b-it:free`.

**Why:** Tested live 2026-09-17. `minimax/minimax-m3:free` and `openai/gpt-oss-20b:free` are dead (404). `z-ai/glm-5.2:free` and `google/gemma-4-*:free` return 429 (free-tier throttled, quotas reset daily — keep as last-resort fallbacks only). `nex-agi/nex-n2.5-pro:free` verified with English + Arabic replies.

**Notes:**
- Free models rotate constantly. Before changing models, check GET https://openrouter.ai/api/v1/models (ids ending `:free`) and tiny-test each candidate (one English + one Arabic prompt).
- Reasoning-style models burn `max_tokens` on thinking: keep chat at 2048 tokens minimum or answers come back empty.
- Chain lives in `api/ai/chat.ts` (prod) and `shared/aiModels.ts` (dev plugin + reference). Auto-publisher default is in `api/scrape/[action].ts` → keep it in sync.

**How to apply:** AI endpoint is at POST /api/ai/chat — registered as a Vite plugin (`cfAiPlugin`) in vite.config.ts for dev, and in backend-deploy-full/index.js for production. System prompt is CrossFire Wiki assistant, responds in user's language including Arabic (Egyptian dialect).
