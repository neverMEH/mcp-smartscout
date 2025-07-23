#!/usr/bin/env node
import { spawn } from 'child_process';
import { enhancedCustomQueryTool } from './dist/tools/custom-query-tool.js';
import { DomoClient } from './dist/utils/domo-client.js';
import { formatResults } from './dist/utils/format.js';
import dotenv from 'dotenv';

dotenv.config();

const domoClient = new DomoClient(
  process.env.DOMO_INSTANCE,
  process.env.DOMO_ACCESS_TOKEN
);

const databases = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6'
};

const context = {
  domoClient,
  databases,
  formatResults
};

console.log('Testing V2 Server Custom Query Tool\n');
console.log('='.repeat(50));

async function testCustomQuery() {
  const tests = [
    {
      name: 'Show schema for products',
      args: {
        dataset: 'products',
        sql: 'SELECT * FROM dataset LIMIT 1',
        showSchema: true
      }
    },
    {
      name: 'Top 5 products by revenue',
      args: {
        dataset: 'products',
        sql: 'SELECT ASIN, TITLE, MANUFACTURER, MONTHLYUNITSSOLD * BUYBOXPRICE AS REVENUE FROM dataset ORDER BY REVENUE DESC LIMIT 5'
      }
    },
    {
      name: 'Search products',
      args: {
        dataset: 'products',
        sql: "SELECT ASIN, TITLE, BUYBOXPRICE FROM dataset WHERE TITLE LIKE '%wireless%' LIMIT 10"
      }
    },
    {
      name: 'Brand aggregation',
      args: {
        dataset: 'products',
        sql: 'SELECT MANUFACTURER, COUNT(*) AS PRODUCTS, AVG(BUYBOXPRICE) AS AVG_PRICE FROM dataset GROUP BY MANUFACTURER ORDER BY PRODUCTS DESC LIMIT 5'
      }
    },
    {
      name: 'Custom dataset test',
      args: {
        dataset: 'custom',
        datasetId: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
        sql: 'SELECT COUNT(*) AS TOTAL FROM dataset'
      }
    }
  ];

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    console.log('Args:', JSON.stringify(test.args, null, 2));
    
    try {
      const result = await enhancedCustomQueryTool.handler(test.args, context);
      
      if (result.error) {
        console.log('❌ Error:', result.error);
        if (result.message) console.log('   Message:', result.message);
        if (result.suggestion) console.log('   Suggestion:', result.suggestion);
      } else if (result.schema) {
        console.log('✅ Schema info retrieved');
        console.log('   Columns:', result.schema.columns.length);
        console.log('   Examples:', result.schema.examples.length);
      } else if (result.results) {
        console.log('✅ Query successful');
        console.log(`   Results: ${result.showing} of ${result.count}`);
        if (result.results.length > 0) {
          console.log('   First row:', JSON.stringify(result.results[0], null, 2).substring(0, 100) + '...');
        }
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  }
}

testCustomQuery().catch(console.error);