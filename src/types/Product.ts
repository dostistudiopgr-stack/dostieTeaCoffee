export type ProductCategory = 'tea' | 'coffee' | 'green-tea' | 'herbal-tea' | 'accessories';

export type ProductTag =
  | 'bestseller'
  | 'new'
  | 'organic'
  | 'premium'
  | 'sale'
  | 'limited-edition';

/** Phase 1: pouch only. Future: jar | container | gift-pack */
export type PackagingType = 'pouch' | 'jar' | 'container' | 'gift-pack';

// ─── Variant ──────────────────────────────────────────────────────────────────

export interface ProductVariant {
  id:              string;
  label:           string;           // e.g. "100g", "250g", "500g"
  weight:          number;           // grams
  price:           number;           // INR online selling price (shown to customers)
  compareAtPrice?: number;           // original / strike-through price
  sku:             string;
  stock:           number;
  // Admin-only pricing fields (never exposed to customer UI)
  purchaseCost?:   number;           // cost price — NEVER shown to customers
  offlinePrice?:   number;           // in-store / walk-in selling price
}

// ─── Review (sample/demo data) ────────────────────────────────────────────────

export interface ProductReview {
  id:        string;
  author:    string;
  location?: string;
  rating:    number;                 // 1–5
  title?:    string;
  body:      string;
  date:      string;                 // ISO or "YYYY-MM-DD"
  approved?: boolean;
}

// ─── Main Product ─────────────────────────────────────────────────────────────

export interface Product {
  // ── Core (required by all parts) ──────────────────────────────────────────
  id:               string;
  name:             string;
  slug:             string;
  description:      string;
  shortDescription: string;
  category:         ProductCategory;
  subCategory?:     string;
  tags:             ProductTag[];
  variants:         ProductVariant[];
  defaultVariantId: string;
  images:           string[];        // ordered list; first = primary
  thumbnail:        string;
  rating:           number;          // 1–5
  reviewCount:      number;
  isFeatured:       boolean;
  isActive:         boolean;
  createdAt:        string;          // ISO date string

  // ── Provenance / flavour (optional) ───────────────────────────────────────
  sku?:               string;           // auto-generated product-level SKU (DTC-TEA-BLK-0001)
  origin?:            string;
  flavorNotes?:       string[];
  brewingInstructions?: string;      // legacy; prefer howToPrepare

  // ── Product detail page fields (all optional — won't break Part 5) ────────
  packagingType?:         PackagingType;   // defaults to 'pouch' when omitted
  highlights?:            string[];        // bullet-point selling points
  ingredients?:           string;          // free-text ingredients list
  howToPrepare?:          string;          // step-by-step preparation
  storageInstructions?:   string;
  shelfLife?:             string;          // e.g. "18 months from manufacture"
  netWeight?:             string;          // e.g. "Varies by pack size"
  countryOfOrigin?:       string;

  // ── Sample reviews (demo data) ────────────────────────────────────────────
  reviews?:           ProductReview[];
}
