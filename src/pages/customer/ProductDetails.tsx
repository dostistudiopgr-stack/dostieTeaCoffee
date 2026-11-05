import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Minus, Plus, ShoppingCart, Zap,
  Check, Package, Info, BookOpen, Thermometer,
  Star, MapPin, CheckCircle, ArrowLeft, LogIn,
} from 'lucide-react';

import { useCart }           from '../../hooks/useCart';
import { useAuth }           from '../../hooks/useAuth';
import { getProductBySlug, getRelatedProducts } from '../../data/products';
import type { ProductReview } from '../../types';

import ProductGallery   from '../../components/product/ProductGallery';
import ProductRating    from '../../components/common/ProductRating';
import PriceDisplay     from '../../components/common/PriceDisplay';
import Badge            from '../../components/common/Badge';
import EmptyState       from '../../components/common/EmptyState';
import ProductCard      from '../../components/product/ProductCard';

// ─── Tag badge config ─────────────────────────────────────────────────────────

const TAG_VARIANT: Record<string, 'brand' | 'success' | 'danger' | 'warning'> = {
  bestseller: 'brand', new: 'success', sale: 'danger', 'limited-edition': 'warning',
};
const TAG_LABEL: Record<string, string> = {
  bestseller: 'Best Seller', new: 'New', sale: 'Sale', 'limited-edition': 'Limited',
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = ({ message, onDone }: { message: string; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 flex items-center gap-2.5 bg-[var(--brand-primary)] text-white
                 text-sm font-medium px-5 py-3 rounded-xl shadow-xl
                 animate-[slideUp_200ms_ease]"
    >
      <CheckCircle size={16} aria-hidden="true" />
      {message}
    </div>
  );
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'description' | 'ingredients' | 'prepare' | 'storage';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'description', label: 'Description',          icon: <BookOpen    size={15} aria-hidden="true" /> },
  { id: 'ingredients', label: 'Ingredients',          icon: <Info        size={15} aria-hidden="true" /> },
  { id: 'prepare',     label: 'How to Prepare',       icon: <Thermometer size={15} aria-hidden="true" /> },
  { id: 'storage',     label: 'Storage',              icon: <Package     size={15} aria-hidden="true" /> },
];

// ─── Review card ──────────────────────────────────────────────────────────────

