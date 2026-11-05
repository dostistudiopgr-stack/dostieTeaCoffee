import { useState, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, X, SlidersHorizontal, ChevronRight, Package,
} from 'lucide-react';
import { useShopFilters }  from '../../hooks/useShopFilters';
import FilterSidebar       from '../../components/product/FilterSidebar';
import SortDropdown        from '../../components/product/SortDropdown';
import ProductGrid         from '../../components/product/ProductGrid';
import Pagination          from '../../components/common/Pagination';
import type { ProductCategory } from '../../types';

// ─── Category tabs data ───────────────────────────────────────────────────────

const CATEGORY_TABS: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Products'      },
  { value: 'tea',       label: 'Tea Powders'       },
  { value: 'coffee',    label: 'Coffee Powders'    },
  { value: 'green-tea', label: 'Green Tea Powders' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const Shop = () => {
  const [searchParams]          = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput,      setSearchInput]      = useState(() => searchParams.get('q') ?? '');

  // Initialise with URL ?q= search param if present
  const urlQuery = searchParams.get('q') ?? '';

  const shop = useShopFilters('all', urlQuery);

  // Sync search input → filter (debounce-like: on every keystroke is fine here)
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    shop.setFilter('search', e.target.value);
  };

  const clearSearch = () => {
    setSearchInput('');
    shop.setFilter('search', '');
  };

  return (
    <div className="min-h-screen bg-[var(--brand-background)]" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Shop Banner ─────────────────────────────────────── */}
      <div className="bg-[var(--brand-primary)] py-10 sm:py-14">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-5">
            <Link to="/" className="text-white/60 text-xs hover:text-white
                                    transition-colors focus-visible:outline-none
                                    focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
              Home
            </Link>
            <ChevronRight size={12} className="text-white/40" aria-hidden="true" />
            <span className="text-white/90 text-xs font-medium">Shop</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end
                          justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-[var(--brand-accent)]" aria-hidden="true" />
                <span className="text-[var(--brand-accent)] text-xs font-semibold
                                 tracking-[0.15em] uppercase">
                  Sample Product Catalogue
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-semibold text-white leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Explore Our Powder Collection
              </h1>
              <p className="text-white/65 text-sm mt-2 max-w-xl leading-relaxed">
                Discover quality tea, coffee and green tea powders for your
                everyday moments.
              </p>
            </div>

            {/* Product count pill */}
            <div className="shrink-0 bg-white/10 border border-white/15
                            rounded-xl px-4 py-2.5 text-center">
              <p className="text-2xl font-bold text-white">
                {shop.totalCount}
              </p>
              <p className="text-xs text-white/60">Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category tabs ────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8E4D9] sticky top-16 z-20">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto
                          scrollbar-hide py-0.5" role="tablist">
            {CATEGORY_TABS.map(({ value, label }) => {
              const active = shop.filters.category === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => shop.setFilter('category', value)}
                  className={[
                    'shrink-0 px-4 py-3.5 text-sm font-medium whitespace-nowrap',
                    'border-b-2 transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--brand-accent)]',
                    active
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-[#73786F] hover:text-[#292D28]',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-6 py-8">

        {/* Search + toolbar row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2
                         text-[#73786F] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={handleSearch}
              placeholder="Search products, flavours, types…"
              aria-label="Search products"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E8E4D9]
                         rounded-xl text-sm text-[#292D28] placeholder:text-[#73786F]/70
                         focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2
                         focus:ring-[var(--brand-primary)]/10 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-[#73786F] hover:text-[#292D28] transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            aria-label="Open filters"
            className="lg:hidden flex items-center gap-2 bg-white border
                       border-[#E8E4D9] rounded-xl px-4 py-2.5 text-sm
                       font-medium text-[#292D28] hover:border-[var(--brand-primary)]/40
                       transition-colors shrink-0 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters
            {shop.activeFilterCount > 0 && (
              <span className="bg-[var(--brand-primary)] text-white text-[10px] font-bold
                               w-5 h-5 rounded-full flex items-center justify-center">
                {shop.activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <SortDropdown
            value={shop.filters.sort}
            onChange={(v) => shop.setFilter('sort', v)}
          />
        </div>

        {/* Active filter chips */}
        {shop.activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-[#73786F]">Active filters:</span>

            {shop.filters.category !== 'all' && (
              <Chip onRemove={() => shop.setFilter('category', 'all')}>
                {CATEGORY_TABS.find(c => c.value === shop.filters.category)?.label}
              </Chip>
            )}
            {shop.filters.search && (
              <Chip onRemove={clearSearch}>
                &ldquo;{shop.filters.search}&rdquo;
              </Chip>
            )}
            {shop.filters.packSizes.map((ps) => (
              <Chip key={ps} onRemove={() => shop.togglePackSize(ps)}>{ps}</Chip>
            ))}
            {shop.filters.minRating !== null && (
              <Chip onRemove={() => shop.setFilter('minRating', null)}>
                {shop.filters.minRating}★ &amp; above
              </Chip>
            )}
            {shop.filters.inStockOnly !== null && (
              <Chip onRemove={() => shop.setFilter('inStockOnly', null)}>
                {shop.filters.inStockOnly ? 'In Stock' : 'Out of Stock'}
              </Chip>
            )}
            {(shop.filters.priceMin > 0 || shop.filters.priceMax < 9999) && (
              <Chip onRemove={() => {
                shop.setFilter('priceMin', 0);
                shop.setFilter('priceMax', 9999);
              }}>
                ₹{shop.filters.priceMin} – ₹{shop.filters.priceMax === 9999 ? '∞' : shop.filters.priceMax}
              </Chip>
            )}

            <button
              type="button"
              onClick={() => shop.clearFilters(false)}
              className="text-xs text-red-500 hover:text-red-600 font-semibold
                         transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Result count */}
        <p className="text-sm text-[#73786F] mb-6">
          Showing{' '}
          <strong className="text-[#292D28]">
            {Math.min((shop.page - 1) * shop.ITEMS_PER_PAGE + 1, shop.totalCount)}–
            {Math.min(shop.page * shop.ITEMS_PER_PAGE, shop.totalCount)}
          </strong>
          {' '}of{' '}
          <strong className="text-[#292D28]">{shop.totalCount}</strong> products
        </p>

        {/* Sidebar + grid layout */}
        <div className="flex gap-8 items-start">
          <FilterSidebar
            filters={shop.filters}
            setFilter={shop.setFilter}
            togglePackSize={shop.togglePackSize}
            clearFilters={shop.clearFilters}
            activeFilterCount={shop.activeFilterCount}
            availablePackSizes={shop.availablePackSizes}
            globalPriceRange={shop.globalPriceRange}
            totalCount={shop.totalCount}
            mobileOpen={mobileFilterOpen}
            onMobileClose={() => setMobileFilterOpen(false)}
          />

          {/* Products */}
          <div className="flex-1 min-w-0">
            <ProductGrid
              products={shop.paginated}
              onClearFilters={() => shop.clearFilters(false)}
            />

            {/* Pagination */}
            {shop.totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <Pagination
                  currentPage={shop.page}
                  totalPages={shop.totalPages}
                  onPageChange={shop.setPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Filter chip ──────────────────────────────────────────────────────────────

const Chip = ({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1.5 bg-[var(--brand-primary)]/8
                   text-[var(--brand-primary)] text-xs font-medium px-3 py-1 rounded-full
                   border border-[var(--brand-primary)]/15">
    {children}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove filter"
      className="text-[var(--brand-primary)]/60 hover:text-[var(--brand-primary)] transition-colors
                 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-[var(--brand-accent)] rounded-full"
    >
      <X size={11} aria-hidden="true" />
    </button>
  </span>
);

export default Shop;
