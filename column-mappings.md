# Column Mappings

Based on the actual Domo dataset, here are the column mappings needed:

## Products Table

Expected in tools → Actual in Domo:
- ASIN → ASIN ✓
- TITLE → TITLE ✓
- BRAND → (not found - need to check BRANDID)
- PRICE → BUYBOXPRICE
- MONTHLYSALES → MONTHLYUNITSSOLD
- SALESRANK → RANK
- REVIEWCOUNT → REVIEWCOUNT ✓
- RATING → REVIEWRATING
- CATEGORY → CATEGORYBROWSENODEID
- SUBCATEGORY → SUBCATEGORYRANK (or need different approach)
- IMAGES → IMAGEURL

## Missing expected columns:
- BRAND (only have BRANDID)
- CATEGORY name (only have CATEGORYBROWSENODEID)
- SUBCATEGORY name

## Additional columns available:
- ID
- COLOR
- SIZE
- PARENTASIN
- MODEL
- MANUFACTURER
- And many more...