const ReviewCard = ({ review }: { review: ProductReview }) => (
  <div className="bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)]/10 flex items-center
                        justify-center shrink-0">
          <span className="text-sm font-semibold text-[var(--brand-primary)]">
            {review.author.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#292D28]">{review.author}</p>
          {review.location && (
            <p className="text-xs text-[#73786F] flex items-center gap-1">
              <MapPin size={10} aria-hidden="true" />
              {review.location}
            </p>
          )}
        </div>
      </div>
      <time className="text-xs text-[#73786F] shrink-0" dateTime={review.date}>
        {new Date(review.date).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </time>
    </div>

    <div className="flex items-center gap-2">
      <ProductRating rating={review.rating} size="small" showCount={false} />
      {review.title && (
        <span className="text-sm font-semibold text-[#292D28]">{review.title}</span>
      )}
    </div>

    <p className="text-sm text-[#73786F] leading-relaxed">{review.body}</p>
  </div>
);

// ─── Rating distribution bar ──────────────────────────────────────────────────

const RatingBar = ({
  star, count, total,
}: { star: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="flex items-center gap-1 shrink-0 w-8 text-right text-[#73786F]">
        {star}<Star size={10} className="fill-[var(--brand-accent)] text-[var(--brand-accent)]" aria-hidden="true" />
      </span>
      <div className="flex-1 h-2 bg-[#E8E4D9] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--brand-accent)] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 w-7 text-[#73786F]">{count}</span>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const ProductDetails = () => {
  const { slug }    = useParams<{ slug: string }>();
  const navigate    = useNavigate();
  const { addItem, isInCart, updateQuantity, items } = useCart();
  const { isAuthenticated }                          = useAuth();

  const product = slug ? getProductBySlug(slug) : undefined;

  // ── Local state ────────────────────────────────────────────────────────────
  const [selectedVariantId, setSelectedVariantId] = useState(() => product?.defaultVariantId ?? product?.variants[0]?.id ?? '');
  const selectedVariant = product?.variants.find((variant) => variant.id === selectedVariantId)
    ?? product?.variants.find((variant) => variant.id === product.defaultVariantId)
    ?? product?.variants[0];
  const [qty,         setQty]         = useState(1);
  const [activeTab,   setActiveTab]   = useState<TabId>('description');
  const [toast,       setToast]       = useState('');
  const [buyLoading,  setBuyLoading]  = useState(false);


  // ── Not found ──────────────────────────────────────────────────────────────
  const isOOS     = !selectedVariant || selectedVariant.stock === 0;
  const maxQty    = Math.min(selectedVariant?.stock ?? 0, 10);
  const inCart    = product && selectedVariant ? isInCart(product.id, selectedVariant.id) : false;
  const subtotal  = (selectedVariant?.price ?? 0) * qty;
  const related   = product ? getRelatedProducts(product, 4) : [];

  const categoryLabel =
    product.category === 'green-tea' ? 'Green Tea'
    : product.category === 'herbal-tea' ? 'Herbal Tea'
    : product.category.charAt(0).toUpperCase() + product.category.slice(1);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const decQty = () => setQty((q) => Math.max(1, q - 1));
  const incQty = () => setQty((q) => Math.min(maxQty, q + 1));

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant || isOOS) return;
    // Require login
    if (!isAuthenticated) {
      navigate(`/login?from=/product/${product.slug}`);
      return;
    }
    if (inCart) {
      // update quantity instead of re-adding
      const existingItem = items.find(
        (i) => i.productId === product.id && i.variantId === selectedVariant.id
      );
      if (existingItem) {
        updateQuantity(product.id, selectedVariant.id, existingItem.quantity + qty);
        setToast(`Cart updated — ${product.name} (${selectedVariant.label})`);
        return;
      }
    }
    addItem({
      productId:    product.id,
      variantId:    selectedVariant.id,
      name:         product.name,
      variantLabel: selectedVariant.label,
      price:        selectedVariant.price,
      quantity:     qty,
      thumbnail:    product.thumbnail,
    });
    setToast(`Added to cart — ${product.name} (${selectedVariant.label})`);
  }, [isOOS, inCart, items, product, selectedVariant, qty, addItem, updateQuantity, isAuthenticated, navigate]);

  const handleBuyNow = useCallback(async () => {
    if (!product || !selectedVariant || isOOS) return;
    // Require login
    if (!isAuthenticated) {
      navigate(`/login?from=/product/${product.slug}`);
      return;
    }
    setBuyLoading(true);
    addItem({
      productId:    product.id,
      variantId:    selectedVariant.id,
      name:         product.name,
      variantLabel: selectedVariant.label,
      price:        selectedVariant.price,
      quantity:     qty,
      thumbnail:    product.thumbnail,
    });
    await new Promise((r) => setTimeout(r, 300));
    setBuyLoading(false);
    navigate('/checkout');
  }, [isOOS, product, selectedVariant, qty, addItem, navigate, isAuthenticated]);

  if (!product || !selectedVariant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
        <EmptyState
          title="Product Not Found"
          description="The product you are looking for does not exist or may have been removed."
          action={
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                         text-sm font-semibold px-5 py-2.5 rounded-lg
                         hover:bg-[var(--brand-dark)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Shop
            </Link>
          }
        />
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  // ── Review stats ───────────────────────────────────────────────────────────
  const reviews      = (product.reviews ?? []).filter((review) => review.approved === true);
  const reviewCounts = [5, 4, 3, 2, 1].map((s) => ({
    star:  s,
    count: reviews.filter((r) => Math.round(r.rating) === s).length,
  }));

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)]"
      style={{ fontFamily: 'var(--font-body)' }}
    >

      {/* ── Breadcrumb ──────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8E4D9]">
        <div className="container max-w-7xl mx-auto px-6 py-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
            {[
              { label: 'Home',           to: '/'                          },
              { label: 'Shop',           to: '/shop'                      },
              { label: categoryLabel,    to: `/category/${product.category}` },
            ].map(({ label, to }) => (
              <span key={to} className="flex items-center gap-1.5">
                <Link to={to} className="text-xs text-[#73786F] hover:text-[var(--brand-primary)]
                                          transition-colors focus-visible:outline-none
                                          focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                  {label}
                </Link>
                <ChevronRight size={11} className="text-[#E8E4D9]" aria-hidden="true" />
              </span>
            ))}
            <span className="text-xs text-[#292D28] font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main product section ─────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

          {/* ── Gallery ───────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* ── Product info ──────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Category + tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-accent)]">
                {categoryLabel} Powder
              </span>
              {product.tags
                .filter((t) => TAG_VARIANT[t])
                .slice(0, 2)
                .map((t) => (
                  <Badge key={t} variant={TAG_VARIANT[t]} size="small">
                    {TAG_LABEL[t]}
                  </Badge>
                ))}
            </div>

            {/* Name */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold
                         text-[#292D28] leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {product.name}
            </h1>

            {/* Rating + SKU row */}
            <div className="flex flex-wrap items-center gap-4">
              <ProductRating
                rating={product.rating}
                reviewCount={product.reviewCount}
                size="medium"
                showValue
              />
              <span className="text-xs text-[#73786F]">
                SKU: <span className="font-medium text-[#292D28]">{selectedVariant.sku}</span>
              </span>
              {product.origin && (
                <span className="text-xs text-[#73786F] flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" />
                  {product.origin}
                </span>
              )}
            </div>

            {/* Short description */}
            <p className="text-base text-[#73786F] leading-relaxed border-t
                          border-[#E8E4D9] pt-4">
              {product.shortDescription}
            </p>

            {/* Price */}
            <PriceDisplay
              price={selectedVariant.price}
              compareAtPrice={selectedVariant.compareAtPrice}
              size="large"
            />

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {isOOS ? (
                <Badge variant="danger" dot>Out of Stock</Badge>
              ) : selectedVariant.stock <= 10 ? (
                <Badge variant="warning" dot>Only {selectedVariant.stock} left</Badge>
              ) : (
                <Badge variant="success" dot>In Stock</Badge>
              )}
              {!isOOS && (
                <span className="text-xs text-[#73786F]">
                  {selectedVariant.stock} unit{selectedVariant.stock !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#E8E4D9]" />

            {/* Variant selector */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#292D28]">Pack Size</p>
                <span className="text-xs text-[#73786F]">
                  Selected: <strong className="text-[var(--brand-primary)]">{selectedVariant.label}</strong>
                </span>
              </div>
              <div
                className="flex flex-wrap gap-2.5"
                role="group"
                aria-label="Select pack size"
              >
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariant.id;
                  const oos        = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={oos}
                      onClick={() => { setSelectedVariantId(v.id); setQty(1); }}
                      aria-pressed={isSelected}
                      aria-label={`${v.label}${oos ? ' — out of stock' : ` — ₹${v.price}`}`}
                      className={[
                        'flex flex-col items-center px-4 py-2.5 rounded-xl border-2',
                        'transition-all duration-150 min-w-[72px]',
                        'focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-[var(--brand-accent)]',
                        oos
                          ? 'border-[#E8E4D9] bg-[var(--brand-background)] text-[#C5C5C5] cursor-not-allowed'
                          : isSelected
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-md'
                          : 'border-[#E8E4D9] bg-white text-[#292D28] hover:border-[var(--brand-primary)]/50',
                      ].join(' ')}
                    >
                      <span className={`text-sm font-bold ${oos ? 'line-through' : ''}`}>
                        {v.label}
                      </span>
                      <span className={`text-xs mt-0.5 font-semibold ${isSelected ? 'text-[var(--brand-accent)]' : oos ? 'text-[#C5C5C5]' : 'text-[#73786F]'}`}>
                        ₹{v.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Packaging info */}
            <div className="flex items-center gap-2 bg-[var(--brand-primary)]/6 rounded-xl
                            px-4 py-3 text-sm">
              <Package size={15} className="text-[var(--brand-primary)] shrink-0" aria-hidden="true" />
              <span className="text-[#292D28]">
                Packaging: <strong>Resealable Stand-up Pouch</strong>
                <span className="text-[#73786F] ml-1.5">(Phase 1)</span>
              </span>
            </div>

            {/* Quantity + subtotal — stacked on mobile, row on desktop */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-[#292D28]">Quantity</p>
                  <div className="flex items-center border border-[#E8E4D9]
                                  rounded-xl overflow-hidden bg-white h-11">
                    <button
                      type="button"
                      onClick={decQty}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      className="w-11 h-11 flex items-center justify-center
                                 text-[#73786F] hover:bg-[var(--brand-background)] transition-colors
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
                    >
                      <Minus size={15} aria-hidden="true" />
                    </button>
                    <span
                      className="w-12 text-center text-sm font-semibold
                                 text-[#292D28] select-none h-11 flex items-center justify-center"
                      aria-live="polite"
                      aria-label={`Quantity: ${qty}`}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={incQty}
                      disabled={qty >= maxQty || isOOS}
                      aria-label="Increase quantity"
                      className="w-11 h-11 flex items-center justify-center
                                 text-[#73786F] hover:bg-[var(--brand-background)] transition-colors
                                 disabled:opacity-40 disabled:cursor-not-allowed
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold text-[#292D28]">Subtotal</p>
                  <p className="text-xl font-bold text-[var(--brand-primary)] h-11 flex items-center">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* CTA buttons — full width on mobile, side by side on desktop */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOOS}
                  className={[
                    'flex-1 flex items-center justify-center gap-2.5 h-12 px-4',
                    'rounded-xl font-semibold text-sm',
                    'border-2 transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--brand-accent)]',
                    isOOS
                      ? 'border-[#E8E4D9] bg-[var(--brand-background)] text-[#C5C5C5] cursor-not-allowed'
                      : inCart
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]'
                      : 'border-[var(--brand-primary)] bg-white text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white',
                  ].join(' ')}
                >
                  {inCart ? (
                    <><Check size={17} aria-hidden="true" /> Update Cart</>
                  ) : !isAuthenticated ? (
                    <><LogIn size={17} aria-hidden="true" /> Add</>
                  ) : (
                    <><ShoppingCart size={17} aria-hidden="true" /> Add to Cart</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOOS || buyLoading}
                  className={[
                    'flex-1 flex items-center justify-center gap-2.5 h-12 px-4',
                    'rounded-xl font-semibold text-sm',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--brand-accent)]',
                    isOOS
                      ? 'bg-[#E8E4D9] text-[#73786F] cursor-not-allowed'
                      : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]',
                  ].join(' ')}
                >
                  {buyLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                  ) : (
                    <><Zap size={17} aria-hidden="true" /> Buy Now</>
                  )}
                </button>
              </div>
            </div>

            {/* Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
                <p className="text-sm font-semibold text-[#292D28] mb-3">
                  Product Highlights
                </p>
                <ul className="flex flex-col gap-2">
                  {product.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm text-[#73786F]">
                      <Check
                        size={15}
                        className="text-[var(--brand-primary)] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {product.countryOfOrigin && (
                <div className="bg-white rounded-xl border border-[#E8E4D9] p-3">
                  <p className="text-[#73786F] mb-0.5">Country of Origin</p>
                  <p className="font-semibold text-[#292D28]">{product.countryOfOrigin}</p>
                </div>
              )}
              {product.shelfLife && (
                <div className="bg-white rounded-xl border border-[#E8E4D9] p-3">
                  <p className="text-[#73786F] mb-0.5">Shelf Life</p>
                  <p className="font-semibold text-[#292D28]">{product.shelfLife}</p>
                </div>
              )}
              <div className="bg-white rounded-xl border border-[#E8E4D9] p-3">
                <p className="text-[#73786F] mb-0.5">Pack Size</p>
                <p className="font-semibold text-[#292D28]">{selectedVariant.label}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8E4D9] p-3">
                <p className="text-[#73786F] mb-0.5">Packaging</p>
                <p className="font-semibold text-[#292D28]">Sealed Pouch</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Product information tabs ─────────────────────────── */}
      <div className="bg-white border-t border-[#E8E4D9] mt-6">
        <div className="container max-w-7xl mx-auto px-6 py-10">

          {/* Tab bar */}
          <div
            className="flex gap-1 overflow-x-auto pb-0.5 border-b border-[#E8E4D9] mb-8"
            role="tablist"
          >
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`tab-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={[
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                  'border-b-2 -mb-px transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--brand-accent)]',
                  activeTab === id
                    ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'border-transparent text-[#73786F] hover:text-[#292D28]',
                ].join(' ')}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="max-w-3xl">

            {activeTab === 'description' && (
              <div
                id="tab-panel-description"
                role="tabpanel"
                className="text-[#73786F] leading-relaxed space-y-4 text-base"
              >
                <p>{product.description}</p>
                {product.flavorNotes && product.flavorNotes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-[#292D28] mb-2">
                      Flavour Profile
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.flavorNotes.map((note) => (
                        <span
                          key={note}
                          className="px-3 py-1 bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]
                                     text-xs font-medium rounded-full capitalize"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div id="tab-panel-ingredients" role="tabpanel">
                {product.ingredients ? (
                  <p className="text-[#73786F] leading-relaxed text-base">
                    {product.ingredients}
                  </p>
                ) : (
                  <p className="text-[#73786F] italic">
                    Ingredient information will be updated soon.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'prepare' && (
              <div id="tab-panel-prepare" role="tabpanel">
                {product.howToPrepare ? (
                  <div className="space-y-3">
                    {product.howToPrepare.split('\n').map((line, i) => (
                      line.trim() && (
                        <p key={i} className="text-[#73786F] text-base leading-relaxed">
                          {line.trim()}
                        </p>
                      )
                    ))}
                  </div>
                ) : product.brewingInstructions ? (
                  <p className="text-[#73786F] leading-relaxed text-base">
                    {product.brewingInstructions}
                  </p>
                ) : (
                  <p className="text-[#73786F] italic">
                    Preparation instructions will be updated soon.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'storage' && (
              <div id="tab-panel-storage" role="tabpanel" className="space-y-4">
                {product.storageInstructions ? (
                  <p className="text-[#73786F] leading-relaxed text-base">
                    {product.storageInstructions}
                  </p>
                ) : (
                  <p className="text-[#73786F] italic">
                    Storage information will be updated soon.
                  </p>
                )}
                {product.shelfLife && (
                  <p className="text-sm text-[#292D28]">
                    <strong>Shelf Life:</strong>{' '}
                    <span className="text-[#73786F]">{product.shelfLife}</span>
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="bg-[var(--brand-background)] border-t border-[#E8E4D9]">
          <div className="container max-w-7xl mx-auto px-6 py-10">
            <h2
              className="text-2xl font-semibold text-[#292D28] mb-8"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Customer Reviews
              <span className="ml-2 text-sm font-normal text-[#73786F]">
              </span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating summary */}
              <div className="bg-white rounded-2xl border border-[#E8E4D9] p-6
                              flex flex-col gap-4">
                <div className="flex items-end gap-3">
                  <span
                    className="text-5xl font-bold text-[#292D28]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {product.rating.toFixed(1)}
                  </span>
                  <div className="mb-1">
                    <ProductRating rating={product.rating} size="medium" showCount={false} />
                    <p className="text-xs text-[#73786F] mt-1">
                      {product.reviewCount.toLocaleString('en-IN')} reviews
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {reviewCounts.map(({ star, count }) => (
                    <RatingBar
                      key={star}
                      star={star}
                      count={count}
                      total={reviews.length}
                    />
                  ))}
                </div>
              </div>

              {/* Review cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Related products ─────────────────────────────────── */}
      {related.length > 0 && (
        <div className="bg-white border-t border-[#E8E4D9]">
          <div className="container max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between gap-4 mb-8">
              <h2
                className="text-2xl font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                You Might Also Like
              </h2>
              <Link
                to={`/category/${product.category}`}
                className="text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky mobile buy bar ────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 lg:hidden
                   bg-white border-t border-[#E8E4D9] px-4 py-3 shadow-lg"
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#73786F] truncate">{product.name}</p>
            <p className="text-base font-bold text-[#292D28]">
              ₹{selectedVariant.price.toLocaleString('en-IN')}
              <span className="text-xs text-[#73786F] font-normal ml-1">
                / {selectedVariant.label}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOOS}
            className={[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
              'transition-colors focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
              isOOS
                ? 'bg-[#E8E4D9] text-[#73786F] cursor-not-allowed'
                : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]',
            ].join(' ')}
          >
            <ShoppingCart size={15} aria-hidden="true" />
            {isOOS ? 'Out of Stock' : inCart ? 'Update Cart' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOOS || buyLoading}
            className={[
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
              'transition-colors focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
              isOOS
                ? 'bg-[#E8E4D9] text-[#73786F] cursor-not-allowed'
                : 'bg-[var(--brand-accent)] text-white hover:bg-[#b8924d]',
            ].join(' ')}
          >
            <Zap size={15} aria-hidden="true" />
            Buy Now
          </button>
        </div>
      </div>

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
};

export default ProductDetails;
