// Correct dataset IDs from your Domo instance
export const DATASET_IDS = {
  products: '60d384f1-b3cf-4d41-99ee-2fabfe861b12',
  brands: 'c11f0182-b5db-42f2-b838-be3b3ade707e',
  sellers: '06b5bef5-e639-442c-b632-3a1c02996f26',
  searchTerms: 'c697bdd5-760e-4102-98c1-3f9da094f6d6',
  subcategories: '716eea49-eaac-47fa-9f53-959eec2b8fff',
  sellerProducts: '9ebc08c5-06be-48ef-b767-ce30a5bd42fe',
  brandCoverages: '602fa4e9-4e0c-4f3b-b66f-4f2bd5263c44',
  coupons: 'dec8262e-01ca-45ea-9f57-a6f49bfe9eb0',
  productHistories: '48cb5956-1e16-4882-9e44-7f9d62cec04c',
  brandCoverageHistories: '0fe65583-26a3-4ac5-8b99-1e2bb59eced5',
  searchTermHistories: 'a0e3e1c2-aa7e-4379-9db4-2a7e7055081a',
  searchTermProductOrganics: '0fe7342b-dc16-460d-8f62-ae50c3a17bcc',
  searchTermProductPaids: 'eac3c770-a0d6-4051-9713-28cd852e836f',
  searchTermProductOrganicHistories: '0fe7342b-dc16-460d-8f62-ae50c3a17bcc',
  searchTermBrands: '0280b6b0-679f-46ee-adff-af88cebb902d',
  searchTermIntents: 'e49736ae-6757-4073-bc4a-894f14a21672',
  primeExclusiveOffers: '48fd4ff2-9109-41c5-a975-59f95a9598df'
} as const;

// Table name mappings for queries (using dataset IDs with backticks)
export const TABLE_NAMES = {
  products: `\`${DATASET_IDS.products}\``,
  brands: `\`${DATASET_IDS.brands}\``,
  sellers: `\`${DATASET_IDS.sellers}\``,
  searchTerms: `\`${DATASET_IDS.searchTerms}\``,
  subcategories: `\`${DATASET_IDS.subcategories}\``,
  sellerProducts: `\`${DATASET_IDS.sellerProducts}\``,
  brandCoverages: `\`${DATASET_IDS.brandCoverages}\``,
  coupons: `\`${DATASET_IDS.coupons}\``,
  productHistories: `\`${DATASET_IDS.productHistories}\``,
  brandCoverageHistories: `\`${DATASET_IDS.brandCoverageHistories}\``,
  searchTermHistories: `\`${DATASET_IDS.searchTermHistories}\``,
  searchTermProductOrganics: `\`${DATASET_IDS.searchTermProductOrganics}\``,
  searchTermProductPaids: `\`${DATASET_IDS.searchTermProductPaids}\``,
  searchTermProductOrganicHistories: `\`${DATASET_IDS.searchTermProductOrganicHistories}\``,
  searchTermBrands: `\`${DATASET_IDS.searchTermBrands}\``,
  searchTermIntents: `\`${DATASET_IDS.searchTermIntents}\``,
  primeExclusiveOffers: `\`${DATASET_IDS.primeExclusiveOffers}\``
} as const;