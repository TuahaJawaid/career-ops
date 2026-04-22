type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

type RateLimitOptions = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

export function checkRateLimit(options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(options.key, { count: 1, resetAt });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt };
  }

  if (existing.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(options.maxRequests - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function getClientIdentifier(request: Request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp || "unknown";
}
