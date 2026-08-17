import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminTokenPayload = {
  id?: string;
  role: string;
  username: string;
  permissions: Record<string, boolean>;
  exp: number;
};

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function tokenSecret(): string {
  return (
    process.env.ADMIN_TOKEN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", tokenSecret()).update(encodedPayload).digest("base64url");
}

export function makeAdminToken(payload: Omit<AdminTokenPayload, "exp">): string {
  if (!tokenSecret()) {
    throw new Error("ADMIN_TOKEN_SECRET or an equivalent server secret is required");
  }

  const encodedPayload = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL_MS }),
  ).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminToken(token: string | undefined | null): AdminTokenPayload | null {
  if (!token || !tokenSecret()) return null;

  const [encodedPayload, signature, ...extraParts] = token.split(".");
  if (!encodedPayload || !signature || extraParts.length > 0) return null;

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminTokenPayload>;
    if (
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now() ||
      typeof payload.role !== "string" ||
      typeof payload.username !== "string" ||
      !payload.permissions ||
      typeof payload.permissions !== "object"
    ) {
      return null;
    }

    return {
      id: typeof payload.id === "string" ? payload.id : undefined,
      role: payload.role,
      username: payload.username,
      permissions: payload.permissions as Record<string, boolean>,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(headers: Record<string, unknown> | undefined): string {
  const value = headers?.authorization;
  return typeof value === "string" ? value.replace(/^Bearer\s+/i, "").trim() : "";
}

export function verifyAdminRequest(headers: Record<string, unknown> | undefined): AdminTokenPayload | null {
  return verifyAdminToken(getBearerToken(headers));
}
