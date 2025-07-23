export const enhancedCustomQueryTool = {
  name: 'smartscout_custom_query',
  description: `Execute custom SQL queries on SmartScout datasets. 
  
Examples:
- Find top products by revenue: SELECT ASIN, TITLE, MANUFACTURER, MONTHLYUNITSSOLD * BUYBOXPRICE AS REVENUE FROM dataset ORDER BY REVENUE DESC LIMIT 10
- Search products by keyword: SELECT * FROM dataset WHERE TITLE LIKE '%phone%' LIMIT 20
- Aggregate by brand: SELECT MANUFACTURER, COUNT(*) AS PRODUCTS, SUM(MONTHLYUNITSSOLD) AS TOTAL_SALES FROM dataset GROUP BY MANUFACTURER ORDER BY TOTAL_SALES DESC LIMIT 10
- Date range queries: SELECT * FROM dataset WHERE DATE >= '2025-01-01' AND DATE <= '2025-01-31'
- Complex filters: SELECT * FROM dataset WHERE BUYBOXPRICE BETWEEN 10 AND 50 AND REVIEWRATING >= 4.0 AND MONTHLYUNITSSOLD > 100`,
  
  inputSchema: {
    type: 'object',
    properties: {
      dataset: {
        type: 'string',
        description: 'Dataset to query',
        enum: ['products', 'brands', 'sellers', 'productHistories', 'searchTerms', 'custom']
      },
      datasetId: {
        type: 'string',
        description: 'Custom dataset ID (required when dataset="custom")'
      },
      sql: {
        type: 'string',
        description: 'SQL query to execute. Use "dataset" as the table name.',
        required: true
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return (default: 100, max: 1000)',
        default: 100
      },
      showSchema: {
        type: 'boolean',
        description: 'Show available columns for the dataset',
        default: false
      }
    },
    required: ['sql']
  },
  
  handler: async (args: any, context: any) => {
    const { domoClient, databases, formatResults } = context;
    
    // Schema information for each dataset
    const schemas: Record<string, { columns: string[], examples: string[] }> = {
      products: {
        columns: ['ASIN', 'TITLE', 'MANUFACTURER', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD', 'RANK', 
                  'REVIEWRATING', 'REVIEWCOUNT', 'CATEGORYBROWSENODEID', 'SUBCATEGORYRANK', 
                  'IMAGEURL', 'NUMBEROFSELLERS', 'AMAZONISR', 'MODEL', 'BRANDID'],
        examples: [
          "SELECT * FROM dataset WHERE MANUFACTURER = 'Apple' LIMIT 10",
          "SELECT ASIN, TITLE, BUYBOXPRICE, MONTHLYUNITSSOLD FROM dataset WHERE BUYBOXPRICE > 100 ORDER BY MONTHLYUNITSSOLD DESC",
          "SELECT MANUFACTURER, COUNT(*) AS COUNT, AVG(BUYBOXPRICE) AS AVG_PRICE FROM dataset GROUP BY MANUFACTURER"
        ]
      },
      brands: {
        columns: ['ID', 'NAME', 'MONTHLYREVENUE', 'TOTALPRODUCTS', 'MONTHGROWTH', 'MONTHGROWTH12',
                  'AVGPRICE', 'REVIEWRATING', 'CATEGORYBROWSENODEID', 'AMAZONISR', 'BRANDSCORE'],
        examples: [
          "SELECT * FROM dataset WHERE MONTHLYREVENUE > 1000000 ORDER BY MONTHLYREVENUE DESC",
          "SELECT NAME, MONTHGROWTH FROM dataset WHERE MONTHGROWTH > 0 ORDER BY MONTHGROWTH DESC LIMIT 20",
          "SELECT * FROM dataset WHERE NAME LIKE '%Nike%'"
        ]
      },
      sellers: {
        columns: ['ID', 'AMAZONSELLERID', 'NAME', 'BUSINESSNAME', 'ESTIMATESALES', 'NUMBERASINS',
                  'LIFETIMERATINGSCOUNT', 'THIRTYDAYRATINGSCOUNT', 'SUSPENDED', 'STARTEDSELLINGDATE'],
        examples: [
          "SELECT * FROM dataset WHERE ESTIMATESALES > 100000 AND SUSPENDED = false",
          "SELECT NAME, ESTIMATESALES, NUMBERASINS FROM dataset ORDER BY ESTIMATESALES DESC LIMIT 50",
          "SELECT * FROM dataset WHERE STARTEDSELLINGDATE >= '2020-01-01'"
        ]
      },
      productHistories: {
        columns: ['PRODUCTID', 'DATE', 'BUYBOXPRICE', 'ESTIMATEDUNITSALES', 'SALESRANK', 
                  'RATING', 'REVIEWS', 'NUMBEROFSELLERS'],
        examples: [
          "SELECT * FROM dataset WHERE PRODUCTID = 'B08N5WRWNW' ORDER BY DATE DESC",
          "SELECT DATE, AVG(BUYBOXPRICE) AS AVG_PRICE FROM dataset WHERE DATE >= '2025-01-01' GROUP BY DATE",
          "SELECT PRODUCTID, MAX(BUYBOXPRICE) - MIN(BUYBOXPRICE) AS PRICE_RANGE FROM dataset GROUP BY PRODUCTID HAVING PRICE_RANGE > 10"
        ]
      },
      searchTerms: {
        columns: ['SEARCHTERMVALUE', 'ESTIMATESEARCHES', 'ESTIMATEDCPC', 'BRANDS', 'PRODUCTS'],
        examples: [
          "SELECT * FROM dataset WHERE ESTIMATESEARCHES > 10000 ORDER BY ESTIMATESEARCHES DESC",
          "SELECT * FROM dataset WHERE SEARCHTERMVALUE LIKE '%wireless%' AND ESTIMATEDCPC < 2.0",
          "SELECT SEARCHTERMVALUE, ESTIMATESEARCHES, ESTIMATEDCPC FROM dataset ORDER BY ESTIMATEDCPC DESC LIMIT 20"
        ]
      }
    };
    
    // Validate SQL query
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
        return { error: `Dangerous keyword "${keyword}" detected` };
      }
    }

    // Determine dataset ID
    let datasetId: string;
    let datasetName: string;
    
    if (args.dataset === 'custom' && args.datasetId) {
      datasetId = args.datasetId;
      datasetName = 'custom';
    } else if (args.dataset && databases[args.dataset]) {
      datasetId = databases[args.dataset];
      datasetName = args.dataset;
    } else {
      return { 
        error: 'Please specify a dataset',
        availableDatasets: Object.keys(databases),
        usage: 'Set dataset to one of the available datasets, or use dataset="custom" with a datasetId'
      };
    }

    // Show schema if requested
    if (args.showSchema && datasetName !== 'custom' && schemas[datasetName]) {
      return {
        dataset: datasetName,
        schema: schemas[datasetName],
        datasetId
      };
    }

    try {
      // Apply limit
      const limit = Math.min(args.limit || 100, 1000);
      let sql = args.sql;
      
      // Add LIMIT if not present
      if (!sql.toUpperCase().includes('LIMIT')) {
        sql += ` LIMIT ${limit}`;
      }
      
      const results = await domoClient.executeQuery(datasetId, sql);
      const formatted = formatResults(results, limit);
      
      return {
        ...formatted,
        query: args.sql,
        dataset: datasetName,
        datasetId
      };
    } catch (error: any) {
      // Provide helpful error messages
      let suggestion = '';
      
      if (error.message?.includes('Invalid column')) {
        suggestion = `Check column names. Use showSchema=true to see available columns.`;
      } else if (error.message?.includes('syntax error')) {
        suggestion = 'Check SQL syntax. Remember to use "dataset" as the table name.';
      }
      
      return {
        error: 'Query failed',
        message: error.message,
        suggestion,
        datasetId,
        query: args.sql,
        availableColumns: datasetName !== 'custom' && schemas[datasetName] ? schemas[datasetName].columns : []
      };
    }
  }
};