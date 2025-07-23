# SmartScout Domo MCP Setup Instructions

## Configuration Status ✅
Your Claude Desktop configuration has been updated to use the v2 server.

## To Start Using SmartScout Tools in Claude:

### Step 1: Close Claude Desktop Completely
- Right-click the Claude icon in your system tray
- Select "Quit Claude" or "Exit"
- Make sure Claude is completely closed

### Step 2: Restart Claude Desktop
- Open Claude Desktop normally
- The MCP server will start automatically in the background

### Step 3: Verify Connection
Once Claude Desktop is running, you can test the connection by asking Claude:
- "Check SmartScout system info"
- "Search for wireless headphones on SmartScout"
- "Show me top brands by revenue"

## Available Commands in Claude

### Product Searches
- "Find products with 'wireless' in the title"
- "Show me products by Apple under $100"
- "Get details for ASIN B08N5WRWNW"
- "Show price history for [ASIN]"
- "Find top selling products in electronics"

### Brand Analysis
- "Search for Nike brand on SmartScout"
- "Show me fastest growing brands"
- "Get brand details for [brand name]"
- "Find brands with over $1M monthly revenue"

### Seller Intelligence
- "Find top sellers with over 1000 products"
- "Search for sellers with high revenue"
- "Get seller details for [seller ID]"

### Keyword Research
- "Search for wireless headphone keywords"
- "Find keywords with high search volume"
- "Show keywords with CPC under $2"

### Custom Queries
- "Use custom query to find products with highest review to sales ratio"
- "Run SQL query to analyze price distribution by brand"
- "Show schema for products dataset"

## Troubleshooting

### If Tools Don't Work:
1. Make sure Claude Desktop is completely restarted
2. Check if you see "SmartScout Domo" in Claude's available tools
3. Try asking "What MCP servers are available?"

### Manual Server Start (Optional):
If automatic start doesn't work, you can manually start the server:
1. Open Command Prompt or PowerShell
2. Navigate to: `C:\Users\Aeciu\OneDrive\Desktop\Smartscout\mcp-smartscout-domo`
3. Run: `start-server.bat`
4. Keep the window open while using Claude

### Check Logs:
If issues persist, check:
- Claude Desktop logs in `%APPDATA%\Claude\logs`
- Server output in the command window (if manually started)

## Current Limitations
- Only 5 datasets are accessible (products, brands, sellers, productHistories, searchTerms)
- Some advanced features requiring other datasets won't work
- Use custom queries for complex analysis

## Support
For dataset indexing or access issues, contact your Domo administrator.