#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;

// Dataset IDs from our configuration
const datasets = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  sellerProducts: '37c7c8f6-c6ba-462f-8d30-5c33e0a87833',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6',
  searchTermProductOrganics: '1709e8cf-8da1-4b1c-be62-3bef5e6e5b93',
  searchTermProductPaids: '23de8a0f-0e7f-4a0e-910f-d969e388e4bf',
  categories: 'a93e06f4-1cf0-4287-b0d0-f5aa6e21e53e',
  subcategories: '23aac0d0-fd41-4d09-abf8-d949c9c8a994',
  brandCoverages: '5e88c674-7529-4a97-a834-60797d0d17d4',
  coupons: 'adcaf074-d861-4fc5-b4da-3c931b0ce3f7',
  brandCoverageHistories: '02f969d9-7378-4c41-9e12-a88be982ac5a',
  searchTermHistories: '8054c42f-f830-4262-8da4-d688d936b03f',
  searchTermProductOrganicHistories: '8dc97285-8da9-4b3a-9d94-3497b1b4ac51',
  searchTermIntents: '82795fb6-ae76-4a61-b3ba-c87c604a97e5',
  primeExclusiveOffers: '29c8b7e8-ce01-4f9e-89a9-bb853f7bfb40'
};

console.log('Checking schemas for all SmartScout Domo datasets...\n');
console.log('='.repeat(60));

async function getDatasetColumns(datasetId, name) {
  try {
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/export/${datasetId}?includeHeader=true`,
      { sql: `SELECT * FROM dataset LIMIT 1` },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    return {
      name,
      datasetId,
      status: 'accessible',
      columns: response.data.columns || []
    };
  } catch (error) {
    return {
      name,
      datasetId,
      status: 'not_accessible',
      error: error.response?.data?.message || error.message,
      columns: []
    };
  }
}

async function checkAllSchemas() {
  const results = [];
  
  for (const [name, id] of Object.entries(datasets)) {
    console.log(`\nChecking ${name}...`);
    const result = await getDatasetColumns(id, name);
    results.push(result);
    
    if (result.status === 'accessible') {
      console.log(`✅ ${name}: ${result.columns.length} columns found`);
      console.log('   Columns:', result.columns.join(', '));
    } else {
      console.log(`❌ ${name}: ${result.error}`);
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const accessible = results.filter(r => r.status === 'accessible');
  const notAccessible = results.filter(r => r.status === 'not_accessible');
  
  console.log(`\nAccessible datasets: ${accessible.length}/${results.length}`);
  console.log('\nAccessible:');
  accessible.forEach(r => {
    console.log(`  ✅ ${r.name} - ${r.columns.length} columns`);
  });
  
  console.log('\nNot Accessible:');
  notAccessible.forEach(r => {
    console.log(`  ❌ ${r.name} - ${r.error}`);
  });
  
  // Save detailed results to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      accessible: accessible.length,
      notAccessible: notAccessible.length
    },
    datasets: results
  };
  
  await fs.writeFile(
    'schema-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to schema-report.json');
  
  // Generate column mapping file
  const columnMappings = {};
  accessible.forEach(dataset => {
    columnMappings[dataset.name] = dataset.columns;
  });
  
  await fs.writeFile(
    'actual-columns.json',
    JSON.stringify(columnMappings, null, 2)
  );
  
  console.log('📄 Column mappings saved to actual-columns.json');
}

checkAllSchemas().catch(console.error);