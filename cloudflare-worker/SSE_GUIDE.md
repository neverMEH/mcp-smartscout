# SSE (Server-Sent Events) Implementation Guide

## Overview

The SmartScout MCP Server now supports Server-Sent Events (SSE) for streaming responses, making it fully compatible with Claude Desktop and other MCP clients that expect streaming capabilities.

## How It Works

### 1. Automatic SSE Detection

The server automatically detects when a client wants SSE responses by checking the `Accept` header:

```bash
# Request with SSE support
curl -X POST https://smartscout.nevermeh.workers.dev/mcp \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

### 2. Dedicated SSE Endpoint

Alternatively, use the dedicated SSE endpoint:

```bash
curl -X POST https://smartscout.nevermeh.workers.dev/mcp/sse \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## SSE Response Format

The server sends events in the following format:

```
: SSE stream established

id: 1
event: message
data: {"jsonrpc":"2.0","result":{"tools":[...]},"id":1}

event: end
data: {"status":"complete"}
```

### Event Types

- **message**: Contains the MCP response data
- **error**: Contains error information if something goes wrong
- **end**: Signals the end of the stream

## Testing SSE

### Using curl

```bash
# Test SSE endpoint
curl -N -X POST https://smartscout.nevermeh.workers.dev/mcp/sse \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

The `-N` flag disables buffering to see SSE events in real-time.

### Using JavaScript

```javascript
const response = await fetch('https://smartscout.nevermeh.workers.dev/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR-API-KEY',
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 1
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log('SSE chunk:', chunk);
}
```

## Claude Desktop Configuration

To use with Claude Desktop, update your configuration:

```json
{
  "mcpServers": {
    "smartscout": {
      "url": "https://smartscout.nevermeh.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR-API-KEY"
      }
    }
  }
}
```

Claude Desktop will automatically use SSE when available.

## Benefits of SSE

1. **Streaming Responses**: Large results can be sent in chunks
2. **Progress Updates**: Future implementations can send progress events
3. **Better Error Handling**: Errors can be sent as events without breaking the stream
4. **Lower Latency**: Results start arriving before the full response is ready

## Technical Details

### Implementation

The SSE handler:
1. Creates a `TransformStream` for streaming responses
2. Sends an initial connection message
3. Processes the MCP request using the existing handler
4. Formats the response as SSE events
5. Sends an end event to signal completion

### Headers

SSE responses include:
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`
- CORS headers for browser compatibility

### Error Handling

Errors are sent as SSE events with the `error` event type:

```
event: error
data: {"jsonrpc":"2.0","error":{"code":-32603,"message":"Internal error"},"id":null}
```

## Future Enhancements

The SSE implementation can be extended to support:
- Progress events during long-running queries
- Partial results streaming for large datasets
- Real-time data updates
- Query cancellation

## Troubleshooting

### No SSE Events Received

1. Ensure you're using the correct endpoint (`/mcp` with Accept header or `/mcp/sse`)
2. Check that your API key is valid
3. Verify CORS settings if calling from a browser

### Connection Drops

Cloudflare Workers have a maximum execution time. For very long queries, consider:
- Adding pagination to your queries
- Using smaller result limits
- Implementing query timeouts

### Testing Tips

- Use `curl -N` to disable buffering
- Check browser developer tools for SSE events
- Monitor Cloudflare Worker logs for errors