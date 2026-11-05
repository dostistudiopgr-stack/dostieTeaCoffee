import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, CheckCircle, LogIn } from 'lucide-react';
import type { Product, ProductVariant } from '../../types';
import { useCart }       from '../../hooks/useCart';
import { useAuth }       from '../../hooks/useAuth';
import ProductRating     from '../common/ProductRating';
import PriceDisplay      from '../common/PriceDisplay';
import Badge             from '../common/Badge';
import ProductImage from './ProductImage';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  product:          Product;
  className?:       string;
  /** Pre-select a specific variant (e.g. from filter) */
  initialVariantId?: string;
}

// ─── Fallback images per category ─────────────────────────────────────────────

// ─── Badge config ─────────────────────────────────────────────────────────────

const TAG_VARIANT: Record<string, 'brand' | 'success' | 'danger' | 'warning'> = {
  bestseller:        'brand',
  new:               'success',
  sale:              'danger',
  'limited-edition': 'warning',
};
const TAG_LABEL: Record<string, string> = {
  bestseller: 'Best Seller', new: 'New', sale: 'Sale', 'limited-edition': 'Limited',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProductCard = ({ product, className = '', initialVariantId }: ProductCardProps) => {
  const { addItem, isInCart } = useCart();
  const { isAuthenticated }   = useAuth();
  const navigate              = useNavigate();

  const resolveInitial = (): ProductVariant =>
    (initialVariantId && product.variants.find((v) => v.id === initialVariantId))
    ?? product.variants.find((v) => v.id === product.defaultVariantId)
    ?? product.variants[0];

  const [selected,  setSelected]  = useState<ProductVariant>(resolveInitial);
  const [justAdded, setJustAdded] = useState(false);

  const inCart = isInCart(product.id, selected.id);

  const isOutOfStock = selected.stock === 0;

  const handleAddToCart = () => {
    if (inCart || isOutOfStock) return;
    // Require login before adding to cart
    if (!isAuthenticated) {
      navigate(`/login?from=/product/${product.slug}`);
      return;
    }
    addItem({
      productId:    product.id,
      variantId:    selected.id,
      name:         product.name,
      variantLabel: selected.label,
      price:        selected.price,
      quantity:     1,
      thumbnail:    product.thumbnail,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const primaryTag = product.tags.find((t) => TAG_VARIANT[t]);

  // Category display label
  const categoryLabel = product.category === 'green-tea'
    ? 'Green Tea'
    : product.category === 'herbal-tea'
    ? 'Herbal Tea'
    : product.category.charAt(0).toUpperCase() + product.category.slice(1);

  return (
    <article
      className={[
        'group relative flex flex-col bg-white rounded-2xl overflow-hidden',
        'border border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
        'shadow-sm hover:shadow-lg transition-all duration-300',
        className,
      ].join(' ')}
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[var(--brand-background)] aspect-[4/3] shrink-0">
        <ProductImage src={product.thumbnail} alt={`${product.name} — product`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

        {/* Primary tag badge */}
        {primaryTag && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant={TAG_VARIANT[primaryTag]} size="small">
              {TAG_LABEL[primaryTag]}
            </Badge>
          </div>
        )}

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center
                          justify-center">
            <Badge variant="neutral">Out of Stock</Badge>
          </div>
        )}

        {/* Quick-view hover overlay */}
        {!isOutOfStock && (
          <Link
            to={`/product/${product.slug}`}
            aria-label={`Quick view ${product.name}`}
            tabIndex={-1}
            className="absolute inset-0 flex items-center justify-center
                       opacity-0 group-hover:opacity-100
                       bg-black/0 group-hover:bg-black/18
                       transition-all duration-300"
          >
            <span className="flex items-center gap-2 bg-white text-[#292D28]
                             text-xs font-semibold px-3.5 py-2 rounded-full
                             shadow-md translate-y-2 group-hover:translate-y-0
                             transition-transform duration-300">
              <Eye size={13} aria-hidden="true" />
              Quick View
            </span>
          </Link>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2.5">

        {/* Category label */}
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand-accent)]">
          {categoryLabel} Powder
        </span>

        {/* Product name */}
        <Link
          to={`/product/${product.slug}`}
          className="text-sm font-semibold text-[#292D28] leading-snug
                     hover:text-[var(--brand-primary)] transition-colors line-clamp-2
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)] rounded"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {product.name}
        </Link>

        {/* Short description */}
        <p className="text-xs text-[#73786F] leading-relaxed line-clamp-2">
          {product.shortDescription}
        </p>

        {/* Rating */}
        <ProductRating
          rating={product.rating}
          reviewCount={product.reviewCount}
          size="small"
        />

        {/* Pack size selector */}
        {product.variants.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5" role="group"
               aria-label="Select pack size">
            {product.variants.map((v) => {
              const isSelected = v.id === selected.id;
              const oos        = v.stock === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={oos}
                  onClick={() => setSelected(v)}
                  aria-pressed={isSelected}
                  aria-label={`${v.label}${oos ? ' — out of stock' : ''}`}
                  className={[
                    'px-2.5 py-1 text-[11px] font-semibold rounded-md',
                    'border transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--brand-accent)]',
                    oos
                      ? 'border-[#E8E4D9] text-[#C5C5C5] cursor-not-allowed line-through'
                      : isSelected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                      : 'border-[#E8E4D9] text-[#73786F] hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]',
                  ].join(' ')}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Price + Add to Cart */}
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <PriceDisplay
            price={selected.price}
            compareAtPrice={selected.compareAtPrice}
            size="small"
          />

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={inCart || isOutOfStock}
            aria-label={
              isOutOfStock
                ? 'Out of stock'
                : inCart
                ? `${product.name} ${selected.label} is in your cart`
                : `Add ${product.name} ${selected.label} to cart`
            }
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold',
              'transition-all duration-200 shrink-0 whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
              isOutOfStock
                ? 'bg-[#E8E4D9] text-[#73786F] cursor-not-allowed'
                : inCart || justAdded
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]',
            ].join(' ')}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : inCart || justAdded ? (
              <>
                <CheckCircle size={13} aria-hidden="true" />
                Added
              </>
            ) : !isAuthenticated ? (
              <>
                <LogIn size={13} aria-hidden="true" />
                Add
              </>
            ) : (
              <>
                <ShoppingCart size={13} aria-hidden="true" />
                Add
              </>
            )}
          </button>
        </div>

        {/* Low-stock warning */}
        {!isOutOfStock && selected.stock <= 10 && selected.stock > 0 && (
          <p className="text-[10px] text-amber-600 font-medium">
            Only {selected.stock} left in stock
          </p>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
