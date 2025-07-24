# Quick Deploy to Cloudflare

## Deployment Steps

### 1. In Cloudflare Dashboard

After connecting your GitHub repository:

1. **Go to Settings → Environment variables** and add:
   - `DOMO_INSTANCE` = your-domo-instance
   - `DOMO_ACCESS_TOKEN` = your-domo-token
   - `API_KEYS` = key1,key2,key3 (comma-separated list)

2. **Go to Settings → Builds & deployments**:
   - Root directory: `cloudflare-worker`
   - Build command: `npm install`
   - Build output directory: `/` (or leave empty)

3. **Retry deployment**

### 2. Testing Your Deployment

Once deployed, test at your worker URL:

```bash
# Health check (no auth required)
curl https://smartscout.YOUR-SUBDOMAIN.workers.dev/health

# List tools (requires API key)
curl -X POST https://smartscout.YOUR-SUBDOMAIN.workers.dev/mcp \
  -H "Authorization: Bearer YOUR-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

### 3. Optional: Enable Rate Limiting

To add rate limiting:

1. **Create KV namespace** in Cloudflare dashboard:
   - Go to Workers & Pages → KV
   - Create namespace: "smartscout-rate-limit"
   - Copy the namespace ID

2. **Add KV binding** in your Worker settings:
   - Go to your Worker → Settings → Variables
   - Add KV namespace binding:
     - Variable name: `RATE_LIMIT`
     - KV namespace: Select "smartscout-rate-limit"

3. **Redeploy** - Rate limiting will automatically activate

## Troubleshooting

**"KV namespace is not valid"**
- The KV namespace is optional. The deployment works without it.
- To enable rate limiting, create the KV namespace first (see above)

**"Failed to match Worker name"**
- This warning is normal - Cloudflare automatically uses your project name
- The worker name "smartscout" is set based on your Cloudflare project

**Environment variables not working**
- Make sure to add them in Cloudflare dashboard, not in code
- Check Settings → Environment variables
- Variables are case-sensitive

## What's Deployed

Your MCP server is now running globally on Cloudflare's edge network with:
- ✅ API key authentication
- ✅ CORS support for browser access  
- ✅ All SmartScout query tools
- ✅ Optional rate limiting (when KV is configured)
- ✅ Automatic scaling and DDoS protection