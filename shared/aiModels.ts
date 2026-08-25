export const DEFAULT_AI_MODEL = "openai/gpt-oss-20b";

export const FALLBACK_AI_MODELS = [
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
] as const;

export function getAiModelCandidates(configuredModel?: string) {
  const configured = String(configuredModel || "").trim();
  const normalized = configured === "openai/gpt-oss-20b:free" ? DEFAULT_AI_MODEL : configured;
  return Array.from(new Set([
    normalized || DEFAULT_AI_MODEL,
    ...FALLBACK_AI_MODELS,
  ]));
}
