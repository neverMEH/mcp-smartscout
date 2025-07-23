#!/usr/bin/env node
import { productTools } from './dist/tools/product-tools.js';
import { brandTools } from './dist/tools/brand-tools.js';
import { sellerTools } from './dist/tools/seller-tools.js';
import { searchTools } from './dist/tools/search-tools.js';
import { analyticsTools } from './dist/tools/analytics-tools.js';
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
  sellerProducts: '37c7c8f6-c6ba-462f-8d30-5c33e0a87833',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6',
  searchTermProductOrganics: '1709e8cf-8da1-4b1c-be62-3bef5e6e5b93',
  searchTermProductPaids: '23de8a0f-0e7f-4a0e-910f-d969e388e4bf',
  searchTermBrands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  categories: 'a93e06f4-1cf0-4287-b0d0-f5aa6e21e53e',
  subcategories: '23aac0d0-fd41-4d09-abf8-d949c9c8a994',
  brandCoverages: '5e88c674-7529-4a97-a834-60797d0d17d4'
};

const context = {
  domoClient,
  databases,
  QueryBuilder,
  formatResults
};

console.log('Testing ALL Tools After Fixes\n');
console.log('='.repeat(60));

const allTools = [
  ...productTools,
  ...brandTools,
  ...sellerTools,
  ...searchTools,
  ...analyticsTools
];

async function testAllTools() {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  for (const tool of allTools) {
    console.log(`\nTesting: ${tool.name}`);
    
    try {
      let testArgs = {};
      
      // Set appropriate test arguments based on tool
      switch (tool.name) {
        case 'smartscout_product_search':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_product_details':
          testArgs = { asin: 'B08N5WRWNW' };
          break;
        case 'smartscout_product_history':
          // Use PRODUCTID we know exists
          testArgs = { asin: '103542704', days: 365 };
          break;
        case 'smartscout_top_products':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_brand_search':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_brand_details':
          testArgs = { brandId: '123' };
          break;
        case 'smartscout_top_brands':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_seller_search':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_seller_details':
          testArgs = { sellerId: 'A123' };
          break;
        case 'smartscout_seller_products':
          testArgs = { sellerId: 'A123', limit: 2 };
          break;
        case 'smartscout_seller_brands':
          testArgs = { sellerId: 'A123', limit: 2 };
          break;
        case 'smartscout_keyword_search':
          testArgs = { keyword: 'phone', limit: 2 };
          break;
        case 'smartscout_keyword_products':
          testArgs = { keyword: 'iphone', limit: 2 };
          break;
        case 'smartscout_product_keywords':
          testArgs = { asin: 'B08N5WRWNW', limit: 2 };
          break;
        case 'smartscout_keyword_brands':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_category_analytics':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_subcategory_analytics':
          testArgs = { limit: 2 };
          break;
        case 'smartscout_competitive_analysis':
          testArgs = { asin: 'B08N5WRWNW' };
          break;
        case 'smartscout_sales_estimates':
          testArgs = { asins: ['B08N5WRWNW'], period: 30 };
          break;
        case 'smartscout_brand_coverage':
          testArgs = { brandId: '123' };
          break;
        case 'smartscout_market_share':
          testArgs = { category: 'Electronics', limit: 2 };
          break;
      }
      
      const result = await tool.handler(testArgs, context);
      
      // Check if result indicates success
      if (result && (
        (result.results && result.results.length > 0) ||
        (result.count && result.count > 0) ||
        (result.organic) ||
        (result.paid) ||
        (result.history) ||
        result.asin ||
        result.keyword ||
        result.categories ||
        result.subcategories
      )) {
        console.log('  ✅ PASSED');
        results.passed++;
      } else if (result && result.message && (
        result.message.includes('not found') ||
        result.message.includes('No results')
      )) {
        console.log('  ⚠️  No data (but query worked)');
        results.passed++;
      } else {
        console.log('  ❌ FAILED - Unexpected result format');
        results.failed++;
        results.errors.push({
          tool: tool.name,
          error: 'Unexpected result format',
          result
        });
      }
      
    } catch (error) {
      console.log(`  ❌ FAILED - ${error.message}`);
      results.failed++;
      results.errors.push({
        tool: tool.name,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  Total tools: ${allTools.length}`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\nFAILED TOOLS:');
    results.errors.forEach(e => {
      console.log(`  - ${e.tool}: ${e.error}`);
    });
  }
}

testAllTools().catch(console.error);