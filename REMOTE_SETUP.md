# Remote MCP Server Setup Guide

This guide explains how to allow other users to access your MCP server through their Claude Desktop.

## Overview

Claude Desktop uses stdio (standard input/output) for communication with MCP servers, which means it expects a local process. To allow remote users to access your Railway-deployed MCP server, they need to run a local "bridge" that forwards requests to your HTTP API.

## For the Server Owner (You)

1. **Deploy to Railway** (already done)
   - Your server is at: `https://mcp-smartscout-production.up.railway.app/`
   
2. **Create API Keys for Users**
   - Add API keys to your Railway environment variable `API_KEYS`
   - Example: `API_KEYS=user1-key-abc123,user2-key-def456,user3-key-ghi789`
   
3. **Share with Users:**
   - The server URL
   - Their unique API key
   - This setup guide

## For Remote Users

### Step 1: Clone the Repository
```bash
git clone https://github.com/neverMEH/mcp-smartscout.git
cd mcp-smartscout
```

### Step 2: Install Dependencies
```bash
npm install
npm run build
```

### Step 3: Create Bridge Configuration
Create a `.env` file in the project directory:
```env
# Remote server configuration
MCP_HTTP_SERVER_URL=https://mcp-smartscout-production.up.railway.app
MCP_API_KEY=your-api-key-here
```

### Step 4: Configure Claude Desktop
Add to your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smartscout-remote": {
      "command": "node",
      "args": ["/path/to/mcp-smartscout/dist/http-bridge.js"],
      "env": {
        "MCP_HTTP_SERVER_URL": "https://mcp-smartscout-production.up.railway.app",
        "MCP_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace:
- `/path/to/mcp-smartscout/` with the actual path where you cloned the repository
- `your-api-key-here` with the API key provided by the server owner

### Step 5: Restart Claude Desktop
After saving the configuration, restart Claude Desktop. You should now see "SmartScout Domo (Remote)" in your MCP servers.

## Alternative: Simplified Setup (No Git Required)

For users who don't want to clone the entire repository:

1. **Download just the bridge files:**
   - `http-bridge.js` (after it's built)
   - `package.json` (minimal version)

2. **Create a minimal package.json:**
```json
{
  "name": "mcp-smartscout-bridge",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.16.0",
    "axios": "^1.6.5",
    "dotenv": "^16.3.1"
  }
}
```

3. **Install and run:**
```bash
npm install
node http-bridge.js
```

## Security Considerations

1. **API Keys**: Each user should have their own API key
2. **Rate Limiting**: The server implements rate limiting per API key
3. **HTTPS**: All communication is encrypted
4. **Environment Variables**: Never share API keys in config files; use environment variables

## Troubleshooting

### "Cannot connect to remote server"
- Check if the server URL is correct
- Verify the server is running on Railway
- Check your internet connection

### "Invalid API key"
- Verify the API key is correct
- Ensure the key is added to Railway's `API_KEYS` environment variable
- Check for extra spaces or quotes

### "Rate limit exceeded"
- You've made too many requests
- Wait a minute and try again
- Contact the server owner to increase your rate limit

## Testing the Connection

Once configured, test in Claude Desktop by asking:
```
Can you list the available SmartScout tools?
```

Claude should respond with a list of available tools like:
- smartscout_product_search
- smartscout_brand_analytics
- smartscout_seller_search
- etc.