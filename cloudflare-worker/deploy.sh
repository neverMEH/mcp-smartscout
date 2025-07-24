#!/bin/bash

# SmartScout MCP Cloudflare Workers Deployment Script

echo "🚀 SmartScout MCP - Cloudflare Workers Deployment"
echo "================================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Login to Cloudflare (if needed)
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami &> /dev/null || wrangler login

# Create KV namespace if it doesn't exist
echo "🗄️  Setting up KV namespace for rate limiting..."
KV_OUTPUT=$(wrangler kv:namespace create "RATE_LIMIT" 2>&1)
if [[ $KV_OUTPUT == *"already exists"* ]]; then
    echo "✅ KV namespace already exists"
else
    KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+')
    echo "✅ Created KV namespace with ID: $KV_ID"
    echo "📝 Please update wrangler.toml with this ID"
fi

# Set secrets
echo "🔑 Setting up environment secrets..."
echo "Enter your Domo instance name:"
read -r DOMO_INSTANCE
wrangler secret put DOMO_INSTANCE <<< "$DOMO_INSTANCE"

echo "Enter your Domo access token:"
read -rs DOMO_ACCESS_TOKEN
wrangler secret put DOMO_ACCESS_TOKEN <<< "$DOMO_ACCESS_TOKEN"

echo "Enter API keys (comma-separated):"
read -r API_KEYS
wrangler secret put API_KEYS <<< "$API_KEYS"

# Deploy
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Deployment complete!"
echo ""
echo "Your MCP server is now available at:"
echo "https://mcp-smartscout.<your-subdomain>.workers.dev"
echo ""
echo "Test with:"
echo "curl https://mcp-smartscout.<your-subdomain>.workers.dev/health"