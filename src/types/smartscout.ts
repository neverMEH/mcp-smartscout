// SmartScout Database Schema Types

export interface Product {
  ASIN: string;
  TITLE?: string;
  IMAGES?: string;
  BRAND?: string;
  PRICE?: number;
  BUYBOXPRICE?: number;
  MONTHLYSALES?: number;
  SALESRANK?: number;
  REVIEWCOUNT?: number;
  RATING?: number;
  CATEGORY?: string;
  SUBCATEGORY?: string;
  WEIGHT?: number;
  PACKAGEHEIGHT?: number;
  PACKAGELENGTH?: number;
  PACKAGEWIDTH?: number;
  PRODUCTTYPE?: string;
  VARIATIONS?: number;
  OFFERS?: number;
  ISSUPPRESSED?: boolean;
  OFFERSHASADHOC?: boolean;
  SIZETYPE?: string;
  DATEAVAILABLE?: Date;
  MONTHLYSALESPRO30?: number;
  MONTHLYSALESPRO90?: number;
  SUBCATEGORYRANK?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface Brand {
  BRAND: string;
  ASINCOUNT?: number;
  AVGPRICE?: number;
  REVENUE?: number;
  ESTSALES?: number;
  AVGREVIEWS?: number;
  AVERAGERATING?: number;
  LOWPRICE?: number;
  HIGHPRICE?: number;
  REVENUE30?: number;
  REVENUE90?: number;
  REVENUEGROWTH30?: number;
  REVENUEGROWTH90?: number;
  REVENUE30GROWTH?: number;
  REVENUE90GROWTH?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface Seller {
  SELLERID: string;
  SELLERNAME?: string;
  BRANDNAME?: string;
  HEROIMAGE?: string;
  STRIPEIMAGE?: string;
  DESCRIPTION?: string;
  BUSINESSNAME?: string;
  BUSINESSADDRESS?: string;
  ASINCOUNT?: number;
  BRANDSCOUNT?: number;
  ISUSPENDED?: boolean;
  SUSPENSIONDATE?: Date;
  MONTHLYREVENUE?: number;
  MONTHLYREVENUE30?: number;
  MONTHLYREVENUE90?: number;
  POSITIVEFEEDBACK?: number;
  NEUTRALFEEDBACK?: number;
  NEGATIVEFEEDBACK?: number;
  FEEDBACKCOUNT?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface SearchTerm {
  SEARCHTERM: string;
  SEARCHVOLUME?: number;
  SEARCHFREQUENCYRANK?: number;
  ESTSALESTOTAL?: number;
  SUGGESTEDMAXIMUMCPC?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface SellerProduct {
  SELLERID: string;
  ASIN: string;
  BUYBOXPERCENT?: number;
  UNITPRICE?: number;
  ESTSALESUNITS?: number;
  REVENUE?: number;
  STOCKCOUNT?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface BrandCoverage {
  SELLERID: string;
  SELLERNAME?: string;
  BRAND: string;
  ASINCOUNT?: number;
  REVENUE?: number;
  OFFERS?: number;
  AVGBUYBOXPERCENT?: number;
  AVGPRICE?: number;
  AVGSTOCKCOUNT?: number;
  AVGREVIEWS?: number;
  REVPERCENTOFTOTAL?: number;
  ASINPERCENTOFTOTAL?: number;
  BUYBOXPERCENTOFTOTAL?: number;
  UNITS?: number;
  COUNTRY?: string;
  TIMESTAMP?: Date;
}

export interface ProductHistory {
  ASIN: string;
  PRICE?: number;
  BUYBOXPRICE?: number;
  SALESRANK?: number;
  MONTHLYSALES?: number;
  REVIEWCOUNT?: number;
  RATING?: number;
  OFFERSCOUNT?: number;
  OFFERSHASADHOC?: boolean;
  DATE: Date;
  COUNTRY?: string;
}

export interface OrganicSearchResult {
  SEARCHTERM: string;
  ASIN: string;
  POSITION?: number;
  DATE?: Date;
  COUNTRY?: string;
}

export interface PaidSearchResult {
  SEARCHTERM: string;
  ASIN: string;
  POSITION?: number;
  DATE?: Date;
  COUNTRY?: string;
}

// Query interfaces for type safety
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}