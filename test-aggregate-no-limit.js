#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing aggregate queries with and without LIMIT...\n');

async function testQueries() {
  const queries = [
    {
      name: 'Aggregate WITH LIMIT',
      sql: 'SELECT COUNT(DISTINCT ASIN) AS total_products, AVG(BUYBOXPRICE) AS avg_price FROM dataset LIMIT 100'
    },
    {
      name: 'Aggregate WITHOUT LIMIT',
      sql: 'SELECT COUNT(DISTINCT ASIN) AS total_products, AVG(BUYBOXPRICE) AS avg_price FROM dataset'
    },
    {
      name: 'Complex aggregate WITHOUT LIMIT',
      sql: 'SELECT COUNT(DISTINCT ASIN) AS total_products, COUNT(DISTINCT MANUFACTURER) AS total_brands, AVG(BUYBOXPRICE) AS avg_price, SUM(MONTHLYUNITSSOLD * BUYBOXPRICE) AS total_revenue, AVG(REVIEWCOUNT) AS avg_reviews, AVG(REVIEWRATING) AS avg_rating, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY RANK) AS median_sales_rank FROM dataset'
    }
  ];
  
  for (const test of queries) {
    console.log(`Testing: ${test.name}`);
    console.log(`SQL: ${test.sql.substring(0, 100)}...`);
    
    try {
      const response = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/export/${productsId}?includeHeader=true`,
        { sql: test.sql },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('✅ Success');
      console.log('Result:', response.data.rows[0]);
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.message || error.message);
    }
    
    console.log('---\n');
  }
}

testQueries();