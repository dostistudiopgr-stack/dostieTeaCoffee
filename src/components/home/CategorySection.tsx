import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SectionTitle from '../common/SectionTitle';
import { getAllCategories } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import ProductImage from '../product/ProductImage';

// ─── Fallback images per slug ─────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────
// Reads from shared categories data (merged with localStorage admin overrides).
// Respects: isActive, showOnHomepage, sortOrder.

const CategorySection = () => {
  useLocalDataRevision();
  const categories = getAllCategories()
    .filter((c) => c.isActive && (c.showOnHomepage !== false))
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

  if (categories.length === 0) return null;

  return (
    <section
      className="py-16 sm:py-20 bg-[var(--brand-background)]"
      aria-labelledby="categories-heading"
    >
      <div className="container max-w-7xl mx-auto px-6">
        {/* Heading */}
        <SectionTitle
          id="categories-heading"
          eyebrow="Our Collections"
          title="Explore Our Collections"
          subtitle="Find your perfect cup for every moment."
          alignment="center"
          className="mb-12"
        />

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat) => {
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl
                           aspect-[3/4] sm:aspect-[2/3] flex flex-col justify-end
                           focus-visible:outline-none focus-visible:ring-4
                           focus-visible:ring-[var(--brand-accent)]"
                aria-label={`Explore ${cat.name}`}
              >
                {/* Image */}
                <ProductImage src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t
                                from-black/80 via-black/30 to-black/10
                                group-hover:from-black/85 transition-all duration-300" />

                {/* Content */}
                <div className="relative z-10 p-6 flex flex-col gap-2">
                  <h3
                    className="text-xl sm:text-2xl font-semibold text-white"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {cat.name}
                  </h3>
                  <p
                    className="text-sm text-white/75 leading-relaxed line-clamp-2"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {cat.description}
                  </p>

                  {/* Explore CTA */}
                  <span
                    className="mt-2 inline-flex items-center gap-1.5 text-sm
                               font-semibold text-[var(--brand-accent)]
                               group-hover:gap-3 transition-all duration-200"
                  >
                    Explore
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
