/**
 * skuGenerator.ts — Automatic product-level SKU generation.
 *
 * Format: DTC-{CATEGORY}-{PRODUCT}-{NUMBER}
 * Examples: DTC-TEA-BLK-0001, DTC-COF-FLT-0001, DTC-TEA-MAS-0002
 *
 * Rules:
 * - SKU is generated once at product creation and never changes.
 * - NUMBER is sequential per {CATEGORY}-{PRODUCT} prefix.
 * - Uniqueness is guaranteed by scanning all existing product SKUs.
 * - Deleting a product does NOT free its SKU for reuse (the counter only goes up).
 */

import type { Product, ProductCategory } from '../types/Product';

// ─── Category code mapping ───────────────────────────────────────────────────

const CATEGORY_CODES: Record<ProductCategory, string> = {
  tea:          'TEA',
  coffee:       'COF',
  'green-tea':  'GRE',
  'herbal-tea': 'HRB',
  accessories:  'ACC',
};

// ─── Product name → 3-letter code ─────────────────────────────────────────────

/**
 * Extract a 3-letter product code from the product name.
 * Priority: first 3 consonants (BLK for Black, MAS for Masala).
 * Fallback: first 3 alpha characters.
 * If name is too short, pad with X.
 */
function productCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return 'XXX';

  // Try consonants first for better readability (BLK, MAS, FLT, GRN)
  const consonants = clean.replace(/[AEIOU]/g, '');
  const source = consonants.length >= 3 ? consonants : clean;

  let code = '';
  for (const ch of source) {
    if (code.length >= 3) break;
    code += ch;
  }

  // Pad with X if name is too short
  while (code.length < 3) code += 'X';

  return code;
}

// ─── Generate unique SKU ──────────────────────────────────────────────────────

/**
 * Generate a unique product-level SKU.
 *
 * @param name        Product name (e.g. "Black Tea Powder")
 * @param category    Product category (tea, coffee, green-tea)
 * @param existingSkus Set of all existing product SKUs to avoid duplicates
 * @returns A unique SKU string like "DTC-TEA-BLK-0001"
 */
export function generateProductSku(
  name: string,
  category: ProductCategory,
  existingSkus: Set<string>,
): string {
  const catCode   = CATEGORY_CODES[category] ?? 'GEN';
  const prodCode  = productCode(name);
  const prefix    = `DTC-${catCode}-${prodCode}-`;

  // Find the next sequential number for this prefix
  let maxNumber = 0;
  for (const sku of existingSkus) {
    if (sku.startsWith(prefix)) {
      const numPart = Number.parseInt(sku.slice(prefix.length), 10);
      if (Number.isFinite(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  }

  // Increment and format as 4-digit zero-padded
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Collect all existing product SKUs from the product list.
 * Includes variant SKUs too, to ensure global uniqueness.
 */
export function collectAllSkus(products: Product[]): Set<string> {
  const skus = new Set<string>();
  for (const product of products) {
    if (product.sku) skus.add(product.sku);
    for (const variant of product.variants) {
      if (variant.sku) skus.add(variant.sku.toUpperCase());
    }
  }
  return skus;
}

/**
 * Migrate existing products that don't have a product-level SKU.
 * Returns a new array with SKUs assigned. Does NOT change products that already have a SKU.
 */
export function migrateProductSkus(products: Product[]): Product[] {
  const existingSkus = collectAllSkus(products);
  let changed = false;
  const updated = products.map((product) => {
    if (product.sku) return product;
    const sku = generateProductSku(product.name, product.category, existingSkus);
    existingSkus.add(sku);
    changed = true;
    return { ...product, sku };
  });
  return changed ? updated : products;
}
