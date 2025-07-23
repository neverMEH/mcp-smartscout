export const analyticsTools = [
  {
    name: 'smartscout_market_analysis',
    description: 'Analyze market metrics for a category or subcategory',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category to analyze'
        },
        subcategory: {
          type: 'string',
          description: 'Subcategory to analyze'
        },
        brand: {
          type: 'string',
          description: 'Specific brand to analyze within category'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      const filters: any = {};
      if (args.category) filters.CATEGORYBROWSENODEID = args.category;
      if (args.subcategory) filters.SUBCATEGORYRANK = args.subcategory;
      if (args.brand) filters.MANUFACTURER = args.brand;

      // Get market overview
      const marketQuery = QueryBuilder.buildAggregateQuery(
        databases.products,
        {
          total_products: 'COUNT(DISTINCT ASIN)',
          total_brands: 'COUNT(DISTINCT MANUFACTURER)',
          avg_price: 'AVG(BUYBOXPRICE)',
          total_revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
          avg_reviews: 'AVG(REVIEWCOUNT)',
          avg_rating: 'AVG(REVIEWRATING)',
          avg_sales_rank: 'AVG(RANK)'
        },
        undefined,
        filters
      );

      const marketResults = await domoClient.executeQuery(databases.products, marketQuery);
      const formattedMarket = formatResults(marketResults, 1);

      // Get top brands in market
      const brandQuery = QueryBuilder.buildAggregateQuery(
        databases.products,
        {
          product_count: 'COUNT(DISTINCT ASIN)',
          revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
          avg_price: 'AVG(BUYBOXPRICE)',
          avg_rating: 'AVG(REVIEWRATING)'
        },
        ['MANUFACTURER'],
        filters,
        undefined,
        { limit: 10, orderBy: 'revenue', orderDirection: 'DESC' }
      );

      const brandResults = await domoClient.executeQuery(databases.products, brandQuery);
      const formattedBrands = formatResults(brandResults, 10);

      // Get price distribution
      const priceRangeColumn = 'CASE ' +
        'WHEN BUYBOXPRICE < 10 THEN \'Under $10\' ' +
        'WHEN BUYBOXPRICE < 25 THEN \'$10-$25\' ' +
        'WHEN BUYBOXPRICE < 50 THEN \'$25-$50\' ' +
        'WHEN BUYBOXPRICE < 100 THEN \'$50-$100\' ' +
        'ELSE \'Over $100\' ' +
        'END';
      
      const priceQuery = QueryBuilder.buildAggregateQuery(
        databases.products,
        {
          product_count: 'COUNT(*)',
          revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)'
        },
        [priceRangeColumn],
        filters,
        undefined,
        { limit: 10, orderBy: 'product_count', orderDirection: 'DESC' }
      );

      const priceResults = await domoClient.executeQuery(databases.products, priceQuery);
      const formattedPrices = formatResults(priceResults, 10);

      return {
        marketOverview: formattedMarket.results && formattedMarket.results[0] ? formattedMarket.results[0] : {},
        topBrands: formattedBrands,
        priceDistribution: formattedPrices,
        filters: {
          category: args.category,
          subcategory: args.subcategory,
          brand: args.brand
        }
      };
    }
  },

  {
    name: 'smartscout_competitor_analysis',
    description: 'Analyze competitors for a specific product or brand',
    inputSchema: {
      type: 'object',
      properties: {
        asin: {
          type: 'string',
          description: 'ASIN to find competitors for'
        },
        brand: {
          type: 'string',
          description: 'Brand to analyze competitors'
        },
        limit: {
          type: 'number',
          description: 'Number of competitors to return',
          default: 10
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      if (args.asin) {
        // First get the product details
        const productQuery = QueryBuilder.buildSelectQuery(
          databases.products,
          ['CATEGORYBROWSENODEID', 'SUBCATEGORYRANK', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD'],
          {
            filters: { ASIN: args.asin },
            limit: 1
          }
        );

        const productResult = await domoClient.executeQuery(databases.products, productQuery);
        
        if (productResult && productResult.rows && productResult.rows.length > 0) {
          // Format the result to get the first product
          const formattedResult = formatResults(productResult, 1);
          if (formattedResult.results && formattedResult.results.length > 0) {
            const product = formattedResult.results[0];
          
          // Find similar products in same subcategory
          const competitorQuery = QueryBuilder.buildSelectQuery(
            databases.products,
            ['ASIN', 'TITLE', 'MANUFACTURER', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 
             'REVIEWCOUNT', 'REVIEWRATING', 'RANK'],
            {
              filters: {
                SUBCATEGORYRANK: product.SUBCATEGORYRANK,
                BUYBOXPRICE: { 
                  min: product.BUYBOXPRICE * 0.7, 
                  max: product.BUYBOXPRICE * 1.3 
                },
                ASIN: { not: args.asin }
              },
              limit: args.limit || 10,
              orderBy: 'MONTHLYUNITSSOLD',
              orderDirection: 'DESC'
            }
          );

          const competitors = await domoClient.executeQuery(databases.products, competitorQuery);
          
            return {
              referenceProduct: {
                asin: args.asin,
                ...product
              },
              competitors: formatResults(competitors, args.limit || 10)
            };
          }
        }
      }

      if (args.brand) {
        // Get brand's main categories
        const categoryQuery = QueryBuilder.buildAggregateQuery(
          databases.products,
          {
            product_count: 'COUNT(*)',
            revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)'
          },
          ['CATEGORYBROWSENODEID'],
          { MANUFACTURER: args.brand },
          undefined,
          { limit: 5, orderBy: 'revenue', orderDirection: 'DESC' }
        );

        const categories = await domoClient.executeQuery(databases.products, categoryQuery);
        
        if (categories && categories.rows && categories.rows.length > 0) {
          const formattedCategories = formatResults(categories, 5);
          if (formattedCategories.results && formattedCategories.results.length > 0) {
            const topCategory = formattedCategories.results[0].CATEGORYBROWSENODEID;
          
          // Find competing brands in same category
          const competingBrandsQuery = QueryBuilder.buildAggregateQuery(
            databases.products,
            {
              product_count: 'COUNT(DISTINCT ASIN)',
              revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
              avg_price: 'AVG(BUYBOXPRICE)',
              avg_rating: 'AVG(REVIEWRATING)'
            },
            ['MANUFACTURER'],
            { 
              CATEGORYBROWSENODEID: topCategory,
              MANUFACTURER: { not: args.brand }
            },
            undefined,
            { limit: args.limit || 10, orderBy: 'revenue', orderDirection: 'DESC' }
          );

          const competingBrands = await domoClient.executeQuery(databases.products, competingBrandsQuery);
          
            return {
              referenceBrand: args.brand,
              mainCategory: topCategory,
              competingBrands: formatResults(competingBrands, args.limit || 10)
            };
          }
        }
      }

      return { message: 'Please provide either an ASIN or brand name' };
    }
  },

  {
    name: 'smartscout_opportunity_finder',
    description: 'Find market opportunities based on various criteria',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of opportunity to find',
          enum: ['low_competition', 'high_demand', 'poor_ratings', 'price_gaps'],
          default: 'low_competition'
        },
        category: {
          type: 'string',
          description: 'Category to search within'
        },
        minRevenue: {
          type: 'number',
          description: 'Minimum market revenue',
          default: 10000
        },
        limit: {
          type: 'number',
          description: 'Number of opportunities',
          default: 20
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases, QueryBuilder, formatResults } = context;
      
      let query: string;
      const baseFilters: any = {};
      if (args.category) baseFilters.CATEGORY = args.category;

      switch (args.type) {
        case 'low_competition':
          // Find subcategories with high sales but few dominant sellers
          query = QueryBuilder.buildAggregateQuery(
            databases.products,
            {
              product_count: 'COUNT(DISTINCT ASIN)',
              brand_count: 'COUNT(DISTINCT BRAND)',
              total_revenue: 'SUM(MONTHLYSALES * PRICE)',
              avg_reviews: 'AVG(REVIEWCOUNT)',
              competition_score: 'AVG(REVIEWCOUNT) / COUNT(DISTINCT BRAND)'
            },
            ['SUBCATEGORY'],
            baseFilters,
            'SUM(MONTHLYSALES * PRICE) > ' + (args.minRevenue || 10000),
            { limit: args.limit || 20, orderBy: 'competition_score', orderDirection: 'ASC' }
          );
          break;

        case 'high_demand':
          // Find products with high sales velocity
          query = QueryBuilder.buildSelectQuery(
            databases.products,
            ['ASIN', 'TITLE', 'BRAND', 'CATEGORY', 'SUBCATEGORY', 
             'PRICE', 'MONTHLYSALES', 'SALESRANK', 'REVIEWCOUNT',
             '(MONTHLYSALES / NULLIF(REVIEWCOUNT, 0)) AS sales_per_review'],
            {
              filters: {
                ...baseFilters,
                MONTHLYSALES: { min: 100 },
                REVIEWCOUNT: { min: 10, max: 100 }
              },
              limit: args.limit || 20,
              orderBy: 'sales_per_review',
              orderDirection: 'DESC'
            }
          );
          break;

        case 'poor_ratings':
          // Find high-revenue products with poor ratings (improvement opportunity)
          query = QueryBuilder.buildSelectQuery(
            databases.products,
            ['ASIN', 'TITLE', 'MANUFACTURER', 'CATEGORYBROWSENODEID', 'BUYBOXPRICE', 
             'MONTHLYUNITSSOLD', 'REVIEWRATING', 'REVIEWCOUNT',
             '(MONTHLYUNITSSOLD * BUYBOXPRICE) AS revenue'],
            {
              filters: {
                ...baseFilters,
                REVIEWRATING: { max: 3.5 },
                MONTHLYUNITSSOLD: { min: 50 },
                REVIEWCOUNT: { min: 50 }
              },
              limit: args.limit || 20,
              orderBy: 'revenue',
              orderDirection: 'DESC'
            }
          );
          break;

        case 'price_gaps':
          // Find categories with large price spreads
          query = QueryBuilder.buildAggregateQuery(
            databases.products,
            {
              product_count: 'COUNT(*)',
              min_price: 'MIN(BUYBOXPRICE)',
              max_price: 'MAX(BUYBOXPRICE)',
              avg_price: 'AVG(BUYBOXPRICE)',
              price_spread: 'MAX(BUYBOXPRICE) - MIN(BUYBOXPRICE)',
              total_revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)'
            },
            ['SUBCATEGORY'],
            {
              ...baseFilters,
              BUYBOXPRICE: { min: 10, max: 500 }
            },
            'COUNT(*) > 10 AND SUM(MONTHLYUNITSSOLD * BUYBOXPRICE) > ' + (args.minRevenue || 10000),
            { limit: args.limit || 20, orderBy: 'price_spread', orderDirection: 'DESC' }
          );
          break;

        default:
          return { error: 'Invalid opportunity type' };
      }

      const results = await domoClient.executeQuery(databases.products, query);
      return {
        opportunityType: args.type,
        results: formatResults(results, args.limit || 20)
      };
    }
  },

  {
    name: 'smartscout_custom_query',
    description: 'Execute a custom SQL query on SmartScout data (advanced users)',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table to query',
          enum: ['products', 'brands', 'sellers', 'searchterms', 'subcategories', 
                 'sellerproducts', 'brandcoverages', 'producthistories'],
          required: true
        },
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT only)',
          required: true
        }
      },
      required: ['table', 'sql']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases } = context;
      
      // Basic SQL injection prevention - only allow SELECT queries
      if (!args.sql) {
        return { error: 'SQL query is required' };
      }
      
      const normalizedSql = args.sql.trim().toUpperCase();
      if (!normalizedSql.startsWith('SELECT')) {
        return { error: 'Only SELECT queries are allowed' };
      }

      // Check for dangerous keywords
      const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'EXEC', 'EXECUTE'];
      for (const keyword of dangerousKeywords) {
        if (normalizedSql.includes(keyword)) {
          return { error: `Query contains forbidden keyword: ${keyword}` };
        }
      }

      try {
        const databaseId = databases[args.table as keyof typeof databases];
        if (!databaseId) {
          return { error: 'Invalid table name' };
        }

        const results = await domoClient.executeQuery(databaseId, args.sql);
        
        // Limit results to prevent token overflow
        const limited = Array.isArray(results) ? results.slice(0, 100) : results;
        
        return {
          table: args.table,
          query: args.sql,
          results: limited,
          count: Array.isArray(results) ? results.length : 0,
          ...(Array.isArray(results) && results.length > 100 
            ? { note: 'Results limited to first 100 rows' } 
            : {})
        };
      } catch (error: any) {
        return {
          error: true,
          message: error.message,
          query: args.sql
        };
      }
    }
  }
];export {};
