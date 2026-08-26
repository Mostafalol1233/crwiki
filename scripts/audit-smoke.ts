import assert from "node:assert/strict";
import { calculateProgressPercent, resolveProfileRank } from "../client/src/components/RankCalculator.tsx";
import { makeAdminToken, verifyAdminToken } from "../server/adminAuth.ts";
import { assertApprovedSourceUrl } from "../server/urlSafety.ts";

const ranks = [
  { id: "r10", name: "Staff Sergeant 1", tier: 10, expRequired: 17_785 },
  { id: "r11", name: "Staff Sergeant 2", tier: 11, expRequired: 23_941 },
  { id: "r12", name: "Staff Sergeant 3", tier: 12, expRequired: 33_061 },
];

const resolvedByVisibleName = resolveProfileRank(
  { nickname: "audit", exp: 23_940, rank: "Staff Sergeant 1", rankTier: 11 },
  ranks,
);
assert.equal(resolvedByVisibleName?.name, "Staff Sergeant 1");
assert.equal(resolvedByVisibleName?.tier, 10);
assert.equal(calculateProgressPercent(23_940, 17_785, 23_941), 99.9);
assert.equal(calculateProgressPercent(23_941, 23_941, 33_061), 0);
assert.equal(calculateProgressPercent(null, 17_785, 23_941), 0);

const previousSecret = process.env.ADMIN_TOKEN_SECRET;
process.env.ADMIN_TOKEN_SECRET = "audit-only-secret-with-at-least-32-characters";
const token = makeAdminToken({ role: "super_admin", username: "audit", permissions: {} });
assert.equal(verifyAdminToken(token)?.username, "audit");
assert.equal(verifyAdminToken(`${token}extra`), null);
process.env.ADMIN_TOKEN_SECRET = "too-short";
assert.equal(verifyAdminToken(token), null);
if (previousSecret === undefined) delete process.env.ADMIN_TOKEN_SECRET;
else process.env.ADMIN_TOKEN_SECRET = previousSecret;

await assert.rejects(() => assertApprovedSourceUrl("http://forum.z8games.com/thread"));
await assert.rejects(() => assertApprovedSourceUrl("https://example.com/thread"));
await assert.rejects(() => assertApprovedSourceUrl("https://localhost/thread"));

console.log("audit-smoke: passed");
