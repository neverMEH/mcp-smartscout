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
import { productTools } from './tools/product-tools.js';
import { brandTools } from './tools/brand-tools.js';
import { sellerTools } from './tools/seller-tools.js';
import { searchTools } from './tools/search-tools.js';
import { analyticsTools } from './tools/analytics-tools.js';
import { diagnosticTools } from './tools/diagnostic-tools.js';
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

import { DATASET_IDS } from './utils/dataset-ids.js';

// Database IDs from schema files (override environment if needed)
const databases = {
  products: process.env.DB_PRODUCTS || DATASET_IDS.products,
  brands: process.env.DB_BRANDS || DATASET_IDS.brands,
  sellers: process.env.DB_SELLERS || DATASET_IDS.sellers,
  searchTerms: process.env.DB_SEARCHTERMS || DATASET_IDS.searchTerms,
  subcategories: process.env.DB_SUBCATEGORIES || DATASET_IDS.subcategories,
  sellerProducts: process.env.DB_SELLERPRODUCTS || DATASET_IDS.sellerProducts,
  brandCoverages: process.env.DB_BRANDCOVERAGES || DATASET_IDS.brandCoverages,
  coupons: process.env.DB_COUPONS || DATASET_IDS.coupons,
  productHistories: process.env.DB_PRODUCTHISTORIES || DATASET_IDS.productHistories,
  brandCoverageHistories: process.env.DB_BRANDCOVERAGEHISTORIES || DATASET_IDS.brandCoverageHistories,
  searchTermHistories: process.env.DB_SEARCHTERMHISTORIES || DATASET_IDS.searchTermHistories,
  searchTermProductOrganics: process.env.DB_SEARCHTERMPRODUCTORGANICS || DATASET_IDS.searchTermProductOrganics,
  searchTermProductPaids: process.env.DB_SEARCHTERMPRODUCTPAIDS || DATASET_IDS.searchTermProductPaids,
  searchTermProductOrganicHistories: process.env.DB_SEARCHTERMPRODUCTORGANICHISTORIES || DATASET_IDS.searchTermProductOrganicHistories,
  searchTermBrands: process.env.DB_SEARCHTERMBRANDS || DATASET_IDS.searchTermBrands,
  searchTermIntents: process.env.DB_SEARCHTERMINTENTS || DATASET_IDS.searchTermIntents,
  primeExclusiveOffers: process.env.DB_PRIMEEXCLUSIVEOFFERS || DATASET_IDS.primeExclusiveOffers
};

