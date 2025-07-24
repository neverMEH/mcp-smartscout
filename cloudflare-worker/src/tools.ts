/**
 * MCP Tools for SmartScout on Cloudflare Workers
 */

import { DomoClient, QueryBuilder } from './domo-client';

// Dataset IDs
const DATASETS = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c'
};

interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, context: any) => Promise<any>;
}

export const tools: Tool[] = [
  {
    name: 'smartscout_product_search',
    description: 'Search for products by keyword, brand, seller, category, or other criteria',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search term for product title'
        },
        brand: {
          type: 'string',
          description: 'Filter by brand name'
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price filter'
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter'
        },
        limit: {
          type: 'number',
          description: 'Number of results to return',
          default: 50
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient } = context;
      
      const filters: any = {};
      if (args.keyword) filters.TITLE = { like: `%${args.keyword}%` };
      if (args.brand) filters.BRAND = args.brand;
      if (args.minPrice !== undefined) filters.BUYBOXPRICE = { min: args.minPrice };
      if (args.maxPrice !== undefined) {
        filters.BUYBOXPRICE = { ...filters.BUYBOXPRICE, max: args.maxPrice };
      }

      const query = QueryBuilder.buildSelectQuery(
        'dataset',
        ['ASIN', 'TITLE', 'BRAND', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 'RATING'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'MONTHLYUNITSSOLD',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(DATASETS.products, query);
      
      return {
        results: results.rows || [],
        count: results.rows?.length || 0,
        query
      };
    }
  },
  
  {
    name: 'smartscout_brand_analytics',
    description: 'Get brand performance metrics and analytics',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Brand name to analyze'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum monthly revenue filter'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 20
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient } = context;
      
      const filters: any = {};
      if (args.brand) filters.NAME = { like: `%${args.brand}%` };
      if (args.minRevenue !== undefined) filters.MONTHLYREVENUE = { min: args.minRevenue };

      const query = QueryBuilder.buildSelectQuery(
        'dataset',
        ['NAME', 'MONTHLYREVENUE', 'TOTALPRODUCTS', 'MONTHGROWTH', 'AVGPRICE'],
        {
          filters,
          limit: args.limit || 20,
          orderBy: 'MONTHLYREVENUE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(DATASETS.brands, query);
      
      return {
        results: results.rows || [],
        count: results.rows?.length || 0,
        query
      };
    }
  },
  
  {
    name: 'smartscout_keyword_search',
    description: 'Search for keywords with search volume and CPC data',
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
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient } = context;
      
      const filters: any = {};
      if (args.keyword) filters.SEARCHTERMVALUE = { like: `%${args.keyword}%` };
      if (args.minVolume !== undefined) filters.ESTIMATESEARCHES = { min: args.minVolume };

      const query = QueryBuilder.buildSelectQuery(
        'dataset',
        ['SEARCHTERMVALUE', 'ESTIMATESEARCHES', 'ESTIMATEDCPC'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'ESTIMATESEARCHES',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(DATASETS.searchTerms, query);
      
      return {
        results: results.rows || [],
        count: results.rows?.length || 0,
        query
      };
    }
  },
  
  {
    name: 'smartscout_system_info',
    description: 'Get information about available tools and datasets',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async (args: any, context: any) => {
      return {
        version: '1.0.0',
        runtime: 'Cloudflare Workers',
        availableTools: tools.map(t => ({
          name: t.name,
          description: t.description
        })),
        datasets: Object.entries(DATASETS).map(([name, id]) => ({
          name,
          id,
          accessible: true
        }))
      };
    }
  }
];