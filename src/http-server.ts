#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createMcpServer } from './server-core.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { createRateLimiter, customRateLimiter } from './middleware/rate-limit.js';
import { apiKeyManager } from './auth/api-keys.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Load environment variables
dotenv.config();

console.log('Starting SmartScout MCP HTTP Server...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Validate required environment variables
const requiredEnvVars = ['DOMO_INSTANCE', 'DOMO_ACCESS_TOKEN'];
const missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingVars.join(', '));
  console.error('Please set the following environment variables:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
}

console.log('Environment variables validated successfully');

// Create Express app
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SmartScout MCP Server',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API keys management endpoints (optional auth for viewing)
app.get('/api/keys', optionalAuthMiddleware, (req: any, res) => {
  if (!req.apiKey) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Only show current key's stats
  const stats = apiKeyManager.getUsageStats(req.apiKey.key);
  res.json({
    currentKey: {
      name: req.apiKey.name,
      stats
    }
  });
});

// Create MCP server
const { server: mcpServer, handlers } = createMcpServer({
  domoInstance: process.env.DOMO_INSTANCE!,
  domoAccessToken: process.env.DOMO_ACCESS_TOKEN!
});

// MCP endpoint with authentication and rate limiting
app.post('/mcp', authMiddleware, customRateLimiter, async (req, res) => {
  try {
    // Validate JSON-RPC 2.0 request
    const { jsonrpc, method, params, id } = req.body;
    
    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: 'Missing or invalid jsonrpc version'
        },
        id: id || null
      });
    }

    // Handle different MCP methods
    let result;
    
    switch (method) {
      case 'tools/list':
        result = await handlers.toolsList();
        break;
        
      case 'tools/call':
        if (!params || !params.name) {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Invalid params',
              data: 'Missing tool name'
            },
            id
          });
        }
        
        result = await handlers.toolCall(params.name, params.arguments);
        break;
        
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
            data: `Unknown method: ${method}`
          },
          id
        });
    }

    // Send successful response
    res.json({
      jsonrpc: '2.0',
      result,
      id
    });
    
  } catch (error: any) {
    console.error('MCP request error:', error);
    
    // Handle MCP errors
    if (error.code && error.message) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: error.code,
          message: error.message,
          data: error.data
        },
        id: req.body.id || null
      });
    }
    
    // Generic error
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      },
      id: req.body.id || null
    });
  }
});

// Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'SmartScout MCP Server',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      mcp: 'POST /mcp',
      keys: 'GET /api/keys'
    },
    documentation: 'See API.md for detailed documentation',
    authentication: 'Required via Bearer token in Authorization header'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`SmartScout MCP HTTP Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`API keys configured: ${apiKeyManager.getAllKeys().length}`);
  
  // Log all environment variables in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\nDevelopment endpoints:');
    console.log(`  Health: http://localhost:${port}/health`);
    console.log(`  MCP: http://localhost:${port}/mcp`);
    console.log(`  API Keys: http://localhost:${port}/api/keys`);
  }
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});