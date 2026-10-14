import { LIMITS } from "@/lib/config";
import { GitHubError, USERNAME_RE, getActivity } from "@/lib/github";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** Public JSON API: the same normalized data the widget renders. */
export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!USERNAME_RE.test(username)) {
    return Response.json({ error: "Invalid GitHub username" }, { status: 400, headers: CORS });
  }
  if (!rateLimit(`gh:${clientIp(req)}`, LIMITS.rateGithub)) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { ...CORS, "Retry-After": "60" } });
  }
  try {
    const data = await getActivity(username);
    return Response.json(data, {
      headers: { ...CORS, "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (err) {
    const status = err instanceof GitHubError ? err.status : 500;
    const message = err instanceof GitHubError ? err.message : "Unexpected error";
    return Response.json({ error: message }, { status, headers: CORS });
  }
}
