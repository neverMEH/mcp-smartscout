/**
 * Authentication utilities for Cloudflare Workers
 */

import { Env } from './index';

export async function validateApiKey(apiKey: string, env: Env): Promise<boolean> {
  // Option 1: Simple environment variable check
  const validKeys = env.API_KEYS?.split(',').map(k => k.trim()) || [];
  if (validKeys.includes(apiKey)) {
    return true;
  }

  // Option 2: D1 database check (if configured)
  if (env.DB) {
    try {
      const result = await env.DB.prepare(
        'SELECT id FROM api_keys WHERE key = ? AND active = 1'
      ).bind(apiKey).first();
      
      return result !== null;
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  return false;
}

// For D1 database setup (run once)
export const API_KEYS_SCHEMA = `
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,
  active INTEGER DEFAULT 1,
  rate_limit_per_minute INTEGER DEFAULT 100
);

-- Example insert
-- INSERT INTO api_keys (key, name) VALUES ('sk-test-123', 'Test Key');
`;