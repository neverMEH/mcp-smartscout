# SmartScout Domo MCP Server v2

A streamlined MCP (Model Context Protocol) server that provides AI-powered access to SmartScout's Amazon marketplace data through Domo, focusing only on accessible datasets.

## What's New in v2
- **Removed inaccessible dataset dependencies** - Only includes tools for the 5 working datasets
- **Enhanced custom query tool** - Full SQL flexibility with schema information and examples
- **Cleaner, more focused toolset** - 14 working tools instead of 20+ partially working ones

## Available Datasets

| Dataset | Description | Key Columns |
|---------|-------------|-------------|
| `products` | Product catalog with 16M+ ASINs | ASIN, TITLE, MANUFACTURER, BUYBOXPRICE, MONTHLYUNITSSOLD, RANK |
| `brands` | Brand analytics and metrics | NAME, MONTHLYREVENUE, TOTALPRODUCTS, MONTHGROWTH, REVIEWRATING |
| `sellers` | Seller profiles and performance | AMAZONSELLERID, NAME, ESTIMATESALES, NUMBERASINS, SUSPENDED |
| `productHistories` | Historical product data | PRODUCTID, DATE, BUYBOXPRICE, SALESRANK, ESTIMATEDUNITSALES |
| `searchTerms` | Keyword search analytics | SEARCHTERMVALUE, ESTIMATESEARCHES, ESTIMATEDCPC |

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-smartscout-domo

# Install dependencies
npm install

# Build the v2 server
npm run build:v2

# Configure environment
cp .env.example .env
# Edit .env with your Domo credentials
```

## Configuration

### Environment Variables (.env)
```env
DOMO_INSTANCE=recommercebrands
DOMO_ACCESS_TOKEN=your_access_token_here
```

### Claude Desktop Configuration
Update your Claude Desktop config file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "smartscout-domo": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-smartscout-domo\\dist\\server-v2.js"],
      "env": {
        "DOMO_INSTANCE": "recommercebrands",
        "DOMO_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Available Tools (14 total)

### Product Tools (4)
1. **smartscout_product_search** - Search products by ASIN, title, brand, price, sales
2. **smartscout_product_details** - Get detailed info for a specific ASIN
3. **smartscout_product_history** - Get historical price/rank data
4. **smartscout_top_products** - Find top products in categories

### Brand Tools (3)
1. **smartscout_brand_search** - Search brands by name, revenue, growth
2. **smartscout_brand_details** - Get detailed brand analytics
3. **smartscout_brand_growth** - Find fastest growing brands

### Seller Tools (3)
1. **smartscout_seller_search** - Search sellers by name, revenue, products
2. **smartscout_seller_details** - Get detailed seller information
3. **smartscout_top_sellers** - Find top sellers by various metrics

### Search Tools (1)
1. **smartscout_keyword_search** - Search keywords with volume and CPC data

### Utility Tools (3)
1. **smartscout_custom_query** - Execute custom SQL queries (enhanced)
2. **smartscout_check_datasets** - Check dataset status
3. **smartscout_system_info** - Get system information

## Enhanced Custom Query Tool

The custom query tool now provides full SQL flexibility with helpful features:

### Features
- Execute any SELECT query on accessible datasets
- Schema information with column names
- SQL examples for each dataset
- Support for custom dataset IDs
- Automatic LIMIT application
- Helpful error messages

### Examples

```sql
-- Top products by revenue
SELECT ASIN, TITLE, MANUFACTURER, 
       MONTHLYUNITSSOLD * BUYBOXPRICE AS REVENUE 
FROM dataset 
ORDER BY REVENUE DESC 
LIMIT 10

-- Search products
SELECT * FROM dataset 
WHERE TITLE LIKE '%wireless%' 
  AND BUYBOXPRICE BETWEEN 20 AND 100
LIMIT 20

-- Brand aggregation
SELECT MANUFACTURER, 
       COUNT(*) AS PRODUCT_COUNT,
       SUM(MONTHLYUNITSSOLD) AS TOTAL_SALES,
       AVG(BUYBOXPRICE) AS AVG_PRICE
FROM dataset
GROUP BY MANUFACTURER
HAVING PRODUCT_COUNT > 10
ORDER BY TOTAL_SALES DESC

-- Historical analysis
SELECT DATE, 
       AVG(BUYBOXPRICE) AS AVG_PRICE,
       AVG(SALESRANK) AS AVG_RANK
FROM dataset
WHERE PRODUCTID = 'B08N5WRWNW'
  AND DATE >= '2025-01-01'
GROUP BY DATE
ORDER BY DATE
```

### Using Custom Query in Claude

1. **Show schema**:
   ```
   Use the custom query tool to show me the schema for the products dataset
   ```

2. **Run queries**:
   ```
   Use custom query to find the top 10 highest revenue products
   ```

3. **Complex analysis**:
   ```
   Use custom query to analyze price distribution by manufacturer for products over $50
   ```

## Example Prompts for Claude

### Product Research
- "Find wireless headphones under $100 with good reviews"
- "Show me the price history for ASIN B08N5WRWNW"
- "What are the top selling products in electronics?"

### Brand Analysis
- "Which brands are growing fastest in the last 30 days?"
- "Show me brand details for Apple"
- "Find brands with over $1M monthly revenue"

### Seller Intelligence
- "Find top sellers with over 1000 products"
- "Show seller details for seller ID A123456"
- "Which sellers have the highest revenue?"

### Custom Analysis
- "Use custom query to find products with the highest review count to sales ratio"
- "Create a query to show average prices by category"
- "Write SQL to find products that increased in price over 20% this month"

## Limitations

### Inaccessible Datasets
The following datasets are not indexed in Domo and cannot be queried:
- sellerProducts (seller-product relationships)
- searchTermProductOrganics/Paids (keyword rankings)
- categories/subcategories (category hierarchies)
- brandCoverages (seller-brand relationships)

### Workarounds
Use the custom query tool to create joins or complex queries when needed:
```sql
-- Example: Find products from a specific seller (if you know their products)
SELECT * FROM dataset 
WHERE ASIN IN ('B001', 'B002', 'B003')
```

## Performance Tips

1. **Use filters** - Always filter data to reduce result size
2. **Limit results** - Default limits prevent overwhelming responses  
3. **Specific queries** - Be specific about what data you need
4. **Use indexes** - Filter by indexed columns (ASIN, MANUFACTURER, etc.)

## Troubleshooting

### "No indexed schema found"
This means the dataset is not accessible. Use only the 5 available datasets.

### "Invalid column(s) referenced"  
Check column names using `showSchema: true` in custom query.

### Timeout errors
Reduce query complexity or result size.

## Development

```bash
# Run in development mode
npm run dev:v2

# Build for production
npm run build:v2

# Run tests
node test-v2-server.js
```

## Support

For issues or questions:
1. Check dataset accessibility with `smartscout_check_datasets`
2. Use `smartscout_system_info` for configuration details
3. Refer to column schemas in custom query tool
4. Contact your Domo administrator for dataset indexing

## Version History

- **v2.0.0** - Streamlined to accessible datasets only, enhanced custom query
- **v1.0.0** - Initial release with all datasets (many inaccessible)