#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = process.env.DB_PRODUCTS || '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing column names in products dataset...\n');

async function testColumns() {
  try {
    // First, try a simple SELECT * to see what columns we get
    console.log('1. Testing SELECT * to discover columns...');
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
      {
        sql: `SELECT * FROM dataset LIMIT 1`
      },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ Query successful!');
    
    if (response.data.columns) {
      console.log('\nColumn names found:');
      response.data.columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col.name || col}`);
      });
    }
    
    if (response.data.rows && response.data.rows.length > 0) {
      console.log('\nFirst row data (showing first 10 values):');
      response.data.rows[0].slice(0, 10).forEach((value, index) => {
        const colName = response.data.columns ? response.data.columns[index]?.name || `Column ${index}` : `Column ${index}`;
        console.log(`  ${colName}: ${value}`);
      });
    }

    // Now test with lowercase column names
    console.log('\n2. Testing with lowercase column names...');
    try {
      const lcResponse = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
        {
          sql: `SELECT asin, title, price FROM dataset LIMIT 1`
        },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Lowercase column names work!');
    } catch (error) {
      console.log('❌ Lowercase column names failed:', error.response?.data?.message);
    }

    // Test with quoted column names
    console.log('\n3. Testing with quoted column names...');
    try {
      const quotedResponse = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
        {
          sql: `SELECT "ASIN", "TITLE", "PRICE" FROM dataset LIMIT 1`
        },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Quoted column names work!');
    } catch (error) {
      console.log('❌ Quoted column names failed:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testColumns();