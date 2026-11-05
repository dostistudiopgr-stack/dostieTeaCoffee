import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionTitle  from '../common/SectionTitle';
import ProductCard   from '../product/ProductCard';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

// ─── Component ────────────────────────────────────────────────────────────────

const FeaturedProducts = () => {
  // Show up to 8 featured products
  useLocalDataRevision();
  const displayed = getAllProducts().filter((product) => product.isActive && product.isFeatured).slice(0, 8);

  if (!displayed.length) return null;

  return (
    <section
      className="py-16 sm:py-20 bg-white"
      aria-labelledby="featured-heading"
    >
      <div className="container max-w-7xl mx-auto px-6">
        {/* Heading */}
        <SectionTitle
          id="featured-heading"
          eyebrow="Customer Favourites"
          title="Our Best Sellers"
          subtitle="Customer favourites, made for your everyday moments."
          alignment="center"
          className="mb-12"
        />

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View all */}
        <div className="flex justify-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2.5
                       border border-[var(--brand-primary)] text-[var(--brand-primary)]
                       px-8 py-3.5 rounded-lg font-semibold text-sm
                       hover:bg-[var(--brand-primary)] hover:text-white
                       transition-all duration-200
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            View All Products
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
