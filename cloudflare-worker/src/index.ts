/**
 * SmartScout MCP Server for Cloudflare Workers
 * Provides HTTP-based MCP API for SmartScout Domo data
 */

import { handleMCPRequest } from './mcp-handler';
import { validateApiKey } from './auth';
import { checkRateLimit } from './rate-limit';
import { corsHeaders } from './cors';
import { handleSSERequest } from './sse-handler';

export interface Env {
  // Environment variables
  DOMO_INSTANCE: string;
  DOMO_ACCESS_TOKEN: string;
  API_KEYS: string;
  
  // KV namespace for rate limiting (optional)
  RATE_LIMIT?: KVNamespace;
  
  // Optional D1 database for API keys
  DB?: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'SmartScout MCP Server (Cloudflare)',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // MCP endpoint
    if (url.pathname === '/mcp' && request.method === 'POST') {
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

        // Check rate limit (if KV namespace is available)
        let rateLimitResult = { allowed: true, remaining: 100, resetAt: Date.now() + 60000 };
        
        if (env.RATE_LIMIT) {
          rateLimitResult = await checkRateLimit(apiKey, env.RATE_LIMIT);
          if (!rateLimitResult.allowed) {
            return new Response(JSON.stringify({
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter
            }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': rateLimitResult.retryAfter!.toString(),
                ...corsHeaders
              }
            });
          }
        }

        // Check if client accepts SSE
        const acceptHeader = request.headers.get('Accept') || '';
        if (acceptHeader.includes('text/event-stream')) {
          // Handle as SSE request
          return await handleSSERequest(request, env);
        }

        // Handle as regular JSON request
        const requestBody = await request.json() as any;
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

    // SSE endpoint (alternative endpoint for explicit SSE)
    if (url.pathname === '/mcp/sse' && request.method === 'POST') {
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

        // Handle as SSE request
        return await handleSSERequest(request, env);

      } catch (error: any) {
        console.error('SSE request error:', error);
        
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

    // Root endpoint
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        service: 'SmartScout MCP Server',
        version: '1.0.0',
        runtime: 'Cloudflare Workers',
        endpoints: {
          health: 'GET /health',
          mcp: 'POST /mcp',
          mcp_sse: 'POST /mcp/sse'
        },
        documentation: 'See API.md for detailed documentation',
        authentication: 'Required via Bearer token in Authorization header',
        features: {
          sse: 'Server-Sent Events supported via Accept: text/event-stream header or /mcp/sse endpoint'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 404 for other routes
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  }
};