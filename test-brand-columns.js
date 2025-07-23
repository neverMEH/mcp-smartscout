#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const brandsId = 'c11f0182-b5db-42f2-b838-be3b3ade707e';

console.log('Checking brands table columns...\n');

async function checkBrandColumns() {
  try {
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${brandsId}?includeHeader=true`,
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
      console.log('Brands table columns:');
      response.data.columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
      
      // Look for growth-related columns
      console.log('\nGrowth-related columns:');
      response.data.columns.forEach((col) => {
        if (col.toLowerCase().includes('growth') || 
            col.toLowerCase().includes('revenue') ||
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

checkBrandColumns();