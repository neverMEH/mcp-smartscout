/**
 * MCP request handler for Cloudflare Workers
 */

import { Env } from './index';
import { DomoClient } from './domo-client';
import { tools } from './tools';

export async function handleMCPRequest(request: any, env: Env): Promise<any> {
  const { jsonrpc, method, params, id } = request;
  
  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: 'Missing or invalid jsonrpc version'
      },
      id: id || null
    };
  }

  try {
    switch (method) {
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: {
            tools: tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }))
          },
          id
        };
        
      case 'tools/call':
        if (!params || !params.name) {
          return {
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message: 'Invalid params',
              data: 'Missing tool name'
            },
            id
          };
        }
        
        const tool = tools.find(t => t.name === params.name);
        if (!tool) {
          return {
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: 'Method not found',
              data: `Unknown tool: ${params.name}`
            },
            id
          };
        }
        
        // Execute tool
        const domoClient = new DomoClient(env.DOMO_INSTANCE, env.DOMO_ACCESS_TOKEN);
        const result = await tool.handler(params.arguments || {}, { domoClient, env });
        
        return {
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          },
          id
        };
        
      default:
        return {
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
            data: `Unknown method: ${method}`
          },
          id
        };
    }
  } catch (error: any) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      },
      id
    };
  }
}