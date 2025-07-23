export const diagnosticTools = [
  {
    name: 'smartscout_dataset_status',
    description: 'Check the status and accessibility of SmartScout datasets in Domo',
    inputSchema: {
      type: 'object',
      properties: {
        datasetId: {
          type: 'string',
          description: 'Specific dataset ID to check (optional)'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases } = context;
      
      const results: any = {
        instance: process.env.DOMO_INSTANCE,
        tokenPresent: !!process.env.DOMO_ACCESS_TOKEN,
        datasets: {}
      };

      // List of all datasets to check
      const datasetList = args.datasetId 
        ? { [args.datasetId]: databases[Object.keys(databases).find(k => databases[k as keyof typeof databases] === args.datasetId) || 'unknown'] }
        : databases;

      for (const [name, id] of Object.entries(datasetList)) {
        try {
          // Try a simple query to check if dataset is accessible
          const testQuery = `SELECT 1 FROM \`${id}\` LIMIT 1`;
          await domoClient.executeQuery(id as string, testQuery);
          results.datasets[name] = {
            id: id,
            status: 'accessible',
            indexed: true
          };
        } catch (error: any) {
          results.datasets[name] = {
            id: id,
            status: 'error',
            indexed: false,
            error: error.message || 'Unknown error'
          };
        }
      }

      return results;
    }
  },

  {
    name: 'smartscout_test_query',
    description: 'Test a simple query against a specific dataset',
    inputSchema: {
      type: 'object',
      properties: {
        datasetName: {
          type: 'string',
          description: 'Dataset name (e.g., products, brands, sellers)',
          enum: ['products', 'brands', 'sellers', 'searchTerms', 'subcategories', 
                 'sellerProducts', 'brandCoverages', 'coupons', 'productHistories'],
          required: true
        },
        query: {
          type: 'string',
          description: 'SQL query to test (optional, defaults to SELECT * LIMIT 5)'
        }
      },
      required: ['datasetName']
    },
    handler: async (args: any, context: any) => {
      const { domoClient, databases } = context;
      
      const datasetId = databases[args.datasetName as keyof typeof databases];
      if (!datasetId) {
        return { error: 'Invalid dataset name' };
      }

      const query = args.query || `SELECT * FROM \`${datasetId}\` LIMIT 5`;
      
      try {
        const startTime = Date.now();
        const results = await domoClient.executeQuery(datasetId, query);
        const endTime = Date.now();
        
        return {
          success: true,
          datasetName: args.datasetName,
          datasetId: datasetId,
          query: query,
          rowCount: Array.isArray(results) ? results.length : 0,
          executionTime: `${endTime - startTime}ms`,
          sampleData: Array.isArray(results) ? results.slice(0, 3) : results,
          columns: Array.isArray(results) && results.length > 0 
            ? Object.keys(results[0]) 
            : []
        };
      } catch (error: any) {
        return {
          success: false,
          datasetName: args.datasetName,
          datasetId: datasetId,
          query: query,
          error: error.message || 'Unknown error',
          errorDetails: error.response?.data || error
        };
      }
    }
  },

  {
    name: 'smartscout_list_datasets',
    description: 'List all configured SmartScout datasets with their IDs',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    handler: async (args: any, context: any) => {
      const { databases } = context;
      
      const datasetList = Object.entries(databases).map(([name, id]) => ({
        name,
        id,
        envVar: `DB_${name.toUpperCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '')}`
      }));

      return {
        totalDatasets: datasetList.length,
        datasets: datasetList,
        domoInstance: process.env.DOMO_INSTANCE,
        note: 'These dataset IDs should match the database IDs in your Domo instance'
      };
    }
  },

  {
    name: 'smartscout_raw_api_test',
    description: 'Test raw Domo API endpoint to verify connectivity',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'API endpoint to test (e.g., /v1/datasets)',
          default: '/v1/datasets'
        }
      }
    },
    handler: async (args: any, context: any) => {
      const { domoClient } = context;
      
      try {
        // Try to make a direct API call
        const response = await domoClient.makeApiCall(
          args.endpoint || '/v1/datasets',
          'GET'
        );
        
        return {
          success: true,
          endpoint: args.endpoint || '/v1/datasets',
          statusCode: response.status || 200,
          data: response.data,
          headers: response.headers
        };
      } catch (error: any) {
        return {
          success: false,
          endpoint: args.endpoint || '/v1/datasets',
          error: error.message,
          statusCode: error.response?.status,
          errorData: error.response?.data
        };
      }
    }
  }
];