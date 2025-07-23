#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const instance = process.env.DOMO_INSTANCE;
const token = process.env.DOMO_ACCESS_TOKEN;
const productsId = process.env.DB_PRODUCTS || '60d384f1-b3cf-4d41-99ee-2fabfe861b12';

console.log('Testing with corrected column names...\n');

async function testCorrected() {
  try {
    // Test the exact query that product search would generate
    const query = `SELECT ASIN, TITLE, MANUFACTURER, BUYBOXPRICE, MONTHLYUNITSSOLD, RANK, REVIEWCOUNT, REVIEWRATING, CATEGORYBROWSENODEID, SUBCATEGORYRANK, IMAGEURL FROM dataset ORDER BY MONTHLYUNITSSOLD DESC LIMIT 5`;
    
    console.log('Testing product search query:');
    console.log(query);
    console.log('');
    
    const response = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
      { sql: query },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ Query successful!');
    console.log(`Found ${response.data.rows?.length || 0} products\n`);
    
    if (response.data.rows && response.data.rows.length > 0) {
      // Map the results to a more readable format
      const products = response.data.rows.map(row => ({
        asin: row[0],
        title: row[1]?.substring(0, 60) + '...',
        brand: row[2],
        price: row[3],
        monthlySales: row[4],
        rank: row[5],
        reviews: row[6],
        rating: row[7]
      }));
      
      console.log('Top selling products:');
      products.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.title}`);
        console.log(`   ASIN: ${p.asin}`);
        console.log(`   Brand: ${p.brand || 'N/A'}`);
        console.log(`   Price: $${p.price}`);
        console.log(`   Monthly Sales: ${p.monthlySales} units`);
        console.log(`   Rank: ${p.rank}`);
        console.log(`   Reviews: ${p.reviews} (${p.rating} stars)`);
      });
    }
    
    // Test with a filter
    console.log('\n\nTesting with price filter...');
    const filteredQuery = `SELECT ASIN, TITLE, BUYBOXPRICE, MONTHLYUNITSSOLD FROM dataset WHERE BUYBOXPRICE >= 50 AND BUYBOXPRICE <= 100 ORDER BY MONTHLYUNITSSOLD DESC LIMIT 5`;
    
    const filteredResponse = await axios.post(
      `https://${instance}.domo.com/api/query/v1/execute/${productsId}`,
      { sql: filteredQuery },
      {
        headers: {
          'X-DOMO-Developer-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ Filtered query successful!');
    console.log(`Found ${filteredResponse.data.rows?.length || 0} products between $50-$100`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testCorrected();