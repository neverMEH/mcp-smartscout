#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const historyId = '48cb5956-1e16-4882-9e44-7f9d62cec04c';

console.log('Testing Product History Query...\n');

async function testProductHistory() {
  try {
    // Test the exact query the tool generates
    const productId = '103542704';
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - 30);
    const dateFilter = daysAgo.toISOString().split('T')[0];
    
    // The query our tool generates
    const sql = `SELECT DATE, BUYBOXPRICE, SALESRANK, ESTIMATEDUNITSALES, REVIEWS, RATING, NUMBEROFSELLERS FROM dataset WHERE PRODUCTID = '${productId}' AND DATE >= '${dateFilter}' ORDER BY DATE DESC LIMIT 30`;
    
    console.log('Generated SQL:', sql);
    console.log('\nProductID:', productId);
    console.log('Date filter:', dateFilter);
    
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
    
    console.log('\n✅ Query successful!');
    console.log(`Found ${response.data.rows.length} rows`);
  } catch (error) {
    console.log('\n❌ Error:', error.response?.data?.message || error.message);
    
    // Try a simpler query
    console.log('\nTrying simpler query without date filter...');
    
    try {
      const simpleSql = `SELECT DATE, BUYBOXPRICE, SALESRANK FROM dataset WHERE PRODUCTID = '103542704' LIMIT 5`;
      
      const simpleResponse = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/export/${historyId}?includeHeader=true`,
        { sql: simpleSql },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('✅ Simple query works!');
      console.log(`Found ${simpleResponse.data.rows.length} rows`);
      
      if (simpleResponse.data.rows.length > 0) {
        console.log('\nSample row:');
        console.log('DATE:', simpleResponse.data.rows[0][0]);
        console.log('BUYBOXPRICE:', simpleResponse.data.rows[0][1]);
        console.log('SALESRANK:', simpleResponse.data.rows[0][2]);
      }
    } catch (simpleError) {
      console.log('❌ Simple query also failed:', simpleError.response?.data?.message || simpleError.message);
    }
  }
}

testProductHistory();