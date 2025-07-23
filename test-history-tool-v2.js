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
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c'
};

const context = {
  domoClient,
  databases,
  QueryBuilder,
  formatResults
};

console.log('Testing Product History Tool in Detail\n');

async function testHistoryTool() {
  const historyTool = productTools.find(t => t.name === 'smartscout_product_history');
  
  console.log('Tool found:', historyTool.name);
  console.log('Testing with PRODUCTID: 103542704\n');
  
  try {
    console.log('Calling tool handler...');
    const result = await historyTool.handler({
      asin: '103542704',
      days: 30
    }, context);
    
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.history && result.history.results) {
      console.log(`\n✅ Success! Found ${result.history.count} history records`);
      console.log('Stats:', result.stats);
    } else if (result.message) {
      console.log(`\n⚠️  ${result.message}`);
    } else {
      console.log('\n❌ Unexpected result format');
    }
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Stack:', error.stack);
    
    // Try to understand the error
    if (error.response) {
      console.log('\nResponse data:', error.response.data);
    }
  }
}

testHistoryTool().catch(console.error);