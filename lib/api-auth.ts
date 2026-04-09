import { headers } from "next/headers";

/**
 * Validates that API requests come from our own app (same origin).
 * Checks the Origin/Referer header matches our deployment URL.
 * This prevents external actors from calling our AI endpoints directly.
 */
export async function validateInternalRequest(): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Vercel deployments: check origin matches our app
  const vercelUrl = process.env.VERCEL_URL;
  const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  const allowedOrigins = new Set<string>();
  if (vercelUrl) allowedOrigins.add(`https://${vercelUrl}`);
  if (vercelProjectUrl) allowedOrigins.add(`https://${vercelProjectUrl}`);
  // Also allow the .vercel.app alias
  allowedOrigins.add("https://career-ops-blush.vercel.app");

  if (origin && allowedOrigins.has(origin)) {
    return true;
  }

  // Check referer as fallback
  if (referer) {
    for (const allowed of allowedOrigins) {
      if (referer.startsWith(allowed)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates the cron secret for scheduled endpoints.
 */
export function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}
