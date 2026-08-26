import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const APPROVED_SUFFIXES = [
  ".fandom.com",
  ".z8games.com",
  ".crossfirestars.com",
  ".vnggames.com",
  ".qq.com",
  ".playcfl.com",
];

function isPrivateOrReservedIp(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized.includes("%")) return true;
  const version = isIP(normalized);
  if (version === 4) {
    const parts = normalized.split(".").map(Number);
    const [a, b, c] = parts;
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224;
  }
  if (version === 6) {
    const compact = normalized.replace(/^0+:0+:0+:0+:0+:ffff:/, "");
    if (isIP(compact) === 4) return isPrivateOrReservedIp(compact);
    return normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
      normalized.startsWith("fea") || normalized.startsWith("feb") ||
      normalized.startsWith("2001:db8") || normalized.startsWith("ff");
  }
  return true;
}

export async function assertApprovedSourceUrl(value: unknown): Promise<string> {
  if (typeof value !== "string" || !value.trim()) throw new Error("Valid source URL required");
  const parsed = new URL(value.trim());
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error("Only approved public HTTPS source URLs are allowed");
  }
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const isApproved = hostname === "playcfl.com" || APPROVED_SUFFIXES.some(suffix => hostname.endsWith(suffix));
  if (!isApproved) throw new Error("Source domain is not on the approved public allowlist");

  const addresses = isIP(hostname)
    ? [hostname]
    : (await lookup(hostname, { all: true, verbatim: true })).map(entry => entry.address);
  if (!addresses.length || addresses.some(isPrivateOrReservedIp)) {
    throw new Error("Source host must resolve only to public network addresses");
  }
  return parsed.toString();
}
