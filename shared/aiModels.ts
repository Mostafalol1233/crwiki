// Verified working free models (tested live 2026-09-17 — old ones 404/429).
// Free models rotate often: re-check GET https://openrouter.ai/api/v1/models
// (ids ending in :free) and tiny-test candidates before changing this list.
export const DEFAULT_AI_MODEL = "nex-agi/nex-n2.5-pro:free";

export const FALLBACK_AI_MODELS = [
  "nex-agi/nex-n2.5-mini:free",
  "dots-studio/dots-3-note-preview:free",
  "z-ai/glm-5.2:free",
  "google/gemma-4-31b-it:free",
] as const;

export function getAiModelCandidates(configuredModel?: string) {
  const configured = String(configuredModel || "").trim();
  const retired = ["openai/gpt-oss-20b:free", "openai/gpt-oss-20b", "minimax/minimax-m3:free"];
  const normalized = retired.includes(configured) ? DEFAULT_AI_MODEL : configured;
  return Array.from(new Set([
    normalized || DEFAULT_AI_MODEL,
    ...FALLBACK_AI_MODELS,
  ]));
}
