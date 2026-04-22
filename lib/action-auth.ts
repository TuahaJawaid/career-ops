import { headers } from "next/headers";

export async function assertMutationRequestAllowed() {
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const requestHeaders = await headers();
  const authHeader = requestHeaders.get("authorization");
  const internalApiKey = process.env.INTERNAL_API_KEY;
  const cronSecret = process.env.CRON_SECRET;

  if (
    (internalApiKey && authHeader === `Bearer ${internalApiKey}`) ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`)
  ) {
    return;
  }

  const host = requestHeaders.get("host");
  const origin = requestHeaders.get("origin");
  const referer = requestHeaders.get("referer");

  const allowedHosts = new Set<string>();
  if (host) {
    allowedHosts.add(host);
  }
  if (process.env.VERCEL_URL) {
    allowedHosts.add(process.env.VERCEL_URL);
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    allowedHosts.add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      allowedHosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
    } catch {
      // Ignore malformed app URL.
    }
  }

  let trusted = false;
  if (origin) {
    try {
      trusted = allowedHosts.has(new URL(origin).host);
    } catch {
      trusted = false;
    }
  }
  if (!trusted && referer) {
    try {
      trusted = allowedHosts.has(new URL(referer).host);
    } catch {
      trusted = false;
    }
  }

  if (!trusted) {
    throw new Error("Unauthorized mutation request");
  }
}
