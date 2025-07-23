#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const historyId = '48cb5956-1e16-4882-9e44-7f9d62cec04c';

console.log('Checking productHistories table columns...\n');

async function checkHistoryColumns() {
  try {
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${historyId}?includeHeader=true`,
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
      console.log('ProductHistories columns:');
      response.data.columns.forEach((col, i) => {
        console.log(`  ${i + 1}. ${col}`);
      });
    }
  } catch (error) {
    console.log('Error:', error.response?.data?.message || error.message);
  }
}

checkHistoryColumns();