import { headers } from "next/headers";

/**
 * Validates that API requests come from our own app (same origin).
 * Checks the Origin/Referer header matches our deployment URL.
 * This prevents external actors from calling our AI endpoints directly.
 */
export async function validateInternalRequest(request: Request): Promise<boolean> {
  const headersList = await headers();
  const authHeader = request.headers.get("authorization");
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const fetchSite = headersList.get("sec-fetch-site");

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Optional service token for non-browser calls (cron/workers).
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (internalApiKey && authHeader === `Bearer ${internalApiKey}`) {
    return true;
  }

  // Vercel deployments: check origin/referer host matches our app.
  const vercelUrl = process.env.VERCEL_URL;
  const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  const allowedHosts = new Set<string>();
  if (vercelUrl) allowedHosts.add(vercelUrl);
  if (vercelProjectUrl) allowedHosts.add(vercelProjectUrl);
  // Also allow custom domain if configured
  const customDomain = process.env.NEXT_PUBLIC_APP_URL;
  if (customDomain) {
    try {
      allowedHosts.add(new URL(customDomain).host);
    } catch {
      // Ignore malformed custom URL in env.
    }
  }
  const host = headersList.get("host");
  if (host) allowedHosts.add(host);
  if (allowedHosts.size === 0) {
    return false;
  }

  const isSameSiteRequest =
    !fetchSite || fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";

  if (origin) {
    try {
      if (allowedHosts.has(new URL(origin).host) && isSameSiteRequest) {
        return true;
      }
    } catch {
      // Ignore malformed origin header.
    }
  }

  // Check referer as fallback.
  if (referer && isSameSiteRequest) {
    try {
      if (allowedHosts.has(new URL(referer).host)) {
        return true;
      }
    } catch {
      // Ignore malformed referer header.
    }
  }

  return false;
}

/**
 * Validates the cron secret for scheduled endpoints.
 */
export function validateCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  // Vercel cron jobs may send CRON_SECRET in a dedicated header.
  const cronHeader = request.headers.get("x-cron-secret");
  return cronHeader === cronSecret;
}
