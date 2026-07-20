---
name: OpenRouter working model
description: Which OpenRouter free model is confirmed working for this project
---

**Rule:** Use `openai/gpt-oss-20b:free` as the AI model via OpenRouter.

**Why:** Tested 8+ free models. All nvidia/nemotron models return "guardrail restrictions". deepseek/gemma/mistral/moonshotai all say "model unavailable for free". Only `openai/gpt-oss-20b:free` (provider: Darkbloom) returns actual responses.

**How to apply:** AI endpoint is at POST /api/ai/chat — registered as a Vite plugin (`cfAiPlugin`) in vite.config.ts for dev, and in backend-deploy-full/index.js for production. System prompt is CrossFire Wiki assistant, responds in user's language including Arabic (Egyptian dialect).
