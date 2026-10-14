import { fulfillCheckout } from "@/lib/license";
import { sessionIsPaid, stripe } from "@/lib/stripe";
import { findLicenseBySession } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import type { Plan } from "@/lib/types";

/**
 * The success page polls this with the Checkout session id to reveal the license key.
 * If the webhook has not arrived yet we confirm the payment with Stripe directly,
 * so customers never wait on webhook timing.
 */
export async function GET(req: Request) {
  if (!rateLimit(`session:${clientIp(req)}`, 40)) return Response.json({ error: "Too many requests" }, { status: 429 });
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^[A-Za-z0-9_]{8,200}$/.test(sessionId)) return Response.json({ error: "Invalid session" }, { status: 400 });

  const existing = findLicenseBySession(sessionId);
  if (existing) return Response.json({ key: existing.key, plan: existing.plan, email: existing.email });

  const s = stripe();
  if (s && sessionId.startsWith("cs_")) {
    try {
      const session = await s.checkout.sessions.retrieve(sessionId);
      if (sessionIsPaid(session)) {
        const license = fulfillCheckout({
          sessionId,
          email: session.customer_details?.email ?? session.customer_email ?? "unknown",
          plan: (session.metadata?.plan as Plan) ?? "monthly",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
        });
        return Response.json({ key: license.key, plan: license.plan, email: license.email });
      }
    } catch {
      /* fall through to pending */
    }
  }
  return Response.json({ pending: true }, { status: 404 });
}
