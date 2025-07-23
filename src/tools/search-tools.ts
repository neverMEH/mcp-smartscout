export const searchTools = [
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
        ['SEARCHTERMVALUE', 'ESTIMATESEARCHES', 'ESTIMATESEARCHES', 
         'ESTIMATESEARCHES', 'ESTIMATEDCPC'],
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
  },

  {
    name: 'smartscout_keyword_products',
    description: 'Get products ranking for a specific keyword (organic and paid)',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Exact keyword',
          required: true
        },
        type: {
          type: 'string',
          description: 'Search type',
          enum: ['organic', 'paid', 'both'],
          default: 'both'
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 20
        }
      },
      required: ['keyword']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const results: any = {};

      // Get organic results if requested
      if (args.type === 'organic' || args.type === 'both') {
        const organicQuery = QueryBuilder.buildJoinQuery(
          databases.searchTermProductOrganics, 'o',
          [
            {
              datasetId: databases.products, alias: 'p',
              on: 'o.ASIN = p.ASIN',
              type: 'LEFT'
            }
          ],
          ['o.POSITION', 'p.ASIN', 'p.TITLE', 'p.MANUFACTURER', 'p.BUYBOXPRICE', 
           'p.MONTHLYUNITSSOLD', 'p.REVIEWCOUNT', 'p.REVIEWRATING'],
          {
            filters: { 'o.SEARCHTERMVALUE': args.keyword },
            limit: args.limit || 20,
            orderBy: 'o.POSITION',
            orderDirection: 'ASC'
          }
        );

        const organicResults = await domoClient.executeQuery(
          databases.searchTermProductOrganics, 
          organicQuery
        );
        results.organic = organicResults;
      }

      // Get paid results if requested
      if (args.type === 'paid' || args.type === 'both') {
        const paidQuery = QueryBuilder.buildJoinQuery(
          databases.searchTermProductPaids, 's',
          [
            {
              datasetId: databases.products, alias: 'p',
              on: 's.ASIN = p.ASIN',
              type: 'LEFT'
            }
          ],
          ['s.POSITION', 'p.ASIN', 'p.TITLE', 'p.MANUFACTURER', 'p.BUYBOXPRICE', 
           'p.MONTHLYUNITSSOLD', 'p.REVIEWCOUNT', 'p.REVIEWRATING'],
          {
            filters: { 's.SEARCHTERMVALUE': args.keyword },
            limit: args.limit || 20,
            orderBy: 's.POSITION',
            orderDirection: 'ASC'
          }
        );

        const paidResults = await domoClient.executeQuery(
          databases.searchTermProductPaids, 
          paidQuery
        );
        results.paid = paidResults;
      }

      return {
        keyword: args.keyword,
        ...results
      };
    }
  },

  {
    name: 'smartscout_product_keywords',
    description: 'Get keywords that a product ranks for',
    inputSchema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'Product ASIN',
          required: true
        },
        type: {
          type: 'string',
          description: 'Ranking type',
          enum: ['organic', 'paid', 'both'],
          default: 'organic'
        },
        maxPosition: {
          type: 'number',
          description: 'Maximum position to include',
          default: 50
        },
        limit: {
          type: 'number',
          description: 'Number of results',
          default: 50
        }
      },
      required: ['asin']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const results: any = {};

      // Get organic keywords
      if (args.type === 'organic' || args.type === 'both') {
        const organicQuery = QueryBuilder.buildJoinQuery(
          databases.searchTermProductOrganics, 'o',
          [
            {
              datasetId: databases.searchTerms,
              alias: 's',
              on: 'o.SEARCHTERMVALUE = s.SEARCHTERMVALUE',
              type: 'LEFT'
            }
          ],
          ['o.SEARCHTERMVALUE', 'o.POSITION', 's.ESTIMATESEARCHES', 
           's.ESTIMATEDCPC', 's.ESTIMATESEARCHES'],
          {
            filters: {
              'o.ASIN': args.asin,
              'o.POSITION': { max: args.maxPosition || 50 }
            },
            limit: args.limit || 50,
            orderBy: 's.ESTIMATESEARCHES',
            orderDirection: 'DESC'
          }
        );

        const organicResults = await domoClient.executeQuery(
          databases.searchTermProductOrganics, 
          organicQuery
        );
        results.organic = formatResults(organicResults, args.limit || 50);
      }

      // Get paid keywords
      if (args.type === 'paid' || args.type === 'both') {
        const paidQuery = QueryBuilder.buildJoinQuery(
          databases.searchTermProductPaids, 'p',
          [
            {
              datasetId: databases.searchTerms,
              alias: 's',
              on: 'p.SEARCHTERMVALUE = s.SEARCHTERMVALUE',
              type: 'LEFT'
            }
          ],
          ['p.SEARCHTERMVALUE', 'p.POSITION', 's.ESTIMATESEARCHES', 
           's.ESTIMATEDCPC', 's.ESTIMATESEARCHES'],
          {
            filters: {
              'p.ASIN': args.asin,
              'p.POSITION': { max: args.maxPosition || 50 }
            },
            limit: args.limit || 50,
            orderBy: 's.ESTIMATESEARCHES',
            orderDirection: 'DESC'
          }
        );

        const paidResults = await domoClient.executeQuery(
          databases.searchTermProductPaids, 
          paidQuery
        );
        results.paid = formatResults(paidResults, args.limit || 50);
      }

      return {
        asin: args.asin,
        ...results
      };
    }
  },

  {
    name: 'smartscout_keyword_brands',
    description: 'Get brands associated with search terms',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search term'
        },
        brand: {
          type: 'string',
          description: 'Brand name'
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
      // Since searchTermBrands table doesn't exist, use brands table
      if (args.brand) filters.NAME = args.brand;

      const query = QueryBuilder.buildSelectQuery(
        databases.brands,
        ['NAME', 'MONTHLYREVENUE', 'TOTALPRODUCTS', 'CATEGORYBROWSENODEID'],
        {
          filters,
          limit: args.limit || 50,
          orderBy: 'MONTHLYREVENUE',
          orderDirection: 'DESC'
        }
      );

      const results = await domoClient.executeQuery(databases.brands, query);
      return formatResults(results, args.limit || 50);
    }
  }
];export {};
