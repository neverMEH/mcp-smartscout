import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { DomoClient } from './utils/domo-client.js';
import { QueryBuilder } from './utils/query-builder.js';
import { formatResults } from './utils/format.js';

// Import tools
import { productTools } from './tools/product-tools.js';
import { brandTools } from './tools/brand-tools.js';
import { sellerTools } from './tools/seller-tools.js';
import { diagnosticTools } from './tools/diagnostic-tools.js';
import { enhancedCustomQueryTool } from './tools/custom-query-tool.js';

export interface ServerConfig {
  domoInstance: string;
  domoAccessToken: string;
  databases?: {
    products?: string;
    brands?: string;
    sellers?: string;
    productHistories?: string;
    searchTerms?: string;
  };
}

export function createMcpServer(config: ServerConfig) {
  // Initialize Domo client
  const domoClient = new DomoClient(
    config.domoInstance,
    config.domoAccessToken
  );

  // Set up databases with defaults
  const databases = {
    products: config.databases?.products || '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
    brands: config.databases?.brands || 'c11f0182-b5db-42f2-b838-be3b3ade707e',
    sellers: config.databases?.sellers || '06b5bef5-e639-442c-b632-3a1c02996f26',
    productHistories: config.databases?.productHistories || '48cb5956-1e16-4882-9e44-7f9d62cec04c',
    searchTerms: config.databases?.searchTerms || 'c697bdd5-760e-4102-98c1-3f9da094f6d6'
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

  // Create handler functions for HTTP access
  const handleToolsList = async () => {
    return {
      tools: allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  };

  const handleToolCall = async (name: string, args: any) => {
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
  };

  return {
    server,
    databases,
    domoClient,
    toolCount: allTools.length,
    handlers: {
      toolsList: handleToolsList,
      toolCall: handleToolCall
    }
  };
}