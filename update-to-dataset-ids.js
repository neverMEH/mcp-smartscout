import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Mapping of table names to use dataset IDs directly
const replacements = [
  // Products
  ['\'SMARTSCOUTUS.PUBLIC.PRODUCTS\'', 'databases.products'],
  ['"SMARTSCOUTUS.PUBLIC.PRODUCTS"', 'databases.products'],
  
  // Brands  
  ['\'SMARTSCOUTUS.PUBLIC.BRANDS\'', 'databases.brands'],
  ['"SMARTSCOUTUS.PUBLIC.BRANDS"', 'databases.brands'],
  
  // Sellers
  ['\'SMARTSCOUTUS.PUBLIC.SELLERS\'', 'databases.sellers'],
  ['"SMARTSCOUTUS.PUBLIC.SELLERS"', 'databases.sellers'],
  ['\'SMARTSCOUTUS.PUBLIC.SELLERS s\'', 'databases.sellers, \'s\''],
  
  // Search terms
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMS\'', 'databases.searchTerms'],
  ['"SMARTSCOUTUS.PUBLIC.SEARCHTERMS"', 'databases.searchTerms'],
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMS s\'', 'databases.searchTerms, \'s\''],
  
  // Subcategories
  ['\'SMARTSCOUTUS.PUBLIC.SUBCATEGORIES\'', 'databases.subcategories'],
  
  // Seller products
  ['\'SMARTSCOUTUS.PUBLIC.SELLERPRODUCTS\'', 'databases.sellerProducts'],
  ['\'SMARTSCOUTUS.PUBLIC.SELLERPRODUCTS sp\'', 'databases.sellerProducts, \'sp\''],
  
  // Brand coverages
  ['\'SMARTSCOUTUS.PUBLIC.BRANDCOVERAGES\'', 'databases.brandCoverages'],
  
  // Product histories
  ['\'SMARTSCOUTUS.PUBLIC.PRODUCTHISTORIES\'', 'databases.productHistories'],
  
  // Search term organics
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTORGANICS\'', 'databases.searchTermProductOrganics'],
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTORGANICS o\'', 'databases.searchTermProductOrganics, \'o\''],
  
  // Search term paids
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTPAIDS\'', 'databases.searchTermProductPaids'],
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTPAIDS s\'', 'databases.searchTermProductPaids, \'s\''],
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMPRODUCTPAIDS p\'', 'databases.searchTermProductPaids, \'p\''],
  
  // Search term brands
  ['\'SMARTSCOUTUS.PUBLIC.SEARCHTERMBRANDS\'', 'databases.searchTermBrands'],
  
  // For joins - update table references
  ['table: \'SMARTSCOUTUS.PUBLIC.PRODUCTS p\'', 'datasetId: databases.products, alias: \'p\''],
  ['table: \'SMARTSCOUTUS.PUBLIC.SELLERS s\'', 'datasetId: databases.sellers, alias: \'s\''],
  ['table: \'SMARTSCOUTUS.PUBLIC.SEARCHTERMS s\'', 'datasetId: databases.searchTerms, alias: \'s\'']
];

// Process all tool files
const toolsDir = './src/tools';
const files = readdirSync(toolsDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = join(toolsDir, file);
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply replacements
  for (const [oldText, newText] of replacements) {
    if (content.includes(oldText)) {
      content = content.replace(new RegExp(escapeRegExp(oldText), 'g'), newText);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

console.log('Dataset ID updates complete!');