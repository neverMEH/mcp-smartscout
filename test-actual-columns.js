#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;

console.log('Testing actual column names in each dataset...\n');

const datasets = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6',
  brandCoverages: '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c44' // Testing with extra 4
};

async function testColumns() {
  for (const [name, datasetId] of Object.entries(datasets)) {
    console.log(`\n${name.toUpperCase()} Dataset (${datasetId}):`);
    console.log('='.repeat(60));
    
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
      
      if (response.data.columns) {
        console.log('Columns found:', response.data.columns.length);
        console.log('\nActual column names:');
        response.data.columns.forEach((col, i) => {
          console.log(`  ${i + 1}. ${col}`);
        });
        
        // Test specific queries
        console.log('\nTesting specific queries:');
        
        // Test case-sensitive queries
        const testQueries = {
          products: [
            `SELECT ASIN, TITLE, BUYBOXPRICE FROM dataset LIMIT 1`,
            `SELECT asin, title, buyboxprice FROM dataset LIMIT 1`
          ],
          brands: [
            `SELECT NAME, MONTHLYREVENUE FROM dataset LIMIT 1`,
            `SELECT BRAND, REVENUE FROM dataset LIMIT 1`
          ],
          sellers: [
            `SELECT AMAZONSELLERID, ESTIMATESALES FROM dataset LIMIT 1`,
            `SELECT SELLERID, MONTHLYREVENUE FROM dataset LIMIT 1`
          ],
          searchTerms: [
            `SELECT SEARCHTERMVALUE, ESTIMATESEARCHES FROM dataset LIMIT 1`,
            `SELECT SEARCHTERM, SEARCHVOLUME FROM dataset LIMIT 1`
          ]
        };
        
        if (testQueries[name]) {
          for (const query of testQueries[name]) {
            try {
              await axios.post(
                `https://${instance}.domo.com/api/query/v1/execute/${datasetId}`,
                { sql: query },
                {
                  headers: {
                    'X-DOMO-Developer-Token': token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  }
                }
              );
              console.log(`  ✅ ${query}`);
            } catch (error) {
              console.log(`  ❌ ${query} - ${error.response?.data?.message || 'Failed'}`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`❌ Failed to get columns: ${error.response?.data?.message || error.message}`);
    }
  }
}

testColumns().catch(console.error);