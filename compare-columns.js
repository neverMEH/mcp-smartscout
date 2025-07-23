#!/usr/bin/env node
import fs from 'fs/promises';

async function compareColumns() {
  const actualColumns = JSON.parse(await fs.readFile('actual-columns.json', 'utf-8'));
  
  // Columns we're using in our code
  const codeColumns = {
    products: [
      'ASIN', 'TITLE', 'MANUFACTURER', 'BUYBOXPRICE', 'MONTHLYUNITSSOLD',
      'RANK', 'REVIEWCOUNT', 'REVIEWRATING', 'CATEGORYBROWSENODEID', 
      'SUBCATEGORYRANK', 'IMAGEURL', 'PRICE', 'MONTHLYSALES', 'SALESRANK',
      'RATING', 'BRAND', 'CATEGORY', 'SUBCATEGORY'
    ],
    brands: [
      'ID', 'NAME', 'MONTHLYREVENUE', 'TOTALPRODUCTS', 'MONTHGROWTH',
      'MONTHGROWTH12', 'AVGPRICE', 'REVIEWRATING', 'CATEGORYBROWSENODEID',
      'REVENUEGROWTH30', 'REVENUEGROWTH90', 'REVENUE30', 'REVENUE90',
      'BRAND', 'ASINCOUNT', 'REVENUE', 'AVGRATING', 'AVERAGERATING'
    ],
    sellers: [
      'ID', 'AMAZONSELLERID', 'NAME', 'BUSINESSNAME', 'NUMBERASINS',
      'ESTIMATESALES', 'LIFETIMERATINGSCOUNT', 'THIRTYDAYRATINGSCOUNT',
      'SUSPENDED', 'STARTEDSELLINGDATE', 'SELLERID', 'SELLERNAME',
      'ASINCOUNT', 'BRANDSCOUNT', 'MONTHLYREVENUE', 'MONTHLYREVENUE30',
      'MONTHLYREVENUE90', 'POSITIVEFEEDBACK', 'FEEDBACKCOUNT', 'ISUSPENDED'
    ],
    productHistories: [
      'DATE', 'BUYBOXPRICE', 'SALESRANK', 'ESTIMATEDUNITSALES', 'REVIEWS',
      'RATING', 'NUMBEROFSELLERS', 'PRODUCTID', 'PRICE', 'MONTHLYSALES',
      'REVIEWCOUNT', 'OFFERSCOUNT'
    ],
    searchTerms: [
      'SEARCHTERMVALUE', 'ESTIMATESEARCHES', 'ESTIMATEDCPC', 'SEARCHTERM'
    ]
  };
  
  console.log('Column Comparison Report\n');
  console.log('='.repeat(60));
  
  for (const [table, actualCols] of Object.entries(actualColumns)) {
    const codeCols = codeColumns[table] || [];
    
    console.log(`\n${table.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    // Find columns we use that don't exist
    const missingInActual = codeCols.filter(col => !actualCols.includes(col));
    
    // Find actual columns we're not using
    const notUsed = actualCols.filter(col => !codeCols.includes(col));
    
    console.log(`Actual columns: ${actualCols.length}`);
    console.log(`Used in code: ${codeCols.length}`);
    
    if (missingInActual.length > 0) {
      console.log(`\n❌ Columns used in code but NOT in actual table:`);
      missingInActual.forEach(col => console.log(`   - ${col}`));
    }
    
    if (notUsed.length > 0) {
      console.log(`\n📋 Available columns not being used:`);
      notUsed.forEach(col => console.log(`   - ${col}`));
    }
    
    if (missingInActual.length === 0) {
      console.log(`\n✅ All columns used in code exist in actual table`);
    }
  }
  
  // Generate column mapping corrections
  console.log('\n\n' + '='.repeat(60));
  console.log('REQUIRED FIXES');
  console.log('='.repeat(60));
  
  const fixes = {};
  
  for (const [table, actualCols] of Object.entries(actualColumns)) {
    const codeCols = codeColumns[table] || [];
    const missingInActual = codeCols.filter(col => !actualCols.includes(col));
    
    if (missingInActual.length > 0) {
      fixes[table] = {};
      
      missingInActual.forEach(col => {
        // Try to find a matching column
        let match = null;
        
        // Common mappings
        const mappings = {
          'PRICE': 'BUYBOXPRICE',
          'MONTHLYSALES': 'MONTHLYUNITSSOLD',
          'SALESRANK': 'RANK',
          'RATING': 'REVIEWRATING',
          'BRAND': 'MANUFACTURER',
          'CATEGORY': 'CATEGORYBROWSENODEID',
          'SUBCATEGORY': 'SUBCATEGORYRANK',
          'REVENUE': 'MONTHLYREVENUE',
          'ASINCOUNT': 'TOTALPRODUCTS',
          'AVGRATING': 'REVIEWRATING',
          'AVERAGERATING': 'REVIEWRATING',
          'SELLERID': 'AMAZONSELLERID',
          'SELLERNAME': 'NAME',
          'SEARCHTERM': 'SEARCHTERMVALUE'
        };
        
        if (mappings[col]) {
          match = mappings[col];
        }
        
        fixes[table][col] = match || 'NOT_FOUND';
      });
    }
  }
  
  if (Object.keys(fixes).length > 0) {
    console.log('\nColumn mapping fixes needed:');
    console.log(JSON.stringify(fixes, null, 2));
    
    await fs.writeFile('column-fixes.json', JSON.stringify(fixes, null, 2));
    console.log('\n📄 Column fixes saved to column-fixes.json');
  } else {
    console.log('\n✅ No column mapping fixes needed!');
  }
}

compareColumns().catch(console.error);