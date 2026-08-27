import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

function secret() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.ADMIN_TOKEN_SECRET || process.env.CRON_SECRET || "";
}

export function signCompetitionAttemptToken(attemptId: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const key = secret();
  if (!key || !attemptId) return "";
  const expiresAt = nowSeconds + TOKEN_TTL_SECONDS;
  const payload = `${attemptId}.${expiresAt}`;
  const signature = createHmac("sha256", key).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyCompetitionAttemptToken(attemptId: string, token: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  const key = secret();
  if (!key || !attemptId || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== attemptId) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt < nowSeconds) return false;
  const expected = createHmac("sha256", key).update(`${parts[0]}.${parts[1]}`).digest("hex");
  const actual = parts[2];
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}
