# SmartScout Domo MCP Server

An MCP (Model Context Protocol) server that provides Claude Desktop access to SmartScout's Amazon marketplace intelligence data stored in Domo.

## Overview

This MCP server enables Claude to query SmartScout's comprehensive Amazon marketplace database, including:
- 16M+ products with pricing, sales, and ranking data
- 350K+ brands with performance metrics
- 374K+ sellers with revenue and feedback data  
- 10M+ search terms with volume and CPC estimates
- Historical data for trend analysis
- Organic and paid search rankings

## Installation

1. Clone this repository:
```bash
git clone https://github.com/smartscout/mcp-smartscout-domo.git
cd mcp-smartscout-domo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
DOMO_INSTANCE=your-instance
DOMO_ACCESS_TOKEN=your-access-token
```

5. Build the project:
```bash
npm run build
```

## Configuration for Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smartscout-domo": {
      "command": "node",
      "args": ["C:/Users/Aeciu/OneDrive/Desktop/Smartscout/mcp-smartscout-domo/dist/server.js"],
      "env": {
        "DOMO_INSTANCE": "recommercebrands",
        "DOMO_ACCESS_TOKEN": "DDCIa8d82cba537ecf54032551681695985167811ebb95a8ea02"
      }
    }
  }
}
```

## Deployment to Railway (Public HTTP API)

This server can now be deployed to Railway as a public HTTP API:

### 1. Push to GitHub
```bash
git add .
git commit -m "Add HTTP wrapper for Railway deployment"
git push origin main
```

### 2. Deploy to Railway
1. Create account at [railway.app](https://railway.app)
2. Create new project → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables in Railway dashboard:
   - `DOMO_INSTANCE` - Your Domo instance
   - `DOMO_ACCESS_TOKEN` - Your Domo access token
   - `API_KEYS` - Comma-separated API keys (e.g., `key1,key2,key3`)
   - `CORS_ORIGINS` - Allowed origins (e.g., `https://yourdomain.com`)

### 3. Access Your API
Once deployed, Railway will provide a URL like `https://your-app.railway.app`

