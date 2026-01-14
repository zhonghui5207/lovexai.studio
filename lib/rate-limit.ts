/**
 * Simple in-memory rate limiter for API routes
 * For production at scale, consider using @upstash/ratelimit with Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const entry = rateLimitStore.get(identifier);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  // Check if limit exceeded
  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and other proxies
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  /** OTP sending: 3 requests per 10 minutes per email */
  OTP: { limit: 3, windowSeconds: 600 },
  /** Checkout: 10 requests per minute per user */
  CHECKOUT: { limit: 10, windowSeconds: 60 },
  /** Upload: 20 requests per minute per user */
  UPLOAD: { limit: 20, windowSeconds: 60 },
  /** General API: 100 requests per minute per IP */
  GENERAL: { limit: 100, windowSeconds: 60 },
  /** Webhook: 1000 requests per minute (high limit for payment providers) */
  WEBHOOK: { limit: 1000, windowSeconds: 60 },
} as const;
