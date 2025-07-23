#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';
import { DATASET_IDS } from './dist/utils/dataset-ids.js';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;

console.log('Verifying all SmartScout datasets...\n');
console.log('Checking both hardcoded IDs and environment IDs:\n');

async function verifyAll() {
  // Get environment dataset IDs
  const envDatasets = {
    products: process.env.DB_PRODUCTS,
    brands: process.env.DB_BRANDS,
    sellers: process.env.DB_SELLERS,
    searchTerms: process.env.DB_SEARCHTERMS,
    subcategories: process.env.DB_SUBCATEGORIES,
    sellerProducts: process.env.DB_SELLERPRODUCTS,
    brandCoverages: process.env.DB_BRANDCOVERAGES,
    coupons: process.env.DB_COUPONS,
    productHistories: process.env.DB_PRODUCTHISTORIES,
    brandCoverageHistories: process.env.DB_BRANDCOVERAGEHISTORIES,
    searchTermHistories: process.env.DB_SEARCHTERMHISTORIES,
    searchTermProductOrganics: process.env.DB_SEARCHTERMPRODUCTORGANICS,
    searchTermProductPaids: process.env.DB_SEARCHTERMPRODUCTPAIDS,
    searchTermProductOrganicHistories: process.env.DB_SEARCHTERMPRODUCTORGANICHISTORIES,
    searchTermBrands: process.env.DB_SEARCHTERMBRANDS,
    searchTermIntents: process.env.DB_SEARCHTERMINTENTS,
    primeExclusiveOffers: process.env.DB_PRIMEEXCLUSIVEOFFERS
  };

  for (const [name, hardcodedId] of Object.entries(DATASET_IDS)) {
    const envId = envDatasets[name];
    
    console.log(`\n${name}:`);
    console.log(`  Hardcoded ID: ${hardcodedId}`);
    console.log(`  Environment ID: ${envId || 'NOT SET'}`);
    
    // Check if they match
    if (envId && envId !== hardcodedId) {
      console.log('  ⚠️  MISMATCH DETECTED!');
    }
    
    // Test the hardcoded ID
    try {
      const response = await axios.get(
        `https://${instance}.domo.com/api/data/v3/datasources/${hardcodedId}?part=core`,
        {
          headers: {
            'X-DOMO-Developer-Token': token,
            'Accept': 'application/json'
          }
        }
      );
      console.log(`  ✅ Hardcoded ID exists: "${response.data.name}"`);
      
      // Try a simple query
      try {
        const queryResponse = await axios.post(
          `https://${instance}.domo.com/api/query/v1/execute/${hardcodedId}`,
          { sql: `SELECT * FROM dataset LIMIT 1` },
          {
            headers: {
              'X-DOMO-Developer-Token': token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        console.log(`  ✅ Dataset is queryable`);
      } catch (qError) {
        console.log(`  ❌ Dataset exists but not queryable: ${qError.response?.data?.message}`);
      }
    } catch (error) {
      console.log(`  ❌ Hardcoded ID not found (${error.response?.status})`);
    }
  }
  
  console.log('\n\nSummary:');
  console.log('The MCP server is using the hardcoded IDs from dataset-ids.ts');
  console.log('These should match what\'s in your Domo instance.');
}

verifyAll().catch(console.error);