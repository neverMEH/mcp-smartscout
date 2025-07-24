# Cloudflare Deployment Instructions

## Important: Build Configuration

When deploying to Cloudflare Pages/Workers from the GitHub repository, you need to configure the build settings correctly since the Worker code is in a subdirectory.

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create new application → Pages → Connect to Git
3. Select your GitHub repository
4. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `cd cloudflare-worker && npm install`
   - **Build output directory**: `cloudflare-worker`
   - **Root directory**: `/`

5. Set environment variables:
   - `DOMO_INSTANCE`
   - `DOMO_ACCESS_TOKEN`
   - `API_KEYS`

6. Deploy!

## Option 2: Deploy Directly with Wrangler

Instead of using Cloudflare's GitHub integration, deploy directly:

```bash
# Clone the repository
git clone https://github.com/neverMEH/mcp-smartscout.git
cd mcp-smartscout/cloudflare-worker

# Install dependencies
npm install

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "RATE_LIMIT"
# Update wrangler.toml with the ID from output

# Set secrets
wrangler secret put DOMO_INSTANCE
wrangler secret put DOMO_ACCESS_TOKEN  
wrangler secret put API_KEYS

# Deploy
wrangler deploy
```

## Option 3: Use GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
    paths:
      - 'cloudflare-worker/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd cloudflare-worker
          npm install
          
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'cloudflare-worker'
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Fixing the Current Error

The error you're seeing is because Cloudflare is looking for `wrangler.toml` in the root directory. To fix:

1. **In Cloudflare Dashboard**, update your Pages project settings:
   - Go to Settings → Builds & deployments → Build configurations
   - Set **Root directory** to `cloudflare-worker`
   - Set **Build command** to `npm install`
   - Save and retry deployment

2. **Or**, keep the root directory as `/` and update:
   - **Build command**: `cd cloudflare-worker && npm install && npx wrangler deploy`

## Environment Variables

Don't forget to add these in Cloudflare Dashboard → Settings → Environment variables:
- `DOMO_INSTANCE`: Your Domo instance name
- `DOMO_ACCESS_TOKEN`: Your Domo access token
- `API_KEYS`: Comma-separated list of valid API keys

## Creating KV Namespace

Before deploying, create the KV namespace:

1. Go to Workers & Pages → KV
2. Create namespace named "mcp-smartscout-RATE_LIMIT"
3. Copy the namespace ID
4. Add it to your Worker bindings in the dashboard

## Testing After Deployment

Once deployed, test your Worker:

```bash
# Health check
curl https://your-worker.pages.dev/health

# Or if using custom domain
curl https://your-domain.com/health

# Test MCP endpoint
curl -X POST https://your-worker.pages.dev/mcp \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```