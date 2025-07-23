// This file exports only the tools that work with accessible datasets
import { productTools } from './product-tools.js';
import { brandTools } from './brand-tools.js';
import { sellerTools } from './seller-tools.js';
import { searchTools } from './search-tools.js';
import { analyticsTools } from './analytics-tools.js';

// Filter out tools that require inaccessible datasets
const DISABLED_TOOLS = [
  'smartscout_seller_products',     // Requires sellerProducts dataset
  'smartscout_brand_coverage',      // Requires brandCoverages dataset
  'smartscout_keyword_products',    // Requires searchTermProductOrganics/Paids
  'smartscout_product_keywords',    // Requires searchTermProductOrganics/Paids  
  'smartscout_seller_brands',       // Requires brandCoverages dataset
  'smartscout_keyword_brands'       // Uses searchTermBrands which doesn't exist
];

export const workingProductTools = productTools;

export const workingBrandTools = brandTools.filter(
  tool => !DISABLED_TOOLS.includes(tool.name)
);

export const workingSellerTools = sellerTools.filter(
  tool => !DISABLED_TOOLS.includes(tool.name)
);

export const workingSearchTools = searchTools.filter(
  tool => !DISABLED_TOOLS.includes(tool.name)
);

export const workingAnalyticsTools = analyticsTools;

// Export all working tools
export const allWorkingTools = [
  ...workingProductTools,
  ...workingBrandTools,
  ...workingSellerTools,
  ...workingSearchTools,
  ...workingAnalyticsTools
];