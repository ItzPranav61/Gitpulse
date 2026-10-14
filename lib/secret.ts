import crypto from "node:crypto";

/** Server-only. Never import this from a client component. */
const WEAK = new Set(["change-me-to-a-long-random-string", "dev-secret-change-me"]);

/**
 * The app secret signs domain-verification tokens, hashes visitors and guards internal routes.
 * In production it must be a real random value; there is no guessable fallback.
 * It is read lazily so `next build` works without the production secret present.
 */
export function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 32 || WEAK.has(s)) {
      throw new Error("APP_SECRET must be set to a random string of at least 32 characters in production.");
    }
    return s;
  }
  return s || "dev-secret-change-me";
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
