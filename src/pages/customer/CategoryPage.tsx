import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useShopFilters }  from '../../hooks/useShopFilters';
import FilterSidebar       from '../../components/product/FilterSidebar';
import SortDropdown        from '../../components/product/SortDropdown';
import ProductGrid         from '../../components/product/ProductGrid';
import Pagination          from '../../components/common/Pagination';
import type { ProductCategory } from '../../types';

// ─── Category metadata ────────────────────────────────────────────────────────

const META: Record<string, { heading: string; description: string; breadcrumb: string }> = {
  tea: {
    heading:    'Tea Powders',
    description:'Explore our range of premium tea powders — from bold Assam CTC to delicate Darjeeling dust, masala chai blends and more.',
    breadcrumb: 'Tea Powders',
  },
  coffee: {
    heading:    'Coffee Powders',
    description:'Discover South Indian filter coffee, single-origin Arabica, dark roast and instant coffee powders crafted for every coffee lover.',
    breadcrumb: 'Coffee Powders',
  },
  'green-tea': {
    heading:    'Green Tea Powders',
    description:'From Himalayan green tea and ceremonial matcha to organic blends and Ayurvedic herbal powders — find your everyday wellness cup.',
    breadcrumb: 'Green Tea Powders',
  },
};

const VALID_CATEGORIES: ProductCategory[] = ['tea', 'coffee', 'green-tea'];

// ─── Page ─────────────────────────────────────────────────────────────────────

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Validate slug
  const category: ProductCategory | 'all' =
    slug && VALID_CATEGORIES.includes(slug as ProductCategory)
      ? (slug as ProductCategory)
      : 'all';

  const meta = (slug && META[slug]) ?? {
    heading:    'All Products',
    description:'Browse our complete range of premium powder products.',
    breadcrumb: 'Products',
  };

  // Init hook with the category pre-seeded
  const shop = useShopFilters(category);

  // Sync category when slug changes (e.g. navigating tea→coffee)
  useEffect(() => {
    shop.setFilter('category', category);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="min-h-screen bg-[var(--brand-background)]" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Banner ───────────────────────────────────────────── */}
      <div className="bg-[var(--brand-dark)] py-10 sm:py-14">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-5">
            <Link to="/" className="text-white/60 text-xs hover:text-white
                                    transition-colors focus-visible:outline-none
                                    focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
              Home
            </Link>
            <ChevronRight size={12} className="text-white/40" aria-hidden="true" />
            <Link to="/shop" className="text-white/60 text-xs hover:text-white
                                        transition-colors focus-visible:outline-none
                                        focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
              Shop
            </Link>
            <ChevronRight size={12} className="text-white/40" aria-hidden="true" />
            <span className="text-white/90 text-xs font-medium">{meta.breadcrumb}</span>
          </nav>

          <h1
            className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {meta.heading}
          </h1>
          <p className="text-white/65 text-sm max-w-xl leading-relaxed">
            {meta.description}
          </p>
          <p className="text-white/40 text-xs mt-2">
            {shop.totalCount} product{shop.totalCount !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-[#73786F]">
            Showing{' '}
            <strong className="text-[#292D28]">
              {Math.min((shop.page - 1) * shop.ITEMS_PER_PAGE + 1, Math.max(shop.totalCount, 1))}–
              {Math.min(shop.page * shop.ITEMS_PER_PAGE, shop.totalCount)}
            </strong>
            {' '}of{' '}
            <strong className="text-[#292D28]">{shop.totalCount}</strong> products
          </p>

          <div className="flex items-center gap-3">
            {/* Mobile filter trigger */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-white border
                         border-[#E8E4D9] rounded-xl px-4 py-2.5 text-sm
                         font-medium text-[#292D28] hover:border-[var(--brand-primary)]/40
                         transition-colors focus-visible:outline-none
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

            <SortDropdown
              value={shop.filters.sort}
              onChange={(v) => shop.setFilter('sort', v)}
            />
          </div>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-6 pb-16">
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

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={shop.paginated}
              onClearFilters={() => shop.clearFilters(true)}
            />

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

export default CategoryPage;
