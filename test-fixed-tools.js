#!/usr/bin/env node
import { productTools } from './dist/tools/product-tools.js';
import { brandTools } from './dist/tools/brand-tools.js';
import { sellerTools } from './dist/tools/seller-tools.js';
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
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6'
};

const context = {
  domoClient,
  databases,
  QueryBuilder,
  formatResults
};

console.log('Testing Fixed Tools\n');
console.log('='.repeat(50));

async function testTools() {
  // Test 1: Product Search
  console.log('\n1. Testing Product Search:');
  try {
    const productSearch = productTools.find(t => t.name === 'smartscout_product_search');
    const result = await productSearch.handler({
      title: 'phone',
      limit: 3
    }, context);
    
    console.log('✅ Product search successful!');
    console.log(`   Found ${result.count || 0} products`);
    if (result.results && result.results.length > 0) {
      console.log(`   Sample: ${result.results[0].TITLE?.substring(0, 50)}...`);
    }
  } catch (error) {
    console.log('❌ Product search failed:', error.message);
  }

  // Test 2: Brand Search
  console.log('\n2. Testing Brand Search:');
  try {
    const brandSearch = brandTools.find(t => t.name === 'smartscout_brand_search');
    const result = await brandSearch.handler({
      brand: 'Amazon',
      limit: 3
    }, context);
    
    console.log('✅ Brand search successful!');
    console.log(`   Found ${result.count || 0} brands`);
    if (result.results && result.results.length > 0) {
      console.log(`   Sample: ${result.results[0].NAME}`);
    }
  } catch (error) {
    console.log('❌ Brand search failed:', error.message);
  }

  // Test 3: Seller Search
  console.log('\n3. Testing Seller Search:');
  try {
    const sellerSearch = sellerTools.find(t => t.name === 'smartscout_seller_search');
    const result = await sellerSearch.handler({
      minRevenue: 100000,
      limit: 3
    }, context);
    
    console.log('✅ Seller search successful!');
    console.log(`   Found ${result.count || 0} sellers`);
    if (result.results && result.results.length > 0) {
      console.log(`   Sample: ${result.results[0].NAME}`);
    }
  } catch (error) {
    console.log('❌ Seller search failed:', error.message);
  }

  // Test formatResults directly
  console.log('\n4. Testing formatResults with Domo response:');
  const mockDomoResponse = {
    columns: ['ID', 'NAME', 'VALUE'],
    rows: [
      [1, 'Test Item', 100],
      [2, 'Another Item', 200]
    ]
  };
  
  try {
    const formatted = formatResults(mockDomoResponse, 5);
    console.log('✅ formatResults working correctly!');
    console.log('   Formatted:', JSON.stringify(formatted, null, 2));
  } catch (error) {
    console.log('❌ formatResults failed:', error.message);
  }
}

testTools().catch(console.error);