/**
 * Cloudflare Pages Function for MCP Server
 * This allows deployment via Cloudflare Pages instead of Workers
 */

import { handleMCPRequest } from '../../cloudflare-worker/src/mcp-handler';
import { validateApiKey } from '../../cloudflare-worker/src/auth';
import { checkRateLimit } from '../../cloudflare-worker/src/rate-limit';
import { corsHeaders } from '../../cloudflare-worker/src/cors';

export interface Env {
  DOMO_INSTANCE: string;
  DOMO_ACCESS_TOKEN: string;
  API_KEYS: string;
  RATE_LIMIT: KVNamespace;
  DB?: D1Database;
}

export async function onRequest(context: any): Promise<Response> {
  const { request, env, params } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only handle POST requests to /mcp
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Validate API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid authorization header'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const apiKey = authHeader.substring(7);
    const isValid = await validateApiKey(apiKey, env);
    
    if (!isValid) {
      return new Response(JSON.stringify({
        error: 'Invalid API key'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(apiKey, env.RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter.toString(),
          ...corsHeaders
        }
      });
    }

    // Handle MCP request
    const requestBody = await request.json();
    const result = await handleMCPRequest(requestBody, env);
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('MCP request error:', error);
    
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      },
      id: null
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}