#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const sellersId = '06b5bef5-e639-442c-b632-3a1c02996f26';

console.log('Checking sellers table columns...\n');

async function checkSellersColumns() {
  try {
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${sellersId}?includeHeader=true`,
      { sql: `SELECT * FROM dataset LIMIT 1` },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.data.columns) {
      console.log('Sellers table columns:');
      response.data.columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
      
      // Look for revenue/growth columns
      console.log('\nRevenue/Growth columns:');
      response.data.columns.forEach((col) => {
        if (col.toLowerCase().includes('revenue') || 
            col.toLowerCase().includes('growth') ||
            col.toLowerCase().includes('30') ||
            col.toLowerCase().includes('90')) {
          console.log(`  - ${col}`);
        }
      });
    }
  } catch (error) {
    console.log('Error:', error.response?.data?.message || error.message);
  }
}

checkSellersColumns();