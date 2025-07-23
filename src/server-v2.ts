#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { DomoClient } from './utils/domo-client.js';
import { QueryBuilder } from './utils/query-builder.js';
import { formatResults } from './utils/format.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DOMO_INSTANCE', 'DOMO_ACCESS_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Domo client
const domoClient = new DomoClient(
  process.env.DOMO_INSTANCE!,
  process.env.DOMO_ACCESS_TOKEN!
);

// Only include accessible datasets
const databases = {
  products: process.env.DB_PRODUCTS || '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: process.env.DB_BRANDS || 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: process.env.DB_SELLERS || '06b5bef5-e639-442c-b632-3a1c02996f26',
  productHistories: process.env.DB_PRODUCTHISTORIES || '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  searchTerms: process.env.DB_SEARCHTERMS || 'c697bdd5-760e-4102-98c1-3f9da094f6d6'
};

// Create MCP server
const server = new Server(
  {
    name: 'SmartScout Domo',
    version: '2.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Import only working tools
import { productTools } from './tools/product-tools.js';
import { brandTools } from './tools/brand-tools.js';
import { sellerTools } from './tools/seller-tools.js';
import { diagnosticTools } from './tools/diagnostic-tools.js';
import { enhancedCustomQueryTool } from './tools/custom-query-tool.js';

// Define working tools (exclude ones that need inaccessible datasets)
const workingProductTools = productTools;

const workingBrandTools = brandTools.filter(
  tool => tool.name !== 'smartscout_brand_coverage'
);

const workingSellerTools = sellerTools.filter(
  tool => !['smartscout_seller_products', 'smartscout_seller_brands'].includes(tool.name)
);

// Only include keyword search from search tools
const workingSearchTools = [
  {
    name: 'smartscout_keyword_search',
    description: 'Search for keywords and get search volume, CPC estimates',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to search for (partial match)'
        },
        minVolume: {
          type: 'number',
          description: 'Minimum search volume'
        },
        maxCPC: {
          type: 'number',
          description: 'Maximum suggested CPC'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.keyword) filters.SEARCHTERMVALUE = { like: `%${args.keyword}%` };
      if (args.minVolume !== undefined) filters.ESTIMATESEARCHES = { min: args.minVolume };
      if (args.maxCPC !== undefined) filters.ESTIMATEDCPC = { max: args.maxCPC };

      const query = QueryBuilder.buildSelectQuery(
        databases.searchTerms,
        ['SEARCHTERMVALUE', 'ESTIMATESEARCHES', 'ESTIMATEDCPC', 'BRANDS', 'PRODUCTS'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'ESTIMATESEARCHES',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.searchTerms, query);
      return formatResults(results, args.limit || 50);
    }
  }
];


// Register all working tools
const allTools = [
  ...workingProductTools,
  ...workingBrandTools,
  ...workingSellerTools,
  ...workingSearchTools,
  ...diagnosticTools,
  enhancedCustomQueryTool
];

// Helper function to get database descriptions
function getDbDescription(dbName: string): string {
  const descriptions: Record<string, string> = {
    products: 'Product catalog (ASIN, TITLE, MANUFACTURER, BUYBOXPRICE, MONTHLYUNITSSOLD, etc.)',
    brands: 'Brand information (NAME, MONTHLYREVENUE, TOTALPRODUCTS, MONTHGROWTH, etc.)',
    sellers: 'Seller profiles (AMAZONSELLERID, NAME, ESTIMATESALES, NUMBERASINS, etc.)',
    productHistories: 'Product history (PRODUCTID, DATE, BUYBOXPRICE, SALESRANK, etc.)',
    searchTerms: 'Search keywords (SEARCHTERMVALUE, ESTIMATESEARCHES, ESTIMATEDCPC, etc.)'
  };
  
  return descriptions[dbName] || 'SmartScout database table';
}

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Register tools/call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Find the tool
  const tool = allTools.find(t => t.name === name);
  
  if (tool) {
    try {
      const result = await tool.handler(args || {}, {
        domoClient,
        databases,
        QueryBuilder,
        formatResults
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message || 'An error occurred while executing the query',
              details: error.response?.data || error.stack
            }, null, 2)
          }
        ]
      };
    }
  }

  throw new McpError(
    ErrorCode.MethodNotFound,
    `Tool not found: ${name}`
  );
});

// Start the server
async function main() {
  console.error('Starting SmartScout Domo MCP Server v2...');
  console.error('This version only includes tools for accessible datasets');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('SmartScout Domo MCP Server is running');
  console.error(`Connected to Domo instance: ${process.env.DOMO_INSTANCE}`);
  console.error(`Available datasets: ${Object.keys(databases).join(', ')}`);
  console.error(`Total tools: ${allTools.length}`);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});