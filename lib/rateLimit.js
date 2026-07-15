// lib/rateLimit.js
//
// A minimal in-memory sliding-window rate limiter. Good enough for a single
// server instance or low/moderate traffic. IMPORTANT: on serverless
// platforms with multiple instances (e.g. Vercel with concurrent lambdas),
// this map is NOT shared across instances, so the effective limit is
// "N requests per instance" rather than truly global. For production at
// scale, swap this for a shared store like Upstash Redis
// (@upstash/ratelimit) — the checkRateLimit() call site below is the only
// place you'd need to change.

const buckets = new Map();

/**
 * @param {string} key - usually the client IP (or IP + route name)
 * @param {number} limit - max requests allowed in the window
 * @param {number} windowMs - window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function checkRateLimit(key, limit = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true, remaining: limit - 1, resetMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: windowMs - (now - entry.windowStart) };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetMs: windowMs - (now - entry.windowStart) };
}

// Periodically clear stale buckets so this Map doesn't grow forever on a
// long-lived server process.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (now - entry.windowStart > 60 * 60 * 1000) buckets.delete(key);
    }
  }, 30 * 60 * 1000).unref?.();
}

export function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
