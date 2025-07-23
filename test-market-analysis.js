#!/usr/bin/env node
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
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12'
};

const context = {
  domoClient,
  databases,
  QueryBuilder,
  formatResults
};

console.log('Testing Market Analysis Tool\n');

async function testMarketAnalysis() {
  const marketTool = analyticsTools.find(t => t.name === 'smartscout_market_analysis');
  
  console.log('Tool found:', marketTool.name);
  console.log('Testing without filters...\n');
  
  try {
    const result = await marketTool.handler({}, context);
    
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n✅ Success!');
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    
    // Let's try to understand the error by checking what query is generated
    console.log('\nGenerating test query to debug...');
    
    const testQuery = QueryBuilder.buildAggregateQuery(
      databases.products,
      {
        total_products: 'COUNT(DISTINCT ASIN)',
        total_brands: 'COUNT(DISTINCT MANUFACTURER)',
        avg_price: 'AVG(BUYBOXPRICE)',
        total_revenue: 'SUM(MONTHLYUNITSSOLD * BUYBOXPRICE)',
        avg_reviews: 'AVG(REVIEWCOUNT)',
        avg_rating: 'AVG(REVIEWRATING)',
        median_sales_rank: 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY RANK)'
      },
      undefined,
      {}
    );
    
    console.log('\nGenerated aggregate query:');
    console.log(testQuery);
  }
}

testMarketAnalysis().catch(console.error);