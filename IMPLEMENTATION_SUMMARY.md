# SmartScout Domo MCP Server - Implementation Summary

## Overview
This MCP (Model Context Protocol) server provides AI-powered access to SmartScout's Amazon marketplace intelligence data stored in Domo. The server has been built in two versions:

- **v1**: Full-featured version with all 17 datasets (many inaccessible)
- **v2**: Streamlined version focusing on 5 accessible datasets with enhanced custom query capabilities

## Final Implementation (v2)

### Accessible Datasets
1. **products** - 16M+ product catalog with ASINs, pricing, sales data
2. **brands** - Brand analytics with revenue and growth metrics  
3. **sellers** - Seller profiles with sales estimates and ratings
4. **productHistories** - Historical product performance data
5. **searchTerms** - Keyword search volume and CPC data

### Available Tools (14 total)

#### Product Tools (4)
- `smartscout_product_search` - Search products by various criteria
- `smartscout_product_details` - Get detailed product information
- `smartscout_product_history` - Retrieve historical price/rank data
- `smartscout_top_products` - Find top products in categories

#### Brand Tools (2)
- `smartscout_brand_search` - Search brands by revenue/growth
- `smartscout_brand_details` - Get detailed brand analytics
- `smartscout_brand_growth` - Find fastest growing brands

#### Seller Tools (3)
- `smartscout_seller_search` - Search sellers by various metrics
- `smartscout_seller_details` - Get detailed seller information
- `smartscout_top_sellers` - Find top sellers

#### Search Tools (1)
- `smartscout_keyword_search` - Search keywords with volume/CPC

#### Utility Tools (3)
- `smartscout_custom_query` - Execute flexible SQL queries with schema info
- `smartscout_check_datasets` - Check dataset status
- `smartscout_system_info` - Get system information

### Enhanced Custom Query Tool
The custom query tool in v2 includes:
- Schema information for all accessible datasets
- SQL query examples for each dataset
- Support for custom dataset IDs
- Automatic LIMIT application
- Helpful error messages with column suggestions

## Key Technical Decisions

### 1. Direct Dataset ID Usage
- Uses dataset IDs directly in queries (e.g., `60d384f1-b3cf-4d41-99ee-2fabfe861b12`)
- SQL syntax: `SELECT * FROM dataset` (Domo's required format)
- Endpoint: `/api/query/v1/execute/export/<DATASET_ID>?includeHeader=true`

### 2. Column Mapping Fixes
All column names have been corrected to match actual Domo columns:
- Products: `PRICE` → `BUYBOXPRICE`, `BRAND` → `MANUFACTURER`
- Sellers: `SELLERID` → `AMAZONSELLERID`, `MONTHLYSALES` → `ESTIMATESALES`
- Brands: `BRAND` → `NAME`, `REVENUE` → `MONTHLYREVENUE`

### 3. Response Format Handling
- Domo returns: `{ columns: [...], rows: [[...], [...]] }`
- FormatResults utility maps rows to objects using column names
- Token limit management through result limiting

### 4. Error Handling
- Comprehensive error messages with suggestions
- Schema validation before queries
- SQL injection prevention (SELECT-only queries)

## Installation & Usage

### Quick Start
```bash
# Install dependencies
npm install

# Build v2 server
npm run build:v2

# Configure Claude Desktop
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "smartscout-domo": {
      "command": "node",
      "args": ["path/to/dist/server-v2.js"],
      "env": {
        "DOMO_INSTANCE": "recommercebrands",
        "DOMO_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

### Example Claude Prompts
1. "Find wireless headphones under $100 with high sales"
2. "Show me the top growing brands this month"
3. "Use custom query to analyze price distribution by manufacturer"
4. "Get price history for ASIN B08N5WRWNW"

## Limitations & Workarounds

### Inaccessible Datasets
The following datasets are not indexed in Domo:
- sellerProducts, categories, subcategories
- searchTermProductOrganics/Paids
- Various history tables

**Workaround**: Use the enhanced custom query tool for complex queries

### Join Limitations
Domo's query API doesn't support traditional SQL joins

**Workaround**: Use custom queries with IN clauses or multiple queries

## Testing
All tools have been tested and verified working:
- ✅ Product search and analysis
- ✅ Brand analytics
- ✅ Seller intelligence
- ✅ Keyword research
- ✅ Custom SQL queries

## Future Enhancements
1. Add caching layer for frequently accessed data
2. Implement query optimization for large datasets
3. Add support for data export formats
4. Create specialized analysis tools for common use cases

## Support
For issues:
1. Check dataset status with `smartscout_check_datasets`
2. Use `smartscout_system_info` for configuration details
3. Refer to schema in custom query tool
4. Contact Domo admin for dataset indexing

---
*Built for SmartScout by Claude - January 2025*