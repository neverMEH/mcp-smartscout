/**
 * Lightweight Domo client for Cloudflare Workers
 */

export class DomoClient {
  private instance: string;
  private accessToken: string;
  private baseUrl: string;

  constructor(instance: string, accessToken: string) {
    this.instance = instance;
    this.accessToken = accessToken;
    this.baseUrl = `https://${instance}.domo.com/api`;
  }

  async executeQuery(datasetId: string, sql: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/data/v1/datasets/query/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        datasetId,
        sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Domo API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data;
  }
}

// Query builder utilities
export class QueryBuilder {
  static buildSelectQuery(
    dataset: string,
    columns: string[],
    options: {
      filters?: Record<string, any>;
      limit?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    } = {}
  ): string {
    let query = `SELECT ${columns.join(', ')} FROM dataset`;
    
    // Add WHERE clause
    if (options.filters && Object.keys(options.filters).length > 0) {
      const conditions: string[] = [];
      
      for (const [column, value] of Object.entries(options.filters)) {
        if (value === null || value === undefined) continue;
        
        if (typeof value === 'object' && 'like' in value) {
          conditions.push(`${column} LIKE '${value.like}'`);
        } else if (typeof value === 'object' && 'min' in value) {
          conditions.push(`${column} >= ${value.min}`);
        } else if (typeof value === 'object' && 'max' in value) {
          conditions.push(`${column} <= ${value.max}`);
        } else {
          conditions.push(`${column} = '${value}'`);
        }
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    // Add ORDER BY
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }
    
    // Add LIMIT
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    return query;
  }
  
  static escapeValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    return `'${value.toString()}'`;
  }
}