Test the deployment:
```bash
# Health check
curl https://your-app.railway.app/health

# List tools (requires API key)
curl -X POST https://your-app.railway.app/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

See [API.md](API.md) for full API documentation.

## Available Tools

### Product Tools

#### `smartscout_product_search`
Search for products by various criteria.
```
Example: Find products with "coffee maker" in title, priced $50-200, with 100+ reviews
```

#### `smartscout_product_details`
Get detailed information about a specific product including sellers.
```
Example: Get full details for ASIN B08N5WLMXB
```

#### `smartscout_product_history`
Get historical price and sales rank data for a product.
```
Example: Show 30-day history for ASIN B08N5WLMXB
```

#### `smartscout_top_products`
Find top-selling products in categories.
```
Example: Top 20 products in "Home & Kitchen" category
```

### Brand Tools

#### `smartscout_brand_search`
Search brands by name or performance metrics.
```
Example: Brands with >$100K monthly revenue and 30%+ growth
```

#### `smartscout_brand_details`
Get comprehensive brand information including top products and sellers.
```
Example: Full analysis of brand "Anker"
```

#### `smartscout_brand_coverage`
Analyze seller coverage for brands.
```
Example: Which sellers carry Nike products
```

#### `smartscout_brand_growth`
Find fastest-growing brands.
```
Example: Top 20 fastest growing brands with >$50K revenue
```

### Seller Tools

#### `smartscout_seller_search`
Search sellers by name, ID, or metrics.
```
Example: Sellers with >$500K monthly revenue and 95%+ positive feedback
```

#### `smartscout_seller_details`
Get detailed seller profile with products and brands.
```
Example: Full profile for seller ID A2VJCB1F3Q7JZX
```

#### `smartscout_seller_products`
List all products sold by a specific seller.
```
Example: Products from seller A2VJCB1F3Q7JZX with >50% buy box
```

#### `smartscout_top_sellers`
Find top sellers by various metrics.
```
Example: Top 20 sellers by 30-day revenue growth
```

### Search/Keyword Tools

#### `smartscout_keyword_search`
Find keywords with search volume and CPC data.
```
Example: Keywords containing "wireless" with >10K monthly searches
```

#### `smartscout_keyword_products`
Get products ranking for a specific keyword.
```
Example: Top organic and paid results for "bluetooth speaker"
```

#### `smartscout_product_keywords`
Find keywords that a product ranks for.
```
Example: All keywords where ASIN B08N5WLMXB ranks in top 50
```

#### `smartscout_keyword_brands`
Analyze brand presence for keywords.
```
Example: Which brands dominate "coffee maker" searches
```

### Analytics Tools

#### `smartscout_market_analysis`
Comprehensive market analysis for categories.
```
Example: Full market analysis for "Pet Supplies" category
```

#### `smartscout_competitor_analysis`
Find and analyze competitors.
```
Example: Find competitors for ASIN B08N5WLMXB
```

#### `smartscout_opportunity_finder`
Discover market opportunities.
```
Example: Find low-competition subcategories with >$50K revenue
```

#### `smartscout_custom_query`
Execute custom SQL queries (SELECT only).
```
Example: SELECT * FROM PRODUCTS WHERE BRAND = 'Apple' LIMIT 10
```

#### `smartscout_system_info`
Get information about available databases and schemas.
```
Example: Show schema for products database
```

## Example Queries in Claude

Here are some example prompts you can use with Claude:

1. **Product Research**:
   - "Find the top 10 best-selling yoga mats under $50"
   - "Show me the price history for ASIN B08N5WLMXB over the last 30 days"
   - "What products are competing with [ASIN]?"

2. **Brand Analysis**:
   - "Which brands are growing fastest in the Home & Kitchen category?"
   - "Give me a full analysis of the Anker brand"
   - "Which sellers have the most revenue from Nike products?"

3. **Seller Intelligence**:
   - "Find the top sellers in Pet Supplies with over 95% positive feedback"
   - "What products does seller A2VJCB1F3Q7JZX sell?"
   - "Show me sellers with the highest 30-day revenue growth"

4. **Keyword Research**:
   - "What are the top keywords for wireless headphones?"
   - "Which products rank #1 organically for 'coffee maker'?"
   - "What keywords does ASIN B08N5WLMXB rank for?"

5. **Market Opportunities**:
   - "Find low-competition subcategories in Sports & Outdoors"
   - "Show me high-revenue products with ratings under 3.5 stars"
   - "What subcategories have the largest price gaps?"

## Token Management

The server automatically limits results to prevent token overflow:
- Default limit: 100 results per query
- Maximum limit: 1000 results
- Results include a count and truncation notice when applicable
- Complex queries return summarized data

## Database Schema

The server provides access to these SmartScout databases:

- **PRODUCTS**: Product catalog (16.1M rows)
- **BRANDS**: Brand performance (350K rows)
- **SELLERS**: Seller profiles (374K rows)
- **SEARCHTERMS**: Keyword data (10.5M rows)
- **SELLERPRODUCTS**: Seller-product relationships (17.7M rows)
- **BRANDCOVERAGES**: Brand-seller relationships (997K rows)
- **PRODUCTHISTORIES**: Historical product data (1.2B rows)
- And more...

Use `smartscout_system_info` to explore available databases and their schemas.

## Query Approach

This MCP server uses Domo's SQL query API. Key points about how queries work:

1. **Dataset Selection**: Each tool targets a specific dataset ID, and queries use `FROM dataset` syntax
2. **Single Dataset Queries**: Due to Domo API design, each query operates on one dataset at a time
3. **Column Names**: All queries use the actual column names from the SmartScout schema (e.g., ASIN, MONTHLYSALES)

## Troubleshooting

### Common Issues

1. **Rate Limiting**: The server handles Domo API rate limits automatically. If you encounter rate limit errors, wait a moment before retrying.

2. **Large Result Sets**: If queries return too much data, try:
   - Adding more specific filters
   - Reducing the limit parameter
   - Using aggregation queries instead of raw data

3. **Connection Errors**: Ensure your Domo credentials are correct and the instance URL is properly formatted.

## Development

To run in development mode:
```bash
npm run dev
```

To run tests:
```bash
npm test
```

## Security

- API credentials are stored in environment variables
- Only SELECT queries are allowed in custom SQL
- All user inputs are sanitized to prevent SQL injection
- Token limits prevent data exfiltration

## Support

For issues or questions:
- Check the [SmartScout documentation](https://smartscout.com/docs)
- Contact SmartScout support
- Open an issue on GitHub

## License

Copyright (c) 2024 SmartScout. All rights reserved.