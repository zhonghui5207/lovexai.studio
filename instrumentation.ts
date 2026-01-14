/**
 * Next.js Instrumentation
 * This file runs when the server starts (both dev and production)
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvVarsOnStartup } = await import("@/lib/env-check");
    checkEnvVarsOnStartup();
  }
}
