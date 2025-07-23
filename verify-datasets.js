#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE || 'recommercebrands';
const token = process.env.DOMO_ACCESS_TOKEN || 'DDCIa8d82cba537ecf54032551681695985167811ebb95a8ea02';

console.log('Verifying Domo datasets...');
console.log('Instance:', instance);
console.log('Token (first 10 chars):', token.substring(0, 10) + '...');
console.log('');

// Expected dataset IDs from schema files
const expectedDatasets = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: '0b8c3541-3d9a-4c5b-bc6e-f72c7b2e1234',
  sellers: '7a5f8912-6d3e-4a2b-9c1d-e83f4b5c6789',
  searchTerms: '9e2c4d67-8f1a-4b3c-d5e6-1a7b9c3d4567',
  subcategories: '3f7a9b2c-5e8d-4c1b-a6f9-2d3e4f5a6b7c',
  sellerProducts: '8c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
  brandCoverages: '5b4c3d2e-1f0a-9b8c-7d6e-5f4a3b2c1d0e',
  coupons: '2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
  productHistories: '7f8e9d0c-1b2a-3c4d-5e6f-7a8b9c0d1e2f',
  brandCoverageHistories: '4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
  searchTermHistories: '1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
  searchTermProductOrganics: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  searchTermProductPaids: '6f5e4d3c-2b1a-0f9e-8d7c-6b5a4f3e2d1c',
  searchTermProductOrganicHistories: '3e2d1c0f-9a8b-7c6d-5e4f-3a2b1c0d9e8f',
  searchTermBrands: '0d9e8f7a-6b5c-4d3e-2f1a-0b9c8d7e6f5a',
  searchTermIntents: '8d7c6b5a-4f3e-2d1c-0f9a-8b7c6d5e4f3a',
  primeExclusiveOffers: '5a4f3e2d-1c0b-9a8f-7e6d-5c4b3a2f1e0d'
};

async function verifyDatasets() {
  console.log('Checking each expected dataset...\n');
  
  for (const [name, datasetId] of Object.entries(expectedDatasets)) {
    process.stdout.write(`${name.padEnd(30)} (${datasetId}): `);
    
    try {
      // Try to get dataset metadata
      const response = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${datasetId}?part=core`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      
      console.log(`✅ Found - "${response.data.name}" (${response.data.rowCount || 'N/A'} rows)`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Not found');
      } else if (error.response?.status === 403) {
        console.log('❌ Access denied');
      } else {
        console.log(`❌ Error: ${error.response?.status || error.message}`);
      }
    }
  }

  // Try to list actual datasets in the account
  console.log('\n\nSearching for SmartScout datasets in your Domo instance...\n');
  
  try {
    // Search for datasets with "smartscout" in the name
    const searchResponse = await axios.get(
      `https://${instance}.domo.com/api/data/v1/`,
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Accept': 'application/json'
        },
        params: {
          namelike: 'SMARTSCOUT',
          limit: 50
        }
      }
    );

    if (searchResponse.data && searchResponse.data.length > 0) {
      console.log(`Found ${searchResponse.data.length} datasets with "SMARTSCOUT" in the name:\n`);
      
      searchResponse.data.forEach(dataset => {
        console.log(`- ${dataset.name}`);
        console.log(`  ID: ${dataset.id}`);
        console.log(`  Rows: ${dataset.rowCount || 'N/A'}`);
        console.log(`  Last updated: ${dataset.lastUpdated ? new Date(dataset.lastUpdated).toISOString() : 'N/A'}`);
        console.log('');
      });

      // Generate updated dataset IDs configuration
      console.log('\n\nSuggested dataset ID updates for your configuration:\n');
      console.log('```typescript');
      console.log('export const DATASET_IDS = {');
      
      searchResponse.data.forEach(dataset => {
        const name = dataset.name.toLowerCase()
          .replace('smartscoutus.public.', '')
          .replace(/_/g, '');
        
        if (name in expectedDatasets) {
          console.log(`  ${name}: '${dataset.id}',`);
        }
      });
      
      console.log('};');
      console.log('```');
    } else {
      console.log('No datasets found with "SMARTSCOUT" in the name.');
    }
  } catch (error) {
    console.log('Could not search for datasets:', error.response?.status || error.message);
    
    // Try alternate search approach
    try {
      console.log('\nTrying alternate search...\n');
      const allDatasets = await axios.get(
        `https://${instance}.domo.com/api/data/v2/datasets`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          },
          params: {
            limit: 100
          }
        }
      );

      const smartscoutDatasets = allDatasets.data.filter(d => 
        d.name && d.name.toUpperCase().includes('SMARTSCOUT')
      );

      if (smartscoutDatasets.length > 0) {
        console.log(`Found ${smartscoutDatasets.length} SmartScout datasets:\n`);
        smartscoutDatasets.forEach(dataset => {
          console.log(`- ${dataset.name} (ID: ${dataset.id})`);
        });
      }
    } catch (altError) {
      console.log('Alternate search also failed:', altError.response?.status || altError.message);
    }
  }
}

verifyDatasets().catch(console.error);