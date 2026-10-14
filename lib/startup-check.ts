/**
 * Node-only startup validation, called from instrumentation.ts when `next start` boots.
 * Exits the process when the configuration would be unsafe for real customers.
 */
export function runStartupChecks() {
  const errors: string[] = [];
  const warnings: string[] = [];

  const secret = process.env.APP_SECRET ?? "";
  if (secret.length < 32 || secret === "change-me-to-a-long-random-string") {
    errors.push("APP_SECRET must be a random string of at least 32 characters.");
  }
  if (process.env.ALLOW_DEMO_CHECKOUT === "1") {
    errors.push("ALLOW_DEMO_CHECKOUT must not be set in production (it hands out free licenses).");
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!appUrl || appUrl.includes("localhost")) {
    errors.push("NEXT_PUBLIC_APP_URL must be your public https URL.");
  }

  if (!process.env.GITHUB_TOKEN) {
    warnings.push("GITHUB_TOKEN is not set: the app will show demo data instead of real GitHub data.");
  }
  const stripeVars = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_LIFETIME"];
  const missingStripe = stripeVars.filter((k) => !process.env[k]);
  if (missingStripe.length && missingStripe.length < stripeVars.length) {
    errors.push(`Stripe is partly configured. Missing: ${missingStripe.join(", ")}.`);
  } else if (missingStripe.length === stripeVars.length) {
    warnings.push("Stripe is not configured: Pro purchases will not work.");
  }
  if (!process.env.NEXT_PUBLIC_SUPPORT_EMAIL || !process.env.NEXT_PUBLIC_COMPANY_NAME) {
    warnings.push("NEXT_PUBLIC_SUPPORT_EMAIL / NEXT_PUBLIC_COMPANY_NAME are not set: the legal pages show placeholder contact details.");
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    warnings.push("RESEND_API_KEY / EMAIL_FROM are not set: customers cannot recover a lost license key by email.");
  }
  if (!process.env.DATA_DIR) {
    warnings.push("DATA_DIR is not set: make sure the JSON store lives on a persistent disk.");
  }

  for (const w of warnings) console.warn(`[startup] warning: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`[startup] error: ${e}`);
    console.error("[startup] Refusing to start with an unsafe configuration.");
    process.exit(1);
  }
}
