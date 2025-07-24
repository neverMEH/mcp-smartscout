/**
 * Rate limiting using Cloudflare KV
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  apiKey: string,
  kvNamespace: KVNamespace,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): Promise<RateLimitResult> {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const key = `rate:${apiKey}:${window}`;
  
  // Get current count
  const currentCount = parseInt(await kvNamespace.get(key) || '0');
  
  if (currentCount >= limit) {
    const resetAt = (window + 1) * windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter
    };
  }
  
  // Increment count
  const newCount = currentCount + 1;
  await kvNamespace.put(key, newCount.toString(), {
    expirationTtl: Math.ceil(windowMs / 1000) + 60 // Expire after window + buffer
  });
  
  return {
    allowed: true,
    remaining: limit - newCount,
    resetAt: (window + 1) * windowMs
  };
}