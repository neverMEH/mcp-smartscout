import axios, { AxiosInstance } from 'axios';

export interface DomoQueryResult {
  columns?: Array<{ [key: string]: any }>;
  rows?: Array<Array<any>>;
  [key: string]: any;
}

export interface DomoDatasetMetadata {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  lastUpdated: number;
  owner?: {
    id: string;
    name: string;
  };
  properties?: any;
}

export class DomoClient {
  private client: AxiosInstance;
  private instance: string;

  constructor(instance: string, accessToken: string) {
    this.instance = instance;
    this.client = axios.create({
      baseURL: `https://${instance}.domo.com`,
      headers: {
        'X-DOMO-Developer-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
  }

  async executeQuery(datasetId: string, sql: string): Promise<DomoQueryResult> {
    try {
      const response = await this.client.post(
        `/api/query/v1/execute/${datasetId}`,
        { sql }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Handle "No indexed schema" error
      if (error.response?.data?.message?.includes('No indexed schema')) {
        // Try to get dataset info and check if it needs indexing
        try {
          const metadata = await this.getDatasetMetadata(datasetId);
          throw new Error(
            `Dataset "${metadata.name}" (${datasetId}) is not indexed. ` +
            `It has ${metadata.rowCount} rows and was last updated ${new Date(metadata.lastUpdated).toISOString()}. ` +
            `The dataset may need to be indexed in Domo before querying.`
          );
        } catch (metaError) {
          throw new Error(
            `Dataset ${datasetId} is not indexed or accessible. ` +
            `Original error: ${error.response?.data?.message || error.message}`
          );
        }
      }
      
      throw new Error(`Query failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDatasetMetadata(datasetId: string): Promise<DomoDatasetMetadata> {
    try {
      const response = await this.client.get(
        `/api/data/v3/datasources/${datasetId}?part=core`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get dataset metadata: ${error.response?.data?.message || error.message}`);
    }
  }

  async getDatasetSchema(datasetId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/query/v1/datasources/${datasetId}/schema/indexed?includeHidden=false`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get dataset schema: ${error.response?.data?.message || error.message}`);
    }
  }

  async indexDataset(datasetId: string): Promise<any> {
    try {
      console.error(`Attempting to index dataset ${datasetId}...`);
      const response = await this.client.post(
        `/api/data/v3/datasources/${datasetId}/indexes`,
        { dataIds: [] }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to index dataset: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkDatasetStatus(datasetId: string): Promise<{
    exists: boolean;
    indexed: boolean;
    metadata?: DomoDatasetMetadata;
    schema?: any;
  }> {
    let exists = false;
    let indexed = false;
    let metadata: DomoDatasetMetadata | undefined;
    let schema: any;

    try {
      metadata = await this.getDatasetMetadata(datasetId);
      exists = true;
    } catch (error) {
      return { exists: false, indexed: false };
    }

    try {
      schema = await this.getDatasetSchema(datasetId);
      indexed = true;
    } catch (error) {
      indexed = false;
    }

    return { exists, indexed, metadata, schema };
  }

  async makeApiCall(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data
      });
      
      return {
        status: response.status,
        headers: response.headers,
        data: response.data
      };
    } catch (error: any) {
      throw error;
    }
  }
}