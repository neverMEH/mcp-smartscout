#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE || 'recommercebrands';
const token = process.env.DOMO_ACCESS_TOKEN || 'DDCIa8d82cba537ecf54032551681695985167811ebb95a8ea02';

console.log('Finding SmartScout datasets in Domo...\n');

// The dataset names we expect based on the schema files
const expectedNames = [
  'SMARTSCOUTUS.PUBLIC.PRODUCTS',
  'SMARTSCOUTUS.PUBLIC.BRANDS',
  'SMARTSCOUTUS.PUBLIC.SELLERS',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMS',
  'SMARTSCOUTUS.PUBLIC.SUBCATEGORIES',
  'SMARTSCOUTUS.PUBLIC.SELLERPRODUCTS',
  'SMARTSCOUTUS.PUBLIC.BRANDCOVERAGES',
  'SMARTSCOUTUS.PUBLIC.COUPONS',
  'SMARTSCOUTUS.PUBLIC.PRODUCTHISTORIES',
  'SMARTSCOUTUS.PUBLIC.BRANDCOVERAGEHISTORIES',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMHISTORIES',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTORGANICS',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTPAIDS',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTORGANICHISTORIES',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMBRANDS',
  'SMARTSCOUTUS.PUBLIC.SEARCHTERMINTENTS',
  'SMARTSCOUTUS.PUBLIC.PRIMEEXCLUSIVEOFFERS'
];

async function findDatasets() {
  // Since we know the products dataset exists, let's use a different approach
  // Query the products dataset to see if we can get metadata about the schema
  const productsId = '60d384f1-b3cf-4d41-99ee-2fabfe861b12';
  
  try {
    console.log('1. Testing query on known products dataset...');
    const testResponse = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
      {
        sql: `SELECT 'test' as test FROM dataset LIMIT 1`
      },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    console.log('✅ Products dataset is queryable\n');
  } catch (error) {
    console.log('❌ Could not query products dataset:', error.response?.data?.message || error.message);
  }

  // Try to find datasets by testing common patterns
  console.log('2. Looking for other SmartScout datasets...\n');
  
  // Common UUID patterns for Domo datasets
  const datasetPatterns = [
    // Try sequential UUIDs based on products dataset
    '60d384f1-b3cf-4d41-99ee-2fabfe861b13',
    '60d384f1-b3cf-4d41-99ee-2fabfe861b14',
    '60d384f1-b3cf-4d41-99ee-2fabfe861b15',
    
    // Try other common patterns
    '60d384f2-b3cf-4d41-99ee-2fabfe861b12',
    '60d384f3-b3cf-4d41-99ee-2fabfe861b12',
  ];

  for (const testId of datasetPatterns) {
    try {
      const response = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${testId}?part=core`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log(`✅ Found dataset: ${response.data.name} (${testId})`);
    } catch (error) {
      // Silent fail - we're just probing
    }
  }

  // Check if we need to use a different API endpoint
  console.log('\n3. Checking available API endpoints...\n');
  
  const endpoints = [
    '/api/data/v1/datasets',
    '/api/data/v2/datasets',
    '/api/data/v3/datasets',
    '/api/content/v2/datasets',
    '/api/query/v1/datasources'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(
        `https://${instance}.domo.com${endpoint}`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          },
          params: { limit: 5 }
        }
      );
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`   Found ${response.data.length} datasets`);
        response.data.slice(0, 2).forEach(d => {
          console.log(`   - ${d.name || d.displayName || 'Unnamed'} (${d.id})`);
        });
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Status: ${error.response?.status || 'Error'}`);
    }
  }

  // Provide instructions for finding the dataset IDs
  console.log('\n\n📋 To find your SmartScout dataset IDs:\n');
  console.log('1. Log into your Domo instance at https://recommercebrands.domo.com');
  console.log('2. Navigate to the Data Center or Datasets section');
  console.log('3. Search for "SMARTSCOUT" to find all SmartScout datasets');
  console.log('4. Click on each dataset and look for the dataset ID in:');
  console.log('   - The URL (e.g., /datasources/60d384f1-b3cf-4d41-99ee-2fabfe861b12/details)');
  console.log('   - The dataset details page');
  console.log('5. Update the DATASET_IDS in dataset-ids.ts with the correct IDs\n');

  // Show what needs to be updated
  console.log('Expected dataset mapping:\n');
  expectedNames.forEach((name, index) => {
    const varName = name.split('.').pop().toLowerCase();
    console.log(`${varName}: 'YOUR-DATASET-ID-HERE', // ${name}`);
  });
}

findDatasets().catch(console.error);