# SmartScout MCP Server on Cloudflare Workers

Deploy your SmartScout MCP server globally using Cloudflare Workers for better performance, lower latency, and automatic scaling.

## Features

- ⚡ Global edge deployment (200+ locations)
- 🔒 Built-in API key authentication
- 🚦 KV-based rate limiting
- 💾 Optional D1 database for API key management
- 🌐 CORS support for browser access
- 📊 Automatic scaling (no server management)

## Prerequisites

1. Cloudflare account (free tier works)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Node.js 18+ installed

## Setup Instructions

### 1. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

### 2. Create KV Namespace

```bash
# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMIT"
```

Copy the output `id` and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id-here"
```

### 3. Configure Environment Variables

Set your secrets using Wrangler:
```bash
wrangler secret put DOMO_INSTANCE
# Enter: your-domo-instance

wrangler secret put DOMO_ACCESS_TOKEN
# Enter: your-domo-access-token

wrangler secret put API_KEYS
# Enter: key1,key2,key3 (comma-separated)
```

### 4. Deploy to Cloudflare

```bash
# Deploy to production
wrangler deploy

# Or deploy to a specific environment
wrangler deploy --env production
```

### 5. Test Your Deployment

Your MCP server will be available at:
```
https://mcp-smartscout.<your-subdomain>.workers.dev
```

Test the health endpoint:
```bash
curl https://mcp-smartscout.<your-subdomain>.workers.dev/health
```

Test the MCP endpoint:
```bash
curl -X POST https://mcp-smartscout.<your-subdomain>.workers.dev/mcp \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

## Using with Claude Desktop

### Option 1: Direct HTTP Connection (Requires Bridge)

Since Claude Desktop expects stdio communication, users need the HTTP bridge:

1. Users clone your repository
2. Configure the bridge with their API key:
   ```env
   MCP_HTTP_SERVER_URL=https://mcp-smartscout.<your-subdomain>.workers.dev
   MCP_API_KEY=their-api-key
   ```
3. Add to Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "smartscout-cloudflare": {
         "command": "node",
         "args": ["/path/to/dist/http-bridge.js"],
         "env": {
           "MCP_HTTP_SERVER_URL": "https://mcp-smartscout.<your-subdomain>.workers.dev",
           "MCP_API_KEY": "their-api-key"
         }
       }
     }
   }
   ```

### Option 2: Custom Claude Desktop Client

Build a thin client that communicates with your Cloudflare Worker:
```javascript
// Simple stdio-to-HTTP bridge for Claude Desktop
const bridge = new MCPBridge({
  serverUrl: 'https://mcp-smartscout.workers.dev',
  apiKey: process.env.API_KEY
});
bridge.start();
```

## Advanced Features

### Using D1 Database for API Keys

1. Create D1 database:
   ```bash
   wrangler d1 create mcp-smartscout
   ```

2. Update `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "mcp-smartscout"
   database_id = "your-database-id"
   ```

3. Initialize schema:
   ```bash
   wrangler d1 execute mcp-smartscout --file=./schema.sql
   ```

### Custom Domain

1. Add custom domain in Cloudflare dashboard
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "api.your-domain.com/*", custom_domain = true }
   ]
   ```

### Monitoring and Analytics

View real-time metrics:
```bash
# Tail logs
wrangler tail

# View analytics
wrangler analytics
```

## Cost Considerations

Cloudflare Workers pricing (as of 2024):
- **Free tier**: 100,000 requests/day
- **Paid tier**: $5/month for 10M requests
- **KV storage**: Free tier includes 100,000 reads/day
- **D1 database**: 5GB free storage

For SmartScout MCP usage, the free tier is likely sufficient for:
- ~10-20 active users
- ~1000 queries per day

## Performance Tips

1. **Cache Domo responses** in KV for frequently accessed data
2. **Use Durable Objects** for stateful connections (if needed)
3. **Optimize SQL queries** to reduce Domo API calls
4. **Enable Smart Placement** for optimal routing

## Troubleshooting

### "Script startup exceeded CPU time limit"
- Reduce initialization code
- Lazy-load heavy dependencies

### "KV namespace not found"
- Ensure KV namespace ID is correct in wrangler.toml
- Check binding name matches code

### "Authentication failed"
- Verify API_KEYS secret is set correctly
- Check Authorization header format

### Rate limiting issues
- Increase rate limits in code
- Use different KV namespaces for different tiers

## Development

Run locally:
```bash
wrangler dev
```

Run tests:
```bash
npm test
```

View types:
```bash
wrangler types
```

## Security Best Practices

1. **Rotate API keys regularly**
2. **Use environment-specific keys**
3. **Enable Cloudflare WAF** for additional protection
4. **Monitor usage patterns** for anomalies
5. **Implement request signing** for enhanced security

## Migration from Railway

Advantages of Cloudflare Workers over Railway:
- ✅ No cold starts (always warm)
- ✅ Global deployment by default
- ✅ Lower latency (edge computing)
- ✅ Automatic scaling
- ✅ Built-in DDoS protection
- ✅ More cost-effective at scale

To migrate:
1. Deploy to Cloudflare Workers
2. Update user documentation with new URL
3. Keep Railway running during transition
4. Monitor both deployments
5. Sunset Railway deployment

## Support

- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Wrangler CLI docs: https://developers.cloudflare.com/workers/wrangler/
- MCP documentation: https://modelcontextprotocol.io/