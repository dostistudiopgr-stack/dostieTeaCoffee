import { useState, useMemo, useCallback } from 'react';
import { getMinPrice } from '../data/products';
import { getAllProducts } from '../utils/productStore';
import { useLocalDataRevision } from './useLocalDataRevision';
import type { Product, ProductCategory } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortOption =
  | 'featured'
  | 'bestselling'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'top-rated'
  | 'name-asc';

export type RatingFilter = 3 | 4 | 5;

export interface ShopFilters {
  category:     ProductCategory | 'all';
  search:       string;
  priceMin:     number;
  priceMax:     number;
  packSizes:    string[];       // e.g. ['100g', '250g']
  inStockOnly:  boolean | null; // null = any, true = in stock, false = out of stock
  minRating:    RatingFilter | null;
  sort:         SortOption;
}

const DEFAULT_FILTERS: ShopFilters = {
  category:    'all',
  search:      '',
  priceMin:    0,
  priceMax:    9999,
  packSizes:   [],
  inStockOnly: null,
  minRating:   null,
  sort:        'featured',
};

const ITEMS_PER_PAGE = 9;

// ─── Sorting comparator ───────────────────────────────────────────────────────

const sortFn = (sort: SortOption) => (a: Product, b: Product): number => {
  switch (sort) {
    case 'price-asc':
      return getMinPrice(a) - getMinPrice(b);
    case 'price-desc':
      return getMinPrice(b) - getMinPrice(a);
    case 'newest':
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case 'top-rated':
      return b.rating - a.rating;
    case 'name-asc':
      return a.name.localeCompare(b.name);
    case 'bestselling':
      return (b.tags.includes('bestseller') ? 1 : 0) - (a.tags.includes('bestseller') ? 1 : 0);
    case 'featured':
    default:
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShopFilters(initialCategory?: ProductCategory | 'all', initialSearch = '') {
  useLocalDataRevision();
  const allProducts = getAllProducts();
  const [filters, setFilters] = useState<ShopFilters>({
    ...DEFAULT_FILTERS,
    category: initialCategory ?? 'all',
    search: initialSearch,
  });
  const [page, setPage] = useState(1);

  // ── Derived: global price range from ALL products ──────────────────────────
  const globalPriceRange = useMemo(() => {
    const prices = allProducts.flatMap((p) => p.variants.map((v) => v.price));
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [allProducts]);

  // ── Available pack sizes from ALL products ─────────────────────────────────
  const availablePackSizes = useMemo(() => {
    const labels = new Set<string>();
    allProducts.forEach((p) => p.variants.forEach((v) => labels.add(v.label)));
    // Sort by weight value
    return [...labels].sort((a, b) => {
      const toG = (s: string) => {
        const n = parseFloat(s);
        return s.toLowerCase().includes('kg') ? n * 1000 : n;
      };
      return toG(a) - toG(b);
    });
  }, [allProducts]);

  // ── Filtered + sorted results ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return allProducts
      .filter((p) => {
        if (!p.isActive) return false;

        // Category
        if (filters.category !== 'all' && p.category !== filters.category) return false;

        // Search
        if (q) {
          const haystack = [
            p.name,
            p.description,
            p.shortDescription,
            p.category,
            p.subCategory ?? '',
            ...(p.tags ?? []),
            ...(p.flavorNotes ?? []),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        // Pack size filter — product must have AT LEAST ONE matching variant
        if (filters.packSizes.length > 0) {
          const hasVariant = p.variants.some((v) =>
            filters.packSizes.includes(v.label)
          );
          if (!hasVariant) return false;
        }

        // Price — use minimum variant price
        const minP = getMinPrice(p);
        if (minP < filters.priceMin || minP > filters.priceMax) return false;

        // Availability
        if (filters.inStockOnly === true) {
          const anyInStock = p.variants.some((v) => v.stock > 0);
          if (!anyInStock) return false;
        }
        if (filters.inStockOnly === false) {
          const allOutOfStock = p.variants.every((v) => v.stock === 0);
          if (!allOutOfStock) return false;
        }

        // Rating
        if (filters.minRating !== null && p.rating < filters.minRating) return false;

        return true;
      })
      .sort(sortFn(filters.sort));
  }, [filters, allProducts]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage    = Math.min(page, totalPages);
  const paginated   = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // ── Updaters (reset page on filter change) ─────────────────────────────────

  const setFilter = useCallback(
    <K extends keyof ShopFilters>(key: K, value: ShopFilters[K]) => {
      setFilters((f) => ({ ...f, [key]: value }));
      setPage(1);
    },
    []
  );

  const togglePackSize = useCallback((label: string) => {
    setFilters((f) => {
      const next = f.packSizes.includes(label)
        ? f.packSizes.filter((s) => s !== label)
        : [...f.packSizes, label];
      return { ...f, packSizes: next };
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback((keepCategory = false) => {
    setFilters((f) => ({
      ...DEFAULT_FILTERS,
      category: keepCategory ? f.category : 'all',
    }));
    setPage(1);
  }, []);

  // ── Active filter count (for mobile badge) ─────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category !== 'all')     n++;
    if (filters.search.trim())          n++;
    if (filters.packSizes.length > 0)   n++;
    if (filters.priceMin > 0)           n++;
    if (filters.priceMax < 9999)        n++;
    if (filters.inStockOnly !== null)   n++;
    if (filters.minRating !== null)     n++;
    return n;
  }, [filters]);

  return {
    filters,
    setFilter,
    togglePackSize,
    clearFilters,
    // results
    filtered,
    paginated,
    totalPages,
    page: safePage,
    setPage,
    totalCount: filtered.length,
    // meta
    globalPriceRange,
    availablePackSizes,
    activeFilterCount,
    ITEMS_PER_PAGE,
  };
}
