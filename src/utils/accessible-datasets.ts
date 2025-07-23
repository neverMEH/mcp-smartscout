// Only datasets that are actually accessible in Domo
export const ACCESSIBLE_DATASETS = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e', 
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6'
};

// Datasets that are not indexed/accessible
export const INACCESSIBLE_DATASETS = {
  sellerProducts: '37c7c8f6-c6ba-462f-8d30-5c33e0a87833',
  searchTermProductOrganics: '1709e8cf-8da1-4b1c-be62-3bef5e6e5b93',
  searchTermProductPaids: '23de8a0f-0e7f-4a0e-910f-d969e388e4bf',
  categories: 'a93e06f4-1cf0-4287-b0d0-f5aa6e21e53e',
  subcategories: '23aac0d0-fd41-4d09-abf8-d949c9c8a994',
  brandCoverages: '5e88c674-7529-4a97-a834-60797d0d17d4',
  coupons: 'adcaf074-d861-4fc5-b4da-3c931b0ce3f7',
  brandCoverageHistories: '02f969d9-7378-4c41-9e12-a88be982ac5a',
  searchTermHistories: '8054c42f-f830-4262-8da4-d688d936b03f',
  searchTermProductOrganicHistories: '8dc97285-8da9-4b3a-9d94-3497b1b4ac51',
  searchTermIntents: '82795fb6-ae76-4a61-b3ba-c87c604a97e5',
  primeExclusiveOffers: '29c8b7e8-ce01-4f9e-89a9-bb853f7bfb40'
};