import crypto from "node:crypto";
import dns from "node:dns/promises";
import { appSecret } from "./secret";

export const HOST_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** TXT record the customer must create to prove they control the domain. */
export const verifyRecordName = (host: string) => `_gitpulse.${host}`;

/** Bound to both the license and the host, so a token cannot be reused for another domain or account. */
export function verifyRecordValue(licenseKey: string, host: string): string {
  const h = crypto.createHmac("sha256", appSecret()).update(`${licenseKey}|${host}`).digest("hex").slice(0, 32);
  return `gitpulse-verify=${h}`;
}

export async function hasVerifyRecord(licenseKey: string, host: string): Promise<boolean> {
  const expected = verifyRecordValue(licenseKey, host);
  try {
    const records = await dns.resolveTxt(verifyRecordName(host));
    return records.some((parts) => parts.join("").trim() === expected);
  } catch {
    return false;
  }
}
