#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE || 'recommercebrands';
const token = process.env.DOMO_ACCESS_TOKEN || 'DDCIa8d82cba537ecf54032551681695985167811ebb95a8ea02';
const datasetId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12'; // products dataset

console.log('Testing Domo query execution...');

async function testQuery() {
  try {
    // Test different query approaches
    console.log('\n1. Testing query with backticks around dataset ID...');
    try {
      const response = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/${datasetId}`,
        {
          sql: `SELECT * FROM \`${datasetId}\` LIMIT 5`
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
      console.log('Columns:', response.data.columns?.map(c => c.name || c).join(', '));
      console.log('Rows returned:', response.data.rows?.length || 0);
      if (response.data.rows && response.data.rows.length > 0) {
        console.log('Sample row:', response.data.rows[0]);
      }
    } catch (error) {
      console.log('❌ Query failed:', error.response?.data?.message || error.message);
    }

    // Test with table name
    console.log('\n2. Testing query with table name...');
    try {
      const response = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/${datasetId}`,
        {
          sql: `SELECT * FROM SMARTSCOUTUS.PUBLIC.PRODUCTS LIMIT 5`
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
      console.log('Columns:', response.data.columns?.map(c => c.name || c).join(', '));
      console.log('Rows returned:', response.data.rows?.length || 0);
    } catch (error) {
      console.log('❌ Query failed:', error.response?.data?.message || error.message);
    }

    // Test with just dataset name
    console.log('\n3. Testing query with just dataset name...');
    try {
      const response = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/${datasetId}`,
        {
          sql: `SELECT * FROM dataset LIMIT 5`
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
      console.log('Columns:', response.data.columns?.map(c => c.name || c).join(', '));
      console.log('Rows returned:', response.data.rows?.length || 0);
    } catch (error) {
      console.log('❌ Query failed:', error.response?.data?.message || error.message);
    }

    // Test getting schema details
    console.log('\n4. Getting dataset schema details...');
    try {
      const response = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${datasetId}/schemas/default`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Schema retrieved!');
      console.log('Schema:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Schema retrieval failed:', error.response?.status || error.message);
    }

    // Test dataset export endpoint
    console.log('\n5. Testing dataset export endpoint...');
    try {
      const response = await axios.post(
        `https://${instance}.domo.com/api/query/v1/execute/export/${datasetId}?includeHeader=true`,
        {
          sql: `SELECT * FROM dataset LIMIT 5`
        },
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Export query successful!');
      console.log('Response type:', typeof response.data);
      console.log('Response preview:', JSON.stringify(response.data).substring(0, 200) + '...');
    } catch (error) {
      console.log('❌ Export query failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testQuery();