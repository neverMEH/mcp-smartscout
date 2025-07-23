#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = process.env.DB_PRODUCTS || '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing if Domo uses positional columns...\n');

async function testPositional() {
  try {
    // Test 1: Try selecting by position
    console.log('1. Testing SELECT with column positions...');
    const queries = [
      'SELECT 1, 2, 3 FROM dataset LIMIT 1',  // Select column positions
      'SELECT * FROM dataset WHERE 2 = \'B0768Q4R2Z\' LIMIT 1',  // Filter by ASIN position
      'SELECT * FROM dataset ORDER BY 24 DESC LIMIT 5',  // Order by MONTHLYREVENUEESTIMATE position
    ];

    for (const sql of queries) {
      console.log(`\nTesting: ${sql}`);
      try {
        const response = await axios.post(
          `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
          { sql },
          {
            headers: {
              'X-DOMO-Developer-Token': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        console.log('✅ Query successful');
        if (response.data.rows && response.data.rows.length > 0) {
          console.log('   Result preview:', response.data.rows[0].slice(0, 5));
        }
      } catch (error) {
        console.log('❌ Query failed:', error.response?.data?.message);
      }
    }

    // Test 2: Check export endpoint which might have headers
    console.log('\n2. Testing export endpoint for column headers...');
    try {
      const exportResponse = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/export/${productsId}?includeHeader=true`,
        {
          sql: `SELECT * FROM dataset LIMIT 2`
        },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('✅ Export query successful');
      console.log('Column names from export:', exportResponse.data.columns);
      
      // If export has column names, let's test using them
      if (exportResponse.data.columns && exportResponse.data.columns.length > 0) {
        const colNames = exportResponse.data.columns;
        console.log('\n3. Testing with discovered column names...');
        
        // Try ASIN column
        const asinCol = colNames[1]; // Position 1 should be ASIN
        const titleCol = colNames[2]; // Position 2 should be TITLE
        
        const testSql = `SELECT ${asinCol}, ${titleCol} FROM dataset LIMIT 1`;
        console.log(`Testing: ${testSql}`);
        
        try {
          const namedResponse = await axios.post(
            `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
            { sql: testSql },
            {
              headers: {
                'X-DOMO-Developer-Token': token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          console.log('✅ Named columns work!');
        } catch (error) {
          console.log('❌ Named columns failed:', error.response?.data?.message);
        }
      }
      
    } catch (error) {
      console.log('❌ Export failed:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPositional();