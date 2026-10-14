/**
 * Runs once when the production server starts (`next start`).
 * The checks live in a Node-only module so this file stays safe for the Edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  const { runStartupChecks } = await import("./lib/startup-check");
  runStartupChecks();
}
