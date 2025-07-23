#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;

console.log('Testing with updated environment variables...');
console.log('Instance:', instance);
console.log('Token present:', !!token);
console.log('Token length:', token ? token.length : 0);
console.log('');

async function testUpdatedConfig() {
  if (!instance || !token) {
    console.error('❌ Missing DOMO_INSTANCE or DOMO_ACCESS_TOKEN in environment');
    return;
  }

  try {
    // Test API connection
    console.log('1. Testing API connection...');
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
    console.log('   User:', response.data.displayName || response.data.userName || 'Unknown');

    // Test products dataset query
    console.log('\n2. Testing products dataset query...');
    const productsId = process.env.DB_PRODUCTS || '60d384f1-b3cf-4d41-99ee-2fabfe861b12';
    
    const queryResponse = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
      {
        sql: `SELECT ASIN, TITLE, PRICE FROM dataset LIMIT 3`
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
    if (queryResponse.data.rows && queryResponse.data.rows.length > 0) {
      console.log('   Sample product:', queryResponse.data.rows[0]);
    }

    // Check other dataset IDs if provided
    console.log('\n3. Checking other dataset IDs from environment...');
    const datasetEnvVars = Object.keys(process.env).filter(key => key.startsWith('DB_'));
    console.log(`   Found ${datasetEnvVars.length} dataset environment variables`);
    
    for (const envVar of datasetEnvVars.slice(0, 5)) { // Check first 5
      const datasetId = process.env[envVar];
      const name = envVar.replace('DB_', '').toLowerCase();
      
      try {
        const metaResponse = await axios.get(
          `https://${instance}.domo.com/api/data/v3/datasources/${datasetId}?part=core`,
          {
            headers: {
              'X-DOMO-Developer-Token': token,
              'Accept': 'application/json'
            }
          }
        );
        console.log(`   ✅ ${name}: Found "${metaResponse.data.name}"`);
      } catch (error) {
        console.log(`   ❌ ${name}: Not found (${datasetId})`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed - check your access token');
    }
  }
}

testUpdatedConfig();