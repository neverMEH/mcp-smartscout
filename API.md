# SmartScout MCP Server API Documentation

## Overview

The SmartScout MCP Server provides HTTP API access to SmartScout's Amazon marketplace intelligence data via the Model Context Protocol (MCP). This API enables querying of products, brands, sellers, search terms, and historical data.

## Base URL

```
https://your-app.railway.app
```

## Authentication

All API requests (except health check) require authentication via API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Getting an API Key

API keys are configured via environment variables. Contact your administrator to obtain an API key.

## Rate Limiting

- Default: 100 requests per minute per API key
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (ISO 8601)
  - `Retry-After`: Seconds to wait before retrying (only on 429 responses)

## Endpoints

### Health Check

Check if the server is running and healthy.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "SmartScout MCP Server",
  "version": "2.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### List Available Tools

Get a list of all available MCP tools.

```http
POST /mcp
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "smartscout_product_search",
        "description": "Search for products by keyword, brand, seller, category, or other criteria",
        "inputSchema": {
          "type": "object",
          "properties": {
            "keyword": {
              "type": "string",
              "description": "Search term for product title"
            },
            "brand": {
              "type": "string",
              "description": "Filter by brand name"
            },
            "limit": {
              "type": "number",
              "description": "Number of results to return",
              "default": 50
            }
          }
        }
      }
    ]
  },
  "id": 1
}
```

### Call a Tool

Execute a specific tool with parameters.

```http
POST /mcp
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "smartscout_product_search",
    "arguments": {
      "keyword": "coffee maker",
      "limit": 10
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"results\": [\n    {\n      \"asin\": \"B07GV2S1GS\",\n      \"title\": \"Keurig K-Elite Coffee Maker\",\n      \"brand\": \"Keurig\",\n      \"price\": 149.99,\n      \"monthlyUnitsSold\": 15234\n    }\n  ],\n  \"count\": 10,\n  \"query\": \"SELECT * FROM products WHERE title LIKE '%coffee maker%' LIMIT 10\"\n}"
      }
    ]
  },
  "id": 2
}
```

### Get API Key Stats

Get usage statistics for your API key.

```http
GET /api/keys
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "currentKey": {
    "name": "Production Key",
    "stats": {
      "requestCount": 1523,
      "lastUsed": "2024-01-01T12:30:00.000Z"
    }
  }
}
```

## Available Tools

### Product Tools

1. **smartscout_product_search** - Search products by various criteria
2. **smartscout_product_details** - Get detailed information about specific products
3. **smartscout_product_history** - Get historical data for products
4. **smartscout_product_trends** - Analyze product trends over time

### Brand Tools

1. **smartscout_brand_search** - Search for brands
2. **smartscout_brand_analytics** - Get brand performance metrics
3. **smartscout_brand_products** - List products for a brand

### Seller Tools

1. **smartscout_seller_search** - Search for sellers
2. **smartscout_seller_analytics** - Get seller performance metrics

### Search Term Tools

1. **smartscout_keyword_search** - Search for keywords with volume and CPC data

### Market Analysis Tools

1. **smartscout_market_analysis** - Analyze market segments
2. **smartscout_category_insights** - Get category-level insights

### Custom Query Tool

1. **smartscout_custom_query** - Execute custom SQL queries (advanced users)

## Error Responses

The API uses standard JSON-RPC 2.0 error format:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Missing required parameter: keyword"
  },
  "id": 1
}
```

### Common Error Codes

- `-32600`: Invalid Request - The JSON sent is not a valid Request object
- `-32601`: Method not found - The method does not exist
- `-32602`: Invalid params - Invalid method parameters
- `-32603`: Internal error - Internal JSON-RPC error
- `-32700`: Parse error - Invalid JSON was received

### HTTP Status Codes

- `200`: Success
- `400`: Bad Request (invalid JSON-RPC format)
- `401`: Unauthorized (missing or invalid API key)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Example Usage

### cURL

```bash
# List available tools
curl -X POST https://your-app.railway.app/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'

# Search for products
curl -X POST https://your-app.railway.app/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "smartscout_product_search",
      "arguments": {
        "keyword": "wireless headphones",
        "minPrice": 50,
        "maxPrice": 200,
        "limit": 20
      }
    },
    "id": 2
  }'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://your-app.railway.app/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'smartscout_brand_analytics',
      arguments: {
        brand: 'Apple',
        metrics: ['revenue', 'products', 'growth']
      }
    },
    id: 1
  })
});

const data = await response.json();
```

### Python

```python
import requests

url = 'https://your-app.railway.app/mcp'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

payload = {
    'jsonrpc': '2.0',
    'method': 'tools/call',
    'params': {
        'name': 'smartscout_seller_search',
        'arguments': {
            'minRevenue': 1000000,
            'limit': 10
        }
    },
    'id': 1
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
```

## Best Practices

1. **Cache responses** when appropriate to reduce API calls
2. **Use specific filters** to minimize data transfer
3. **Implement exponential backoff** for rate limit errors
4. **Store API keys securely** - never commit them to source control
5. **Monitor your usage** via the `/api/keys` endpoint
6. **Use appropriate limits** - don't request more data than needed

## Support

For issues or questions:
- Check the [README](README.md) for setup instructions
- Review error messages carefully - they often indicate the solution
- Contact your administrator for API key or access issues