import type { Product } from '../../types';
import ProductCard    from './ProductCard';
import EmptyState     from '../common/EmptyState';
import { SkeletonCard } from '../common/Loader';
import { SearchX } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductGridProps {
  products:    Product[];
  loading?:    boolean;
  onClearFilters?: () => void;
  className?:  string;
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ProductGrid = ({
  products,
  loading    = false,
  onClearFilters,
  className  = '',
}: ProductGridProps) => {
  if (loading) return <SkeletonGrid />;

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <EmptyState
          icon={<SearchX size={36} strokeWidth={1.5} />}
          title="No products found"
          description="Try adjusting your filters or search term to find what you're looking for."
          action={
            onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                           text-sm font-semibold px-5 py-2.5 rounded-lg
                           hover:bg-[var(--brand-dark)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                Clear Filters
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div
      className={[
        'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6',
        className,
      ].join(' ')}
      aria-label={`${products.length} products`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
