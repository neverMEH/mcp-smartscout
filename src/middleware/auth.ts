import { Request, Response, NextFunction } from 'express';
import { apiKeyManager } from '../auth/api-keys.js';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    key: string;
    name: string;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Missing authorization header',
      message: 'Please provide an API key in the Authorization header as "Bearer YOUR_API_KEY"'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Invalid authorization format',
      message: 'Authorization header must be in format: Bearer YOUR_API_KEY'
    });
  }

  const apiKey = parts[1];
  const validatedKey = apiKeyManager.validateKey(apiKey);

  if (!validatedKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Attach API key info to request for use in rate limiting and logging
  req.apiKey = {
    key: validatedKey.key,
    name: validatedKey.name,
    rateLimit: validatedKey.rateLimit
  };

  next();
}

// Optional middleware for public endpoints that tracks usage without requiring auth
export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const apiKey = parts[1];
      const validatedKey = apiKeyManager.validateKey(apiKey);
      
      if (validatedKey) {
        req.apiKey = {
          key: validatedKey.key,
          name: validatedKey.name,
          rateLimit: validatedKey.rateLimit
        };
      }
    }
  }

  next();
}