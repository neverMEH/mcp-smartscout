#!/usr/bin/env node
import { productTools } from './dist/tools/product-tools.js';
import { DomoClient } from './dist/utils/domo-client.js';
import { QueryBuilder } from './dist/utils/query-builder.js';
import { formatResults } from './dist/utils/format.js';
import dotenv from 'dotenv';

dotenv.config();

const domoClient = new DomoClient(
  process.env.DOMO_INSTANCE,
  process.env.DOMO_ACCESS_TOKEN
);

const databases = {
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c'
};

const context = {
  domoClient,
  databases,
  QueryBuilder,
  formatResults
};

console.log('Testing Product History Tool\n');

async function testHistoryTool() {
  // First, let's get a sample ASIN from the productHistories table
  const sampleQuery = `SELECT PRODUCTID FROM dataset LIMIT 1`;
  
  try {
    const sampleResult = await domoClient.executeQuery(databases.productHistories, sampleQuery);
    
    if (sampleResult && sampleResult.rows && sampleResult.rows.length > 0) {
      const sampleASIN = sampleResult.rows[0][0];
      console.log(`Found sample ASIN: ${sampleASIN}\n`);
      
      // Now test the product history tool
      const historyTool = productTools.find(t => t.name === 'smartscout_product_history');
      console.log('Testing product history tool...');
      
      const result = await historyTool.handler({
        asin: sampleASIN,
        days: 7
      }, context);
      
      console.log('\nResult:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.history && result.history.results) {
        console.log(`\n✅ Product history tool working! Found ${result.history.count} history records`);
      } else if (result.message) {
        console.log(`\n⚠️  ${result.message}`);
      }
    } else {
      console.log('No data found in productHistories table');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
  }
}

testHistoryTool().catch(console.error);