#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment Variables Check\n');
console.log('='.repeat(50));

// Core variables
console.log('\nCore Configuration:');
console.log('DOMO_INSTANCE:', process.env.DOMO_INSTANCE || '❌ NOT SET');
console.log('DOMO_ACCESS_TOKEN:', process.env.DOMO_ACCESS_TOKEN ? '✅ SET (hidden)' : '❌ NOT SET');

// Dataset IDs
console.log('\nDataset IDs:');
const datasetVars = [
  'DB_PRODUCTS',
  'DB_BRANDS', 
  'DB_SELLERS',
  'DB_SEARCHTERMS',
  'DB_SUBCATEGORIES',
  'DB_SELLERPRODUCTS',
  'DB_BRANDCOVERAGES',
  'DB_COUPONS',
  'DB_PRODUCTHISTORIES',
  'DB_BRANDCOVERAGEHISTORIES',
  'DB_SEARCHTERMHISTORIES',
  'DB_SEARCHTERMPRODUCTORGANICS',
  'DB_SEARCHTERMPRODUCTPAIDS',
  'DB_SEARCHTERMPRODUCTORGANICHISTORIES',
  'DB_SEARCHTERMBRANDS',
  'DB_SEARCHTERMINTENTS',
  'DB_PRIMEEXCLUSIVEOFFERS'
];

datasetVars.forEach(varName => {
  const value = process.env[varName];
  const name = varName.replace('DB_', '').toLowerCase();
  if (value) {
    console.log(`${name.padEnd(30)} ${value}`);
  } else {
    console.log(`${name.padEnd(30)} ❌ NOT SET`);
  }
});

// Check if using defaults
console.log('\n' + '='.repeat(50));
console.log('\nNote: If dataset IDs are not set, the server will use default placeholder IDs.');
console.log('Only the products dataset (60d384f1-b3cf-4d41-99ee-2fabfe861b12) is confirmed to exist.');
console.log('\nTo fix this:');
console.log('1. Update your Claude Desktop config with the correct dataset IDs');
console.log('2. Restart Claude Desktop completely');
console.log('3. The MCP will then receive the updated environment variables');