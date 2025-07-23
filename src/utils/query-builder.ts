import { QueryOptions } from '../types/smartscout.js';

export class QueryBuilder {
  private static readonly MAX_RESULTS = 1000; // Token limit management
  private static readonly DEFAULT_LIMIT = 100;

  static buildSelectQuery(
    datasetId: string,
    columns: string[] = ['*'],
    options: QueryOptions = {}
  ): string {
    const {
      limit = this.DEFAULT_LIMIT,
      offset = 0,
      orderBy,
      orderDirection = 'DESC',
      filters = {}
    } = options;

    // Ensure we don't exceed token limits
    const safeLimit = Math.min(limit, this.MAX_RESULTS);

    // Use 'dataset' as the table name for Domo queries
    let query = `SELECT ${columns.join(', ')} FROM dataset`;

    // Add WHERE clauses
    const whereConditions = this.buildWhereConditions(filters);
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy} ${orderDirection}`;
    }

    // Add LIMIT and OFFSET
    query += ` LIMIT ${safeLimit}`;
    if (offset > 0) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  }

  private static buildWhereConditions(filters: Record<string, any>): string[] {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        // Handle IN conditions
        const escapedValues = value.map(v => 
          typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
        );
        conditions.push(`${key} IN (${escapedValues.join(', ')})`);
      } else if (typeof value === 'object' && value !== null) {
        // Handle range conditions
        if ('min' in value && value.min !== null) {
          const minVal = typeof value.min === 'string' ? `'${value.min.replace(/'/g, "''")}'` : value.min;
          conditions.push(`${key} >= ${minVal}`);
        }
        if ('max' in value && value.max !== null) {
          const maxVal = typeof value.max === 'string' ? `'${value.max.replace(/'/g, "''")}'` : value.max;
          conditions.push(`${key} <= ${maxVal}`);
        }
        if ('like' in value) {
          conditions.push(`${key} LIKE '${value.like.replace(/'/g, "''")}'`);
        }
      } else if (typeof value === 'string') {
        // Handle string equality
        conditions.push(`${key} = '${value.replace(/'/g, "''")}'`);
      } else {
        // Handle numeric/boolean equality
        conditions.push(`${key} = ${value}`);
      }
    }

    return conditions;
  }

  static buildAggregateQuery(
    datasetId: string,
    aggregations: Record<string, string>,
    groupBy?: string[],
    filters: Record<string, any> = {},
    having?: string,
    options: QueryOptions = {}
  ): string {
    const selectColumns = Object.entries(aggregations)
      .map(([alias, expr]) => `${expr} AS ${alias}`);

    if (groupBy) {
      selectColumns.unshift(...groupBy);
    }

    let query = `SELECT ${selectColumns.join(', ')} FROM dataset`;

    // Add WHERE clauses
    const whereConditions = this.buildWhereConditions(filters);
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add GROUP BY
    if (groupBy && groupBy.length > 0) {
      query += ` GROUP BY ${groupBy.join(', ')}`;
    }

    // Add HAVING
    if (having) {
      query += ` HAVING ${having}`;
    }

    // Add ORDER BY
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'DESC'}`;
    }

    // Add LIMIT
    const limit = Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_RESULTS);
    query += ` LIMIT ${limit}`;

    return query;
  }

  static buildJoinQuery(
    primaryDatasetId: string,
    primaryAlias: string,
    joins: Array<{
      datasetId: string;
      alias: string;
      on: string;
      type?: 'INNER' | 'LEFT' | 'RIGHT';
    }>,
    columns: string[] = ['*'],
    options: QueryOptions = {}
  ): string {
    let query = `SELECT ${columns.join(', ')} FROM dataset ${primaryAlias}`;

    // Add joins
    for (const join of joins) {
      query += ` ${join.type || 'INNER'} JOIN dataset ${join.alias} ON ${join.on}`;
    }

    // Add WHERE clauses
    const whereConditions = this.buildWhereConditions(options.filters || {});
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'DESC'}`;
    }

    // Add LIMIT
    const limit = Math.min(options.limit || this.DEFAULT_LIMIT, this.MAX_RESULTS);
    query += ` LIMIT ${limit}`;

    if (options.offset && options.offset > 0) {
      query += ` OFFSET ${options.offset}`;
    }

    return query;
  }
}