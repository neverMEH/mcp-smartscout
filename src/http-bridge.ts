#!/usr/bin/env node
/**
 * MCP HTTP Bridge - Allows Claude Desktop to connect to remote MCP HTTP server
 * This creates a local stdio server that forwards requests to the HTTP API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const HTTP_SERVER_URL = process.env.MCP_HTTP_SERVER_URL || 'https://mcp-smartscout-production.up.railway.app';
const API_KEY = process.env.MCP_API_KEY;

if (!API_KEY) {
  console.error('ERROR: MCP_API_KEY environment variable is required');
  console.error('Please set MCP_API_KEY to your API key for the remote server');
  process.exit(1);
}

console.error('MCP HTTP Bridge starting...');
console.error(`Remote server: ${HTTP_SERVER_URL}`);
console.error(`API key configured: ${API_KEY.substring(0, 8)}...`);

// Create a pass-through MCP server
const server = new Server(
  {
    name: 'SmartScout Domo (Remote)',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Forward all requests to HTTP server
async function forwardRequest(method: string, params: any) {
  try {
    const response = await axios.post(
      `${HTTP_SERVER_URL}/mcp`,
      {
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Bridge error:', error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your MCP_API_KEY environment variable.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to remote server. Please check the server URL.');
    } else {
      throw new Error(`Bridge error: ${error.message}`);
    }
  }
}

// Set up request handlers that forward to HTTP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return await forwardRequest('tools/list', {});
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await forwardRequest('tools/call', request.params);
});

// Start the stdio server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Bridge ready - Claude Desktop can now connect to remote server');
  console.error('All requests will be forwarded to:', HTTP_SERVER_URL);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the bridge
main().catch((error) => {
  console.error('Failed to start bridge:', error);
  process.exit(1);
});