// Create MCP server
const server = new Server({
  name: 'SmartScout Domo',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Register all tools
const allTools = [
  ...productTools,
  ...brandTools,
  ...sellerTools,
  ...searchTools,
  ...analyticsTools,
  ...diagnosticTools
];

// Helper function to get database descriptions
function getDbDescription(dbName: string): string {
  const descriptions: Record<string, string> = {
    products: 'Master product catalog with ASINs, titles, prices, rankings, and metrics',
    brands: 'Brand information with performance metrics and growth data',
    sellers: 'Seller profiles with addresses, ratings, and suspension status',
    searchTerms: 'Keywords with search volume and CPC estimates',
    subcategories: 'Amazon hierarchical category structure',
    sellerProducts: 'Links sellers to products with revenue and buy box data',
    brandCoverages: 'Current seller-brand revenue relationships',
    coupons: 'Promotional coupon data with dates and discounts',
    productHistories: 'Daily product performance snapshots',
    brandCoverageHistories: 'Historical brand coverage tracking',
    searchTermHistories: 'Historical search term data',
    searchTermProductOrganics: 'Organic search rankings for products',
    searchTermProductPaids: 'PPC advertising performance data',
    searchTermProductOrganicHistories: 'Historical organic ranking data',
    searchTermBrands: 'Brand associations with search terms',
    searchTermIntents: 'Search intent categorization',
    primeExclusiveOffers: 'Amazon Prime exclusive deals'
  };
  
  return descriptions[dbName] || 'SmartScout database table';
}

// Register tools/list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      })),
      {
        name: 'smartscout_system_info',
        description: 'Get information about available SmartScout databases and their schemas',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Specific database to get info about',
              enum: Object.keys(databases)
            }
          }
        }
      },
      {
        name: 'smartscout_check_datasets',
        description: 'Check the status and indexing of SmartScout datasets',
        inputSchema: {
          type: 'object',
          properties: {
            dataset: {
              type: 'string',
              description: 'Specific dataset to check (optional)',
              enum: Object.keys(databases)
            },
            attemptIndex: {
              type: 'boolean',
              description: 'Attempt to index unindexed datasets',
              default: false
            }
          }
        }
      }
    ]
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
  
  // Handle system info tool
  if (name === 'smartscout_system_info') {
    try {
      const toolArgs = args || {};
      if (toolArgs.database) {
        const dbId = databases[toolArgs.database as keyof typeof databases];
        const metadata = await domoClient.getDatasetMetadata(dbId);
        const schema = await domoClient.getDatasetSchema(dbId);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                database: toolArgs.database,
                id: dbId,
                metadata: {
                  name: metadata.name,
                  rowCount: metadata.rowCount,
                  columnCount: metadata.columnCount,
                  lastUpdated: new Date(metadata.lastUpdated).toISOString()
                },
                schema: schema.tables?.[0]?.columns || []
              }, null, 2)
            }
          ]
        };
      } else {
        // Return overview of all databases
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                databases: Object.entries(databases).map(([name, id]) => ({
                  name,
                  id,
                  description: getDbDescription(name)
                })),
                totalDatabases: Object.keys(databases).length
              }, null, 2)
            }
          ]
        };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error.message
            }, null, 2)
          }
        ]
      };
    }
  }
  
  // Handle check datasets tool
  if (name === 'smartscout_check_datasets') {
    try {
      const toolArgs = args || {};
      const results: Record<string, any> = {};
      
      if (toolArgs.dataset) {
        // Check specific dataset
        const dbId = databases[toolArgs.dataset as keyof typeof databases];
        const status = await domoClient.checkDatasetStatus(dbId);
        
        const datasetName = toolArgs.dataset as string;
        results[datasetName] = {
          id: dbId,
          ...status
        };
        
        if (toolArgs.attemptIndex && status.exists && !status.indexed) {
          try {
            await domoClient.indexDataset(dbId);
            results[datasetName].indexingAttempted = true;
            results[datasetName].indexingResult = 'Started indexing process';
          } catch (indexError: any) {
            results[datasetName].indexingAttempted = true;
            results[datasetName].indexingError = indexError.message;
          }
        }
      } else {
        // Check all datasets
        for (const [name, id] of Object.entries(databases)) {
          const status = await domoClient.checkDatasetStatus(id);
          results[name] = {
            id,
            ...status
          };
          
          if (toolArgs.attemptIndex && status.exists && !status.indexed) {
            try {
              await domoClient.indexDataset(id);
              results[name].indexingAttempted = true;
              results[name].indexingResult = 'Started indexing process';
            } catch (indexError: any) {
              results[name].indexingAttempted = true;
              results[name].indexingError = indexError.message;
            }
          }
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              datasetStatuses: results,
              summary: {
                total: Object.keys(results).length,
                existing: Object.values(results).filter((r: any) => r.exists).length,
                indexed: Object.values(results).filter((r: any) => r.indexed).length,
                needsIndexing: Object.values(results).filter((r: any) => r.exists && !r.indexed).length
              }
            }, null, 2)
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
              message: error.message
            }, null, 2)
          }
        ]
      };
    }
  }
  
  throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
});

// Start the server
async function main() {
  console.error('Starting SmartScout Domo MCP Server...');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('SmartScout Domo MCP Server is running');
  console.error(`Connected to Domo instance: ${process.env.DOMO_INSTANCE}`);
  console.error(`Available databases: ${Object.keys(databases).join(', ')}`);
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