#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const historyId = '48cb5956-1e16-4882-9e44-7f9d62cec04c';

console.log('Testing productHistories query with proper filtering...\n');

async function testHistoryQuery() {
  try {
    // Test the exact query our tool would generate
    const productId = '103542704';
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 30);
    const dateFilter = daysAgo.toISOString().split('T')[0];
    
    console.log(`Looking for PRODUCTID: ${productId}`);
    console.log(`Date filter: >= ${dateFilter}\n`);
    
    const sql = `SELECT DATE, BUYBOXPRICE, SALESRANK, ESTIMATEDUNITSALES, REVIEWS, RATING, NUMBEROFSELLERS FROM dataset WHERE PRODUCTID = '${productId}' AND DATE >= '${dateFilter}' ORDER BY DATE DESC LIMIT 30`;
    
    console.log('SQL:', sql, '\n');
    
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${historyId}?includeHeader=true`,
      { sql },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.data.columns) {
      console.log('✅ Query successful!');
      console.log(`Found ${response.data.rows.length} rows`);
      
      if (response.data.rows.length > 0) {
        console.log('\nFirst row:');
        response.data.columns.forEach((col, i) => {
          console.log(`  ${col}: ${response.data.rows[0][i]}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testHistoryQuery();