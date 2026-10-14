import { NextResponse, type NextRequest } from "next/server";

/**
 * Custom domains (Pro). Any request whose Host is not one of APP_HOSTS is looked up
 * against the customers' domain mappings and rewritten to /w/<username>.
 * Disabled unless APP_HOSTS is set, so local development is unaffected.
 */
const cache = new Map<string, { at: number; value: { username: string; query: string } | null }>();
const CACHE_MAX = 1000; // random Host headers must not be able to grow memory without bound
const CACHE_TTL_MS = 60_000;
const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function remember(host: string, value: { username: string; query: string } | null) {
  cache.delete(host); // re-insert so the Map's insertion order stays oldest-first
  cache.set(host, { at: Date.now(), value });
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function middleware(req: NextRequest) {
  const raw = process.env.APP_HOSTS;
  if (!raw) return NextResponse.next();

  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const own = raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (!host || own.includes(host)) return NextResponse.next();

  // Reject malformed hosts before they touch the cache or the lookup API.
  if (!HOST_RE.test(host)) return new NextResponse("Unknown host.", { status: 404 });

  // Never fall back to a guessable secret in production.
  const secret = process.env.APP_SECRET;
  const secretIsWeak = !secret || secret === "change-me-to-a-long-random-string" || secret.length < 32;
  if (process.env.NODE_ENV === "production" && secretIsWeak) {
    console.error("APP_SECRET is missing or too weak; custom domain routing is disabled.");
    return new NextResponse("Service misconfigured.", { status: 503 });
  }

  let hit = cache.get(host);
  if (!hit || Date.now() - hit.at > CACHE_TTL_MS) {
    let value: { username: string; query: string } | null = null;
    try {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const res = await fetch(`${base}/api/domains?host=${encodeURIComponent(host)}`, {
        headers: { "x-internal-token": secret ?? "dev-secret-change-me" },
        cache: "no-store",
      });
      if (res.ok) value = await res.json();
    } catch {
      /* treat lookup failures as unknown host */
    }
    remember(host, value);
    hit = cache.get(host)!;
  }

  if (!hit.value) return new NextResponse("This domain is not connected to a GitPulse widget.", { status: 404 });

  const url = req.nextUrl.clone();
  url.pathname = `/w/${hit.value.username}`;
  url.search = hit.value.query;
  return NextResponse.rewrite(url);
}

export const config = {
  // Static assets and API calls are served as-is on every host.
  matcher: ["/((?!_next/|api/|favicon.svg|embed.js).*)"],
};
