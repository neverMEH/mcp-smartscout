#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing Domo SQL functions...\n');

async function testQueries() {
  const queries = [
    {
      name: 'Simple aggregate',
      sql: 'SELECT COUNT(*) AS total, AVG(BUYBOXPRICE) AS avg_price FROM dataset LIMIT 1'
    },
    {
      name: 'With PERCENTILE_CONT',
      sql: 'SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY RANK) AS median_rank FROM dataset LIMIT 1'
    },
    {
      name: 'With MEDIAN function',
      sql: 'SELECT MEDIAN(RANK) AS median_rank FROM dataset LIMIT 1'
    },
    {
      name: 'With APPROX_PERCENTILE',
      sql: 'SELECT APPROX_PERCENTILE(RANK, 0.5) AS median_rank FROM dataset LIMIT 1'
    }
  ];
  
  for (const test of queries) {
    console.log(`Testing: ${test.name}`);
    console.log(`SQL: ${test.sql}`);
    
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