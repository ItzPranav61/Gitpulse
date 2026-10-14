export const SITE = {
  name: "GitPulse",
  tagline: "Your GitHub activity, live on your portfolio.",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  cnameTarget: process.env.NEXT_PUBLIC_CNAME_TARGET ?? "cname.gitpulse.app",
};

export type PlanId = "monthly" | "lifetime";

/** Change the numbers here and in Stripe to re-price the product. */
export const PLANS: Record<
  PlanId,
  { id: PlanId; label: string; price: number; cadence: string; priceEnv: string; mode: "subscription" | "payment" }
> = {
  monthly: {
    id: "monthly",
    label: "Pro monthly",
    price: 3,
    cadence: "per month",
    priceEnv: "STRIPE_PRICE_MONTHLY",
    mode: "subscription",
  },
  lifetime: {
    id: "lifetime",
    label: "Pro lifetime",
    price: 29,
    cadence: "one time",
    priceEnv: "STRIPE_PRICE_LIFETIME",
    mode: "payment",
  },
};

export const LIMITS = {
  /** How long GitHub data is cached in memory before refetching. */
  cacheTtlMs: 15 * 60 * 1000,
  cacheMaxEntries: 500,
  /** A license can power this many GitHub usernames. */
  maxUsernamesPerLicense: 3,
  maxDomainsPerLicense: 3,
  /** Per-IP request budgets (per minute). */
  rateGithub: 60,
  rateTrack: 120,
  rateCheckout: 10,
};
