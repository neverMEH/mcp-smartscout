import { mapProductColumns, mapProductFilters } from '../utils/column-mappings.js';

export const productTools = [
  {
    name: 'smartscout_product_search',
    description: 'Search for products by ASIN, title, brand, or other criteria',
    inputSchema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'ASIN to search for (exact match)'
        },
        title: {
          type: 'string',
          description: 'Product title to search for (partial match)'
        },
        brand: {
          type: 'string',
          description: 'Brand name to filter by'
        },
        category: {
          type: 'string',
          description: 'Category to filter by'
        },
        subcategory: {
          type: 'string',
          description: 'Subcategory to filter by'
        },
        minPrice: {
          type: 'number',
          description: 'Minimum price filter'
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price filter'
        },
        minSales: {
          type: 'number',
          description: 'Minimum monthly sales filter'
        },
        minReviews: {
          type: 'number',
          description: 'Minimum review count filter'
        },
        minRating: {
          type: 'number',
          description: 'Minimum rating filter (1-5)'
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (max 1000)',
          default: 50
        },
        orderBy: {
          type: 'string',
          description: 'Column to order by',
          enum: ['MONTHLYUNITSSOLD', 'BUYBOXPRICE', 'REVIEWCOUNT', 'REVIEWRATING', 'RANK'],
          default: 'MONTHLYUNITSSOLD'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.asin) filters.ASIN = args.asin;
      if (args.title) filters.TITLE = { like: `%${args.title}%` };
      if (args.brand) filters.MANUFACTURER = args.brand; // Using MANUFACTURER as brand
      if (args.category) filters.CATEGORYBROWSENODEID = args.category;
      if (args.subcategory) filters.SUBCATEGORYRANK = args.subcategory;
      if (args.minPrice !== undefined || args.maxPrice !== undefined) {
        filters.BUYBOXPRICE = { min: args.minPrice, max: args.maxPrice };
      }
      if (args.minSales !== undefined) filters.MONTHLYUNITSSOLD = { min: args.minSales };
      if (args.minReviews !== undefined) filters.REVIEWCOUNT = { min: args.minReviews };
      if (args.minRating !== undefined) filters.REVIEWRATING = { min: args.minRating };

      const query = QueryBuilder.buildSelectQuery(
        databases.products,
        ['ASIN', 'TITLE', 'MANUFACTURER', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 'RANK', 
         'REVIEWCOUNT', 'REVIEWRATING', 'CATEGORYBROWSENODEID', 'SUBCATEGORYRANK', 'IMAGEURL'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: args.orderBy === 'MONTHLYSALES' ? 'MONTHLYUNITSSOLD' : 
                   args.orderBy === 'PRICE' ? 'BUYBOXPRICE' :
                   args.orderBy === 'RATING' ? 'REVIEWRATING' :
                   args.orderBy === 'SALESRANK' ? 'RANK' : 
                   args.orderBy || 'MONTHLYUNITSSOLD',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.products, query);
      return formatResults(results, args.limit || 50);
    }
  },

  {
    name: 'smartscout_product_details',
    description: 'Get detailed information about a specific product by ASIN',
    inputSchema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'ASIN of the product',
          required: true
        }
      },
      required: ['asin']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const query = QueryBuilder.buildSelectQuery(
        databases.products,
        ['*'],
        {
          filters: { ASIN: args.asin },
          limit: 1
        }
      );

      const results = await domoClient.executeQuery(databases.products, query);
      
      if (results && results.length > 0) {
        // Also get seller information for this product
        const sellerQuery = QueryBuilder.buildJoinQuery(
          databases.sellerProducts, 'sp',
          [
            {
              datasetId: databases.sellers,
              alias: 's',
              on: 'sp.SELLERID = s.SELLERID',
              type: 'LEFT'
            }
          ],
          ['s.SELLERNAME', 's.SELLERID', 'sp.BUYBOXPERCENT', 'sp.REVENUE', 'sp.UNITPRICE'],
          {
            filters: { 'sp.ASIN': args.asin },
            limit: 10,
            orderBy: 'sp.BUYBOXPERCENT',
            orderDirection: 'DESC'
          }
        );

        const sellerResults = await domoClient.executeQuery(databases.sellerProducts, sellerQuery);

        return {
          product: results[0],
          sellers: formatResults(sellerResults, 10)
        };
      }
      
      return { message: 'Product not found', asin: args.asin };
    }
  },

  {
    name: 'smartscout_product_history',
    description: 'Get historical data for a product including price and sales rank changes',
    inputSchema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'ASIN of the product',
          required: true
        },
        days: {
          type: 'number',
          description: 'Number of days of history to retrieve',
          default: 30
        }
      },
      required: ['asin']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder } = context;
      
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - (args.days || 30));
      
      const query = QueryBuilder.buildSelectQuery(
        databases.productHistories,
        ['DATE', 'BUYBOXPRICE', 'SALESRANK', 'ESTIMATEDUNITSALES', 
         'REVIEWS', 'RATING', 'NUMBEROFSELLERS'],
        {
          filters: {
            PRODUCTID: args.asin,
            DATE: { min: daysAgo.toISOString().split('T')[0] }
          },
          limit: args.days || 30,
          orderBy: 'DATE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.productHistories, query);
      
      if (results && results.rows && results.rows.length > 0) {
        // Format results using formatResults helper
        const formattedHistory = context.formatResults(results, args.days || 30);
        
        // Calculate some basic stats from formatted results
        if (formattedHistory.results && formattedHistory.results.length > 0) {
          const prices = formattedHistory.results.map((r: any) => r.BUYBOXPRICE).filter((p: any) => p);
          const salesRanks = formattedHistory.results.map((r: any) => r.SALESRANK).filter((s: any) => s);
          
          return {
            asin: args.asin,
            history: formattedHistory,
            stats: {
              avgPrice: prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0,
              minPrice: prices.length > 0 ? Math.min(...prices) : 0,
              maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
              avgSalesRank: salesRanks.length > 0 ? salesRanks.reduce((a: number, b: number) => a + b, 0) / salesRanks.length : 0,
              bestSalesRank: salesRanks.length > 0 ? Math.min(...salesRanks) : 0,
              worstSalesRank: salesRanks.length > 0 ? Math.max(...salesRanks) : 0
            }
          };
        }
      }
      
      return { message: 'No history found', asin: args.asin };
    }
  },

  {
    name: 'smartscout_top_products',
    description: 'Get top selling products in a category or subcategory',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category to filter by'
        },
        subcategory: {
          type: 'string',
          description: 'Subcategory to filter by'
        },
        brand: {
          type: 'string',
          description: 'Brand to filter by'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 20
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.category) filters.CATEGORYBROWSENODEID = args.category;
      if (args.subcategory) filters.SUBCATEGORYRANK = args.subcategory;
      if (args.brand) filters.MANUFACTURER = args.brand;

      const query = QueryBuilder.buildSelectQuery(
        databases.products,
        ['ASIN', 'TITLE', 'MANUFACTURER', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 'RANK', 
         'REVIEWCOUNT', 'REVIEWRATING', 'CATEGORYBROWSENODEID', 'SUBCATEGORYRANK'],
        {
          filters,
          limit: args.limit || 20,
          orderBy: 'MONTHLYUNITSSOLD',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.products, query);
      return formatResults(results, args.limit || 20);
    }
  }
];export {};
export {};
