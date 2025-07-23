# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartScout MCP Server - A Model Context Protocol server that provides access to Amazon marketplace intelligence data stored in Domo. The server supports both local Claude Desktop integration via stdio and public HTTP API deployment.

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Run development servers
npm run dev         # V1 server (all datasets, many inaccessible)
npm run dev:v2      # V2 server (5 accessible datasets - RECOMMENDED)
npm run dev:http    # HTTP server for public API

# Build TypeScript
npm run build       # Build all servers
npm run build:v2    # Build with V2 message
npm run build:http  # Same as build

# Start production servers
npm start           # V1 stdio server
npm start:v2        # V2 stdio server
npm start:http      # HTTP server

# Watch mode
npm run watch       # TypeScript watch compilation
```

### Testing
```bash
# Test database connection
node test-connection.js

# Test specific functionality
node test-all-tools.js
node test-columns.js
node test-query.js

# Test specific tools
node test-product-history-direct.js
node test-brand-columns.js
node test-sellers-columns-v2.js
```

## Architecture Overview

### Server Implementations
1. **V1 Server** (`src/server.ts`) - Original implementation with 17 datasets, many inaccessible due to permissions
2. **V2 Server** (`src/server-v2.ts`) - Streamlined version with only 5 accessible datasets (RECOMMENDED)
3. **HTTP Server** (`src/http-server.ts`) - Express-based server for public API deployment

### Core Components
- **`src/server-core.ts`** - Shared logic for creating MCP servers
- **`src/utils/domo-client.ts`** - Domo API client with OAuth2 authentication
- **`src/utils/query-builder.ts`** - SQL query construction with proper escaping
- **`src/utils/column-mappings.ts`** - Maps friendly names to database columns
- **`src/utils/format.ts`** - Result formatting for Claude consumption

### Tool System
Each tool in `src/tools/` represents a specific query capability:
- **product-tools.ts** - Product search, details, history, trends
- **brand-tools.ts** - Brand search, analytics, coverage
- **seller-tools.ts** - Seller search, details, products
- **search-tools.ts** - Keyword search and analysis
- **analytics-tools.ts** - Market analysis, opportunities
- **diagnostic-tools.ts** - System info and debugging
- **custom-query-tool.ts** - Direct SQL queries

### HTTP API Components
- **`src/auth/api-keys.ts`** - API key management
- **`src/middleware/auth.ts`** - Authentication middleware
- **`src/middleware/rate-limit.ts`** - Rate limiting per API key

## Critical Implementation Details

### Dataset Access
The V2 server focuses on 5 accessible datasets:
- Products: `60d384f1-b3cf-4d41-99ee-2fabfe861b12` (16.9M records)
- Brands: `c11f0182-b5db-42f2-b838-be3b3ade707e` (350K records)
- Sellers: `06b5bef5-e639-442c-b632-3a1c02996f26` (374K records)
- Search Terms: `c697bdd5-760e-4102-98c1-3f9da094f6d6` (10.5M records)
- Product Histories: `48cb5956-1e16-4882-9e44-7f9d62cec04c` (1.2B records)

### Column Name Mappings
Database columns use uppercase names without underscores:
- `ASIN` not `asin` or `product_id`
- `BUYBOXPRICE` not `buy_box_price`
- `MONTHLYUNITSSOLD` not `monthly_units_sold`
- `ESTIMATESEARCHES` not `estimate_searches`

See `src/utils/column-mappings.ts` for complete mappings.

### Query Limitations
- Domo API only supports single-dataset queries (no JOINs across datasets)
- All queries use `FROM dataset` syntax
- Results are limited to prevent token overflow (default: 100, max: 1000)
- Large datasets require appropriate filters and limits

### Environment Configuration
Required environment variables:
```
DOMO_INSTANCE=your-instance       # Domo instance name
DOMO_ACCESS_TOKEN=your-token      # Domo access token

# For HTTP server:
API_KEYS=key1,key2,key3          # Comma-separated API keys
CORS_ORIGINS=https://domain.com   # Allowed CORS origins
PORT=3000                        # Server port (Railway provides this)
```

## Common Development Tasks

### Adding a New Tool
1. Create tool definition in appropriate file in `src/tools/`
2. Define input schema with proper types
3. Implement handler with SQL query generation
4. Add to tool exports array
5. Test with specific test file

### Debugging Query Issues
1. Enable SQL logging in the tool handler
2. Check column names against schema files (`*.txt` in root)
3. Verify dataset access permissions
4. Test query directly in Domo workbench
5. Use `test-debug-query.js` for isolated testing

### Deployment to Railway
1. Ensure `package-lock.json` is committed (required for `npm ci`)
2. Set all required environment variables in Railway
3. Use `node dist/http-server.js` as start command
4. Monitor logs for missing environment variables

## Important Patterns

### Tool Handler Structure
```typescript
{
  name: 'tool_name',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      // Define parameters
    }
  },
  handler: async (args, context) => {
    const { domoClient, databases, QueryBuilder, formatResults } = context;
    // Build and execute query
  }
}
```

### Query Building Pattern
```typescript
const query = QueryBuilder.buildSelectQuery(
  databases.products,
  ['ASIN', 'TITLE', 'BUYBOXPRICE'],
  {
    filters: { BRAND: 'Apple' },
    limit: 50,
    orderBy: 'MONTHLYUNITSSOLD',
    orderDirection: 'DESC'
  }
);
```

### Error Handling
- Authentication errors (401) indicate dataset access issues
- Use try-catch in handlers to provide user-friendly errors
- Log SQL queries when debugging
- Return structured error responses

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check dataset permissions or use V2 server
2. **Column not found**: Verify column names in schema files
3. **Timeout errors**: Reduce result limit or add filters
4. **No results**: Check filter values and data existence
5. **Railway deployment fails**: Ensure environment variables are set

### Testing Approach
1. Start with `test-connection.js` to verify Domo access
2. Use specific test files for individual features
3. Test with small limits first
4. Check column mappings with verification scripts