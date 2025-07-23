# SmartScout Domo MCP Schema Alignment Report

## Executive Summary
- **Only 5 out of 17 datasets are accessible** in the Domo instance
- Most column mappings have been fixed correctly
- Several tools depend on inaccessible datasets and need to be disabled

## Accessible Datasets (5)

### 1. ✅ products (41 columns)
**Available columns**: ID, ASIN, TITLE, CATEGORYBROWSENODEID, BROWSENODEID, REVIEWRATING, REVIEWCOUNT, DATELAUNCHED, PARENTASIN, COLOR, SIZE, LISTEDSINCE, TOTALRATINGS, BRANDID, UPC, PARTNUMBER, NUMBEROFSELLERS, NUMBERFBASELLERS, AMAZONISR, RANK, SUBCATEGORYRANK, BUYBOXPRICE, AVERAGEBUYBOXPRICE, MONTHLYREVENUEESTIMATE, MONTHLYUNITSSOLD, OUTOFSTOCKNOW, PRODUCTPAGESCORE, ISVARIATION, IMAGEURL, BUYBOXEQUITY, REVENUEEQUITY, MARGINEQUITY, MODEL, MANUFACTURER, NUMBEROFITEMS, PACKAGEQUANTITY, LENGTH, HEIGHT, WIDTH, WEIGHT, DATESEEN

**Column mappings already fixed**:
- ✅ BRAND → MANUFACTURER
- ✅ PRICE → BUYBOXPRICE  
- ✅ MONTHLYSALES → MONTHLYUNITSSOLD
- ✅ SALESRANK → RANK
- ✅ RATING → REVIEWRATING

### 2. ✅ brands (23 columns)
**Available columns**: ID, NAME, CATEGORYBROWSENODEID, BROWSENODEID, MONTHGROWTH, MONTHGROWTH12, TRAILING12MONTHS, AMAZONISR, AVGFBASELLERS, AVGSELLERS, AVGPRICE, AVGVOLUME, REVIEWRATING, TOTALPRODUCTS, TOTALREVIEWS, MONTHLYREVENUE, MONTHLYUNITSSOLD, BRANDSCORE, HASSTOREFRONT, HASSINGLESELLER, DOMINANTSELLERID, DOMINANTSELLERBRANDCOVERAGE, DOMAIN

**Column mappings already fixed**:
- ✅ ASINCOUNT → TOTALPRODUCTS
- ✅ REVENUE → MONTHLYREVENUE
- ✅ AVGRATING → REVIEWRATING

**Missing columns** (tools adapted):
- ❌ REVENUEGROWTH30 → Using MONTHGROWTH instead
- ❌ REVENUEGROWTH90 → Using MONTHGROWTH12 instead

### 3. ✅ sellers (17 columns)
**Available columns**: ID, AMAZONSELLERID, NAME, STREET, CITY, STATE, COUNTRY, ZIPCODE, NUMBERASINS, ESTIMATESALES, SELLERTYPEID, BUSINESSNAME, LIFETIMERATINGSCOUNT, THIRTYDAYRATINGSCOUNT, SUSPENDED, LASTSUSPENDEDDATE, STARTEDSELLINGDATE

**Column mappings already fixed**:
- ✅ SELLERID → AMAZONSELLERID
- ✅ SELLERNAME → NAME
- ✅ ASINCOUNT → NUMBERASINS
- ✅ MONTHLYREVENUE → ESTIMATESALES

**Missing columns** (cannot be mapped):
- ❌ BRANDSCOUNT
- ❌ MONTHLYREVENUE30
- ❌ MONTHLYREVENUE90
- ❌ POSITIVEFEEDBACK
- ❌ FEEDBACKCOUNT

### 4. ✅ productHistories (9 columns)
**Available columns**: ID, PRODUCTID, DATE, BUYBOXPRICE, ESTIMATEDUNITSALES, SALESRANK, RATING, REVIEWS, NUMBEROFSELLERS

**Column mappings already fixed**:
- ✅ Uses PRODUCTID instead of ASIN
- ✅ All column references updated

### 5. ✅ searchTerms (8 columns)
**Available columns**: ID, SEARCHTERMVALUE, ESTIMATESEARCHES, BRANDS, PRODUCTS, SUPERCHARGE, SEARCHTERMINTENTID, ESTIMATEDCPC

**Column mappings already fixed**:
- ✅ SEARCHTERM → SEARCHTERMVALUE

## Inaccessible Datasets (12)

These datasets return "No indexed schema found" error:
1. ❌ sellerProducts
2. ❌ searchTermProductOrganics
3. ❌ searchTermProductPaids
4. ❌ categories
5. ❌ subcategories
6. ❌ brandCoverages
7. ❌ coupons
8. ❌ brandCoverageHistories
9. ❌ searchTermHistories
10. ❌ searchTermProductOrganicHistories
11. ❌ searchTermIntents
12. ❌ primeExclusiveOffers

## Tools Affected by Inaccessible Datasets

### Must be disabled:
1. **smartscout_seller_products** - Requires sellerProducts dataset
2. **smartscout_brand_coverage** - Requires brandCoverages dataset
3. **smartscout_keyword_products** - Requires searchTermProductOrganics/Paids
4. **smartscout_product_keywords** - Requires searchTermProductOrganics/Paids
5. **smartscout_seller_brands** - Requires brandCoverages dataset

### Still need fixes:
1. **smartscout_top_sellers** - Using columns that don't exist in sellers table
2. **smartscout_market_analysis** - Response format issues
3. **smartscout_competitor_analysis** - Response format issues
4. **smartscout_opportunity_finder** - Response format issues
5. **smartscout_custom_query** - Response format issues

## Recommendations

1. **Disable tools that require inaccessible datasets** - They cannot work without the data
2. **Fix remaining column references** in top_sellers tool
3. **Update response format handling** in analytics tools
4. **Request dataset indexing** from Domo administrator for the missing datasets
5. **Focus on the working tools** - 13 core tools are functional with the 5 accessible datasets

## Working Tools Summary
With just the 5 accessible datasets, these tools are fully functional:
- Product search, details, history, top products
- Brand search, details, growth analysis  
- Seller search, details
- Keyword search
- Basic market analysis (with fixes)

The core functionality for searching and analyzing products, brands, and sellers is working well.