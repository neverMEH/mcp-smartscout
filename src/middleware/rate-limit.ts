import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './auth.js';

// Store for tracking requests per API key
const keyRequestCounts = new Map<string, { count: number; resetTime: number }>();

// Custom key generator that uses API key if available
function keyGenerator(req: AuthenticatedRequest): string {
  if (req.apiKey) {
    return req.apiKey.key;
  }
  // Fallback to IP for unauthenticated requests
  return req.ip || 'unknown';
}

// Custom handler for when rate limit is exceeded
function rateLimitHandler(req: Request, res: Response) {
  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
}

// Create rate limiter with dynamic limits based on API key
export function createRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute default
    max: (req: AuthenticatedRequest) => {
      // Use API key specific limits if available
      if (req.apiKey && req.apiKey.rateLimit) {
        return req.apiKey.rateLimit.maxRequests;
      }
      // Default limit for unauthenticated requests
      return 10;
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit headers
    keyGenerator,
    handler: rateLimitHandler,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
}

// Middleware to apply custom rate limits per API key
export function customRateLimiter(req: AuthenticatedRequest, res: Response, next: Function) {
  const key = keyGenerator(req);
  const now = Date.now();
  
  // Get or create request count for this key
  let requestData = keyRequestCounts.get(key);
  
  if (!requestData || now > requestData.resetTime) {
    // Reset counter
    const windowMs = req.apiKey?.rateLimit.windowMs || 60000;
    requestData = {
      count: 0,
      resetTime: now + windowMs
    };
    keyRequestCounts.set(key, requestData);
  }
  
  requestData.count++;
  
  // Check if limit exceeded
  const limit = req.apiKey?.rateLimit.maxRequests || 10;
  if (requestData.count > limit) {
    const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
    
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    });
  }
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', (limit - requestData.count).toString());
  res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
  
  next();
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of keyRequestCounts.entries()) {
    if (now > data.resetTime) {
      keyRequestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute