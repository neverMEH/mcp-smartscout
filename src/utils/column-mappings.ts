// Column mappings from expected names to actual Domo column names

export const PRODUCT_COLUMNS = {
  // Direct matches (already correct)
  ASIN: 'ASIN',
  TITLE: 'TITLE',
  REVIEWCOUNT: 'REVIEWCOUNT',
  BUYBOXPRICE: 'BUYBOXPRICE',
  MONTHLYUNITSSOLD: 'MONTHLYUNITSSOLD',
  RANK: 'RANK',
  REVIEWRATING: 'REVIEWRATING',
  IMAGEURL: 'IMAGEURL',
  MANUFACTURER: 'MANUFACTURER',
  
  // Common aliases that need mapping
  PRICE: 'BUYBOXPRICE',
  MONTHLYSALES: 'MONTHLYUNITSSOLD',
  SALESRANK: 'RANK',
  RATING: 'REVIEWRATING',
  CATEGORY: 'CATEGORYBROWSENODEID',
  SUBCATEGORY: 'SUBCATEGORYRANK',
  IMAGES: 'IMAGEURL',
  BRAND: 'MANUFACTURER',
  REVENUE: 'MONTHLYREVENUEESTIMATE',
  
  // Additional product columns
  SELLERS: 'NUMBEROFSELLERS',
  FBA_SELLERS: 'NUMBERFBASELLERS',
  VARIATIONS: 'ISVARIATION',
  PARENT: 'PARENTASIN',
  DATE_LAUNCHED: 'DATELAUNCHED',
  DATE_SEEN: 'DATESEEN'
};

export const BRAND_COLUMNS = {
  // Direct matches
  NAME: 'NAME',
  MONTHLYREVENUE: 'MONTHLYREVENUE',
  MONTHLYUNITSSOLD: 'MONTHLYUNITSSOLD',
  REVIEWRATING: 'REVIEWRATING',
  
  // Common aliases
  BRAND: 'NAME',
  REVENUE: 'MONTHLYREVENUE',
  ASINCOUNT: 'TOTALPRODUCTS',
  AVGRATING: 'REVIEWRATING',
  REVENUEGROWTH30: 'MONTHGROWTH',
  REVENUEGROWTH90: 'MONTHGROWTH12',
  REVENUE30: 'MONTHLYREVENUE',  // May need adjustment
  REVENUE90: 'TRAILING12MONTHS',
  AVGPRICE: 'AVGPRICE',
  AVGREVIEWS: 'TOTALREVIEWS',
  AVERAGERATING: 'REVIEWRATING',
  ESTSALES: 'MONTHLYUNITSSOLD'
};

export const SELLER_COLUMNS = {
  // Direct matches
  AMAZONSELLERID: 'AMAZONSELLERID',
  NAME: 'NAME',
  ESTIMATESALES: 'ESTIMATESALES',
  NUMBERASINS: 'NUMBERASINS',
  
  // Common aliases
  SELLERID: 'AMAZONSELLERID',
  SELLERNAME: 'NAME',
  MONTHLYREVENUE: 'ESTIMATESALES',
  MONTHLYREVENUE30: 'ESTIMATESALES',  // May need adjustment
  MONTHLYREVENUE90: 'ESTIMATESALES',  // May need adjustment
  ASINCOUNT: 'NUMBERASINS',
  BUSINESSNAME: 'BUSINESSNAME',
  POSITIVEFEEDBACK: 'LIFETIMERATINGSCOUNT',  // Using as proxy
  FEEDBACKCOUNT: 'LIFETIMERATINGSCOUNT',
  ISUSPENDED: 'SUSPENDED',
  BRANDSCOUNT: 'NUMBERASINS'  // No direct brand count, using ASIN count as proxy
};

export const SEARCHTERM_COLUMNS = {
  // Direct matches
  SEARCHTERMVALUE: 'SEARCHTERMVALUE',
  ESTIMATESEARCHES: 'ESTIMATESEARCHES',
  ESTIMATEDCPC: 'ESTIMATEDCPC',
  
  // Common aliases
  SEARCHTERM: 'SEARCHTERMVALUE',
  SEARCHVOLUME: 'ESTIMATESEARCHES',
  SUGGESTEDMAXIMUMCPC: 'ESTIMATEDCPC',
  SEARCHFREQUENCYRANK: 'ESTIMATESEARCHES',  // Using as proxy
  ESTSALESTOTAL: 'ESTIMATESEARCHES'  // May need different calculation
};

// Function to map column names in queries
export function mapProductColumns(columns: string[]): string[] {
  return columns.map(col => {
    if (col === '*') return col;
    return PRODUCT_COLUMNS[col as keyof typeof PRODUCT_COLUMNS] || col;
  });
}

// Function to map filter keys
export function mapProductFilters(filters: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(filters)) {
    const mappedKey = PRODUCT_COLUMNS[key as keyof typeof PRODUCT_COLUMNS] || key;
    mapped[mappedKey] = value;
  }
  
  return mapped;
}