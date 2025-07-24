/**
 * SSE (Server-Sent Events) handler for MCP protocol
 * Enables streaming responses for Claude Desktop compatibility
 */

import { Env } from './index';
import { handleMCPRequest } from './mcp-handler';

export interface SSEMessage {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

/**
 * Creates an SSE-formatted message
 */
export function formatSSEMessage(message: SSEMessage): string {
  let output = '';
  
  if (message.id) {
    output += `id: ${message.id}\n`;
  }
  
  if (message.event) {
    output += `event: ${message.event}\n`;
  }
  
  // Split data by newlines and prefix each line with "data: "
  const lines = message.data.split('\n');
  for (const line of lines) {
    output += `data: ${line}\n`;
  }
  
  if (message.retry) {
    output += `retry: ${message.retry}\n`;
  }
  
  // Double newline to end the message
  output += '\n';
  
  return output;
}

/**
 * Creates a TransformStream for SSE responses
 */
export function createSSEStream(): TransformStream<any, string> {
  const encoder = new TextEncoder();
  let messageId = 0;
  
  return new TransformStream({
    start(controller) {
      // Send initial SSE comment to establish connection
      controller.enqueue(': SSE stream established\n\n');
    },
    
    transform(chunk, controller) {
      messageId++;
      
      // Convert chunk to SSE format
      const message: SSEMessage = {
        id: messageId.toString(),
        event: chunk.type || 'message',
        data: JSON.stringify(chunk)
      };
      
      controller.enqueue(formatSSEMessage(message));
    },
    
    flush(controller) {
      // Send final message
      const endMessage: SSEMessage = {
        event: 'end',
        data: JSON.stringify({ status: 'complete' })
      };
      controller.enqueue(formatSSEMessage(endMessage));
    }
  });
}

/**
 * Handles MCP requests with SSE streaming
 */
export async function handleSSERequest(request: Request, env: Env): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  
  // Start processing in the background
  (async () => {
    try {
      // Send initial SSE connection established message
      await writer.write(encoder.encode(': SSE stream established\n\n'));
      
      // Parse the request body
      const requestBody = await request.json() as any;
      
      // Use the existing MCP handler to process the request
      const result = await handleMCPRequest(requestBody, env);
      
      // Send the result as an SSE message
      const sseMessage = formatSSEMessage({
        id: '1',
        event: 'message',
        data: JSON.stringify(result)
      });
      
      await writer.write(encoder.encode(sseMessage));
      
      // Send end event
      const endMessage = formatSSEMessage({
        event: 'end',
        data: JSON.stringify({ status: 'complete' })
      });
      await writer.write(encoder.encode(endMessage));
      
    } catch (error: any) {
      // Send error as SSE
      const errorMessage = formatSSEMessage({
        event: 'error',
        data: JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          },
          id: null
        })
      });
      await writer.write(encoder.encode(errorMessage));
    } finally {
      await writer.close();
    }
  })();
  
  // Return the readable stream as response
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}