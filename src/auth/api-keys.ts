import crypto from 'crypto';

export interface ApiKey {
  key: string;
  name: string;
  created: Date;
  lastUsed: Date | null;
  requestCount: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export class ApiKeyManager {
  private apiKeys: Map<string, ApiKey> = new Map();
  private defaultRateLimit = {
    windowMs: 60000, // 1 minute
    maxRequests: 100
  };

  constructor() {
    // Initialize with API keys from environment
    this.loadKeysFromEnvironment();
  }

  private loadKeysFromEnvironment() {
    const keysString = process.env.API_KEYS || '';
    const keys = keysString.split(',').filter(k => k.trim());
    
    keys.forEach((key, index) => {
      this.apiKeys.set(key.trim(), {
        key: key.trim(),
        name: `API Key ${index + 1}`,
        created: new Date(),
        lastUsed: null,
        requestCount: 0,
        rateLimit: this.defaultRateLimit
      });
    });

    // Add a default development key if no keys are configured
    if (this.apiKeys.size === 0 && process.env.NODE_ENV !== 'production') {
      const devKey = 'dev-key-' + crypto.randomBytes(16).toString('hex');
      this.apiKeys.set(devKey, {
        key: devKey,
        name: 'Development Key',
        created: new Date(),
        lastUsed: null,
        requestCount: 0,
        rateLimit: this.defaultRateLimit
      });
      console.log(`Development API key generated: ${devKey}`);
    }
  }

  validateKey(key: string): ApiKey | null {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey.lastUsed = new Date();
      apiKey.requestCount++;
      return apiKey;
    }
    return null;
  }

  getAllKeys(): ApiKey[] {
    return Array.from(this.apiKeys.values());
  }

  generateKey(name: string): ApiKey {
    const key = 'sk-' + crypto.randomBytes(32).toString('hex');
    const apiKey: ApiKey = {
      key,
      name,
      created: new Date(),
      lastUsed: null,
      requestCount: 0,
      rateLimit: this.defaultRateLimit
    };
    this.apiKeys.set(key, apiKey);
    return apiKey;
  }

  revokeKey(key: string): boolean {
    return this.apiKeys.delete(key);
  }

  updateRateLimit(key: string, windowMs: number, maxRequests: number): boolean {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      apiKey.rateLimit = { windowMs, maxRequests };
      return true;
    }
    return false;
  }

  getUsageStats(key: string): { requestCount: number; lastUsed: Date | null } | null {
    const apiKey = this.apiKeys.get(key);
    if (apiKey) {
      return {
        requestCount: apiKey.requestCount,
        lastUsed: apiKey.lastUsed
      };
    }
    return null;
  }
}

// Singleton instance
export const apiKeyManager = new ApiKeyManager();