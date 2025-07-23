#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE || 'recommercebrands';
const token = process.env.DOMO_ACCESS_TOKEN || 'DDCIa8d82cba537ecf54032551681695985167811ebb95a8ea02';

console.log('Testing Domo connection...');
console.log('Instance:', instance);
console.log('Token (first 10 chars):', token.substring(0, 10) + '...');

async function testConnection() {
  try {
    // Test 1: Basic API connectivity
    console.log('\n1. Testing basic API connectivity...');
    const response = await axios.get(
      `https://${instance}.domo.com/api/content/v2/users/me`,
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Accept': 'application/json'
        }
      }
    );
    console.log('✅ API connection successful');
    console.log('User:', response.data.displayName || response.data.userName || 'Unknown');

    // Test 2: Check dataset access
    console.log('\n2. Testing dataset access...');
    const datasetId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12'; // products dataset
    
    try {
      const datasetResponse = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${datasetId}?part=core`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Dataset found:', datasetResponse.data.name);
      console.log('   Rows:', datasetResponse.data.rowCount);
      console.log('   Last updated:', new Date(datasetResponse.data.lastUpdated).toISOString());
    } catch (error) {
      console.log('❌ Dataset not accessible:', error.response?.status || error.message);
    }

    // Test 3: Check if dataset is indexed
    console.log('\n3. Checking if dataset is indexed...');
    try {
      const schemaResponse = await axios.get(
        `https://${instance}.domo.com/api/query/v1/datasources/${datasetId}/schema/indexed?includeHidden=false`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log('✅ Dataset is indexed');
      console.log('   Columns:', Object.keys(schemaResponse.data.columns || {}).length);
    } catch (error) {
      console.log('❌ Dataset is not indexed:', error.response?.status || error.message);
      
      if (error.response?.status === 404) {
        console.log('\n   Attempting to query dataset directly...');
        try {
          const queryResponse = await axios.post(
            `https://${instance}.domo.com/api/query/v1/execute/${datasetId}`,
            {
              sql: `SELECT * FROM \`${datasetId}\` LIMIT 1`
            },
            {
              headers: {
                'X-DOMO-Developer-Token': token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          console.log('✅ Direct query successful');
        } catch (queryError) {
          console.log('❌ Direct query failed:', queryError.response?.data?.message || queryError.message);
        }
      }
    }

    // Test 4: List available datasets
    console.log('\n4. Listing available datasets...');
    try {
      const datasetsResponse = await axios.get(
        `https://${instance}.domo.com/api/data/v1/`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          },
          params: {
            limit: 10
          }
        }
      );
      console.log('✅ Found', datasetsResponse.data.length, 'datasets');
      datasetsResponse.data.slice(0, 5).forEach(ds => {
        console.log(`   - ${ds.name} (${ds.id})`);
      });
    } catch (error) {
      console.log('❌ Could not list datasets:', error.response?.status || error.message);
    }

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testConnection();