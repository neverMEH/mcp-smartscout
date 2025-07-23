export const sellerTools = [
  {
    name: 'smartscout_seller_search',
    description: 'Search for sellers by name, ID, or performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        sellerId: {
          type: 'string',
          description: 'Seller ID (exact match)'
        },
        sellerName: {
          type: 'string',
          description: 'Seller name (partial match)'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum monthly revenue'
        },
        minProducts: {
          type: 'number',
          description: 'Minimum number of products'
        },
        minBrands: {
          type: 'number',
          description: 'Minimum number of brands'
        },
        suspended: {
          type: 'boolean',
          description: 'Filter by suspension status'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        },
        orderBy: {
          type: 'string',
          description: 'Column to order by',
          enum: ['MONTHLYREVENUE', 'ASINCOUNT', 'BRANDSCOUNT', 'POSITIVEFEEDBACK'],
          default: 'MONTHLYREVENUE'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.sellerId) filters.AMAZONSELLERID = args.sellerId;
      if (args.sellerName) filters.NAME = { like: `%${args.sellerName}%` };
      if (args.minRevenue !== undefined) filters.ESTIMATESALES = { min: args.minRevenue };
      if (args.minProducts !== undefined) filters.NUMBERASINS = { min: args.minProducts };
      if (args.minBrands !== undefined) filters.NUMBERASINS = { min: args.minBrands }; // Using NUMBERASINS as proxy
      if (args.suspended !== undefined) filters.SUSPENDED = args.suspended ? 'true' : 'false';

      const query = QueryBuilder.buildSelectQuery(
        databases.sellers,
        ['AMAZONSELLERID', 'NAME', 'BUSINESSNAME', 'NUMBERASINS', 'NUMBERASINS',
         'ESTIMATESALES', 'ESTIMATESALES', 'ESTIMATESALES',
         'LIFETIMERATINGSCOUNT', 'LIFETIMERATINGSCOUNT', 'SUSPENDED'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: args.orderBy === 'MONTHLYREVENUE' ? 'ESTIMATESALES' :
                   args.orderBy === 'ASINCOUNT' ? 'NUMBERASINS' :
                   args.orderBy === 'BRANDSCOUNT' ? 'NUMBERASINS' :
                   args.orderBy === 'POSITIVEFEEDBACK' ? 'LIFETIMERATINGSCOUNT' :
                   args.orderBy || 'ESTIMATESALES',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.sellers, query);
      return formatResults(results, args.limit || 50);
    }
  },

  {
    name: 'smartscout_seller_details',
    description: 'Get detailed information about a specific seller',
    inputSchema: {
      type: 'object',
      properties: {
        sellerId: {
          type: 'string',
          description: 'Seller ID',
          required: true
        }
      },
      required: ['sellerId']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder } = context;
      
      // Get seller info
      const sellerQuery = QueryBuilder.buildSelectQuery(
        databases.sellers,
        ['*'],
        {
          filters: { AMAZONSELLERID: args.sellerId },
          limit: 1
        }
      );

      const sellerResults = await domoClient.executeQuery(databases.sellers, sellerQuery);
      
      if (sellerResults && sellerResults.length > 0) {
        // Get top products for this seller
        const productsQuery = QueryBuilder.buildJoinQuery(
          databases.sellerProducts, 'sp',
          [
            {
              datasetId: databases.products, alias: 'p',
              on: 'sp.ASIN = p.ASIN',
              type: 'LEFT'
            }
          ],
          ['p.ASIN', 'p.TITLE', 'p.MANUFACTURER', 'sp.BUYBOXPERCENT', 
           'sp.REVENUE', 'sp.UNITPRICE', 'sp.ESTSALESUNITS'],
          {
            filters: { 'sp.SELLERID': args.sellerId },
            limit: 10,
            orderBy: 'sp.REVENUE',
            orderDirection: 'DESC'
          }
        );

        const productResults = await domoClient.executeQuery(databases.sellerProducts, productsQuery);

        // Get brand coverage for this seller
        const brandsQuery = QueryBuilder.buildSelectQuery(
          databases.brandCoverages,
          ['BRAND', 'ASINCOUNT', 'REVENUE', 'AVGBUYBOXPERCENT', 'UNITS'],
          {
            filters: { AMAZONSELLERID: args.sellerId },
            limit: 10,
            orderBy: 'REVENUE',
            orderDirection: 'DESC'
          }
        );

        const brandResults = await domoClient.executeQuery(databases.brandCoverages, brandsQuery);

        return {
          seller: sellerResults[0],
          topProducts: productResults,
          topBrands: brandResults
        };
      }
      
      return { message: 'Seller not found', sellerId: args.sellerId };
    }
  },

  {
    name: 'smartscout_seller_products',
    description: 'Get products sold by a specific seller',
    inputSchema: {
      type: 'object',
      properties: {
        sellerId: {
          type: 'string',
          description: 'Seller ID',
          required: true
        },
        minBuyBoxPercent: {
          type: 'number',
          description: 'Minimum buy box percentage'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        }
      },
      required: ['sellerId']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = { 'sp.SELLERID': args.sellerId };
      if (args.minBuyBoxPercent !== undefined) {
        filters['sp.BUYBOXPERCENT'] = { min: args.minBuyBoxPercent };
      }

      const query = QueryBuilder.buildJoinQuery(
        databases.sellerProducts, 'sp',
        [
          {
            datasetId: databases.products, alias: 'p',
            on: 'sp.ASIN = p.ASIN',
            type: 'LEFT'
          }
        ],
        ['p.ASIN', 'p.TITLE', 'p.MANUFACTURER', 'p.BUYBOXPRICE', 'p.CATEGORYBROWSENODEID',
         'sp.BUYBOXPERCENT', 'sp.REVENUE', 'sp.UNITPRICE', 'sp.ESTSALESUNITS'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'sp.REVENUE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.sellerProducts, query);
      return formatResults(results, args.limit || 50);
    }
  },

  {
    name: 'smartscout_top_sellers',
    description: 'Get top sellers by revenue or other metrics',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description: 'Metric to rank by',
          enum: ['revenue', 'products', 'brands', 'growth30', 'growth90'],
          default: 'revenue'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum revenue threshold',
          default: 50000
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
      
      const orderByMap: any = {
        revenue: 'ESTIMATESALES',
        products: 'NUMBERASINS',
        brands: 'NUMBERASINS',  // Using NUMBERASINS as proxy for brand count
        growth30: 'ESTIMATESALES',  // Can't calculate growth without historical data
        growth90: 'ESTIMATESALES'   // Can't calculate growth without historical data
      };

      const columns = ['ID', 'AMAZONSELLERID', 'NAME', 'BUSINESSNAME', 'NUMBERASINS', 
                      'ESTIMATESALES', 'LIFETIMERATINGSCOUNT', 'THIRTYDAYRATINGSCOUNT', 
                      'SUSPENDED', 'STARTEDSELLINGDATE'];

      const query = QueryBuilder.buildSelectQuery(
        databases.sellers,
        columns,
        {
          filters: {
            ESTIMATESALES: { min: args.minRevenue || 50000 },
            SUSPENDED: false
          },
          limit: args.limit || 20,
          orderBy: orderByMap[args.metric || 'revenue'],
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.sellers, query);
      return formatResults(results, args.limit || 20);
    }
  }
];export {};
