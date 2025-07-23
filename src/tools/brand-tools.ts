export const brandTools = [
  {
    name: 'smartscout_brand_search',
    description: 'Search for brands and get their performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Brand name to search for (partial match)'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum monthly revenue'
        },
        minProducts: {
          type: 'number',
          description: 'Minimum number of products'
        },
        minGrowth30: {
          type: 'number',
          description: 'Minimum 30-day revenue growth percentage'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        },
        orderBy: {
          type: 'string',
          description: 'Column to order by',
          enum: ['REVENUE', 'ASINCOUNT', 'REVENUEGROWTH30', 'AVGRATING'],
          default: 'REVENUE'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.brand) filters.NAME = { like: `%${args.brand}%` };
      if (args.minRevenue !== undefined) filters.MONTHLYREVENUE = { min: args.minRevenue };
      if (args.minProducts !== undefined) filters.TOTALPRODUCTS = { min: args.minProducts };
      if (args.minGrowth30 !== undefined) filters.MONTHGROWTH = { min: args.minGrowth30 };

      const query = QueryBuilder.buildSelectQuery(
        databases.brands,
        ['NAME', 'TOTALPRODUCTS', 'MONTHLYREVENUE', 'MONTHLYUNITSSOLD', 'AVGPRICE', 
         'TOTALREVIEWS', 'REVIEWRATING', 'MONTHLYREVENUE', 'TRAILING12MONTHS',
         'MONTHGROWTH', 'MONTHGROWTH12'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: args.orderBy === 'REVENUE' ? 'MONTHLYREVENUE' :
                   args.orderBy === 'ASINCOUNT' ? 'TOTALPRODUCTS' :
                   args.orderBy === 'REVENUEGROWTH30' ? 'MONTHGROWTH' :
                   args.orderBy === 'AVGRATING' ? 'REVIEWRATING' :
                   args.orderBy || 'MONTHLYREVENUE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.brands, query);
      return formatResults(results, args.limit || 50);
    }
  },

  {
    name: 'smartscout_brand_details',
    description: 'Get detailed information about a specific brand',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Exact brand name',
          required: true
        }
      },
      required: ['brand']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder } = context;
      
      // Get brand info
      const brandQuery = QueryBuilder.buildSelectQuery(
        databases.brands,
        ['*'],
        {
          filters: { NAME: args.brand },
          limit: 1
        }
      );

      const brandResults = await domoClient.executeQuery(databases.brands, brandQuery);
      
      if (brandResults && brandResults.length > 0) {
        // Get top products for this brand
        const productsQuery = QueryBuilder.buildSelectQuery(
          databases.products,
          ['ASIN', 'TITLE', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 'RANK', 'REVIEWCOUNT', 'REVIEWRATING'],
          {
            filters: { MANUFACTURER: args.brand },
            limit: 10,
            orderBy: 'MONTHLYSALES',
            orderDirection: 'DESC'
          }
        );

        const productResults = await domoClient.executeQuery(databases.products, productsQuery);

        // Get seller coverage for this brand
        const coverageQuery = QueryBuilder.buildSelectQuery(
          databases.brandCoverages,
          ['SELLERID', 'SELLERNAME', 'ASINCOUNT', 'REVENUE', 'AVGBUYBOXPERCENT'],
          {
            filters: { NAME: args.brand },
            limit: 10,
            orderBy: 'REVENUE',
            orderDirection: 'DESC'
          }
        );

        const coverageResults = await domoClient.executeQuery(databases.brandCoverages, coverageQuery);

        return {
          brand: brandResults[0],
          topProducts: productResults,
          topSellers: coverageResults
        };
      }
      
      return { message: 'Brand not found', brand: args.brand };
    }
  },

  {
    name: 'smartscout_brand_coverage',
    description: 'Get seller coverage information for brands',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Brand name'
        },
        sellerId: {
          type: 'string',
          description: 'Seller ID'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum revenue threshold'
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
      if (args.brand) filters.BRAND = args.brand;
      if (args.sellerId) filters.SELLERID = args.sellerId;
      if (args.minRevenue !== undefined) filters.REVENUE = { min: args.minRevenue };

      const query = QueryBuilder.buildSelectQuery(
        databases.brandCoverages,
        ['SELLERID', 'SELLERNAME', 'BRAND', 'ASINCOUNT', 'REVENUE', 
         'AVGBUYBOXPERCENT', 'AVGPRICE', 'REVPERCENTOFTOTAL', 'UNITS'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'REVENUE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.brandCoverages, query);
      return formatResults(results, args.limit || 50);
    }
  },

  {
    name: 'smartscout_brand_growth',
    description: 'Find fastest growing brands',
    inputSchema: {
      type: 'object',
      properties: {
        minRevenue: {
          type: 'number',
          description: 'Minimum current revenue',
          default: 10000
        },
        period: {
          type: 'string',
          description: 'Growth period',
          enum: ['30', '90'],
          default: '30'
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
      
      // Use MONTHGROWTH for 30-day period and MONTHGROWTH12 for longer period
      const growthColumn = args.period === '90' ? 'MONTHGROWTH12' : 'MONTHGROWTH';

      const query = QueryBuilder.buildSelectQuery(
        databases.brands,
        ['ID', 'NAME', 'TOTALPRODUCTS', 'MONTHLYREVENUE', growthColumn, 
         'AVGPRICE', 'REVIEWRATING'],
        {
          filters: {
            MONTHLYREVENUE: { min: args.minRevenue || 10000 },
            [growthColumn]: { min: 0 }
          },
          limit: args.limit || 20,
          orderBy: growthColumn,
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.brands, query);
      return formatResults(results, args.limit || 20);
    }
  }
];export {};
