#!/usr/bin/env node
import axios from 'axios';
import { QueryBuilder } from './dist/utils/query-builder.js';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing Market Analysis Query...\n');

// Generate the exact query the tool uses
const marketQuery = QueryBuilder.buildAggregateQuery(
  productsId,
  {
    total_products: 'COUNT(DISTINCT ASIN)',
    total_brands: 'COUNT(DISTINCT MANUFACTURER)',
    avg_price: 'AVG(BUYBOXPRICE)',
    total_revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
    avg_reviews: 'AVG(REVIEWCOUNT)',
    avg_rating: 'AVG(REVIEWRATING)',
    median_sales_rank: 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY RANK)'
  },
  undefined,
  {}
);

console.log('Generated query:');
console.log(marketQuery);
console.log('\n');

async function testQuery() {
  try {
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${productsId}?includeHeader=true`,
      { sql: marketQuery },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ Query successful!');
    console.log('Columns:', response.data.columns);
    console.log('Data:', response.data.rows[0]);
    
    // Now test the brand query
    console.log('\n\nTesting brand aggregation query...');
    
    const brandQuery = QueryBuilder.buildAggregateQuery(
      productsId,
      {
        product_count: 'COUNT(DISTINCT ASIN)',
        revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
        avg_price: 'AVG(BUYBOXPRICE)',
        avg_rating: 'AVG(REVIEWRATING)'
      },
      ['MANUFACTURER'],
      {},
      undefined,
      { limit: 10, orderBy: 'revenue', orderDirection: 'DESC' }
    );
    
    console.log('Generated brand query:');
    console.log(brandQuery);
    
    const brandResponse = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${productsId}?includeHeader=true`,
      { sql: brandQuery },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Brand query successful!');
    console.log('First brand:', brandResponse.data.rows[0]);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testQuery();