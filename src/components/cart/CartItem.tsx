import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import type { CartItem as CartItemType } from '../../types';
import { useCart }      from '../../hooks/useCart';
import { formatINR }    from '../../utils/formatPrice';
import { getProductById } from '../../utils/productStore';
import ProductImage from '../product/ProductImage';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CartItemProps {
  item:      CartItemType;
  className?: string;
}

// ─── Fallback image ───────────────────────────────────────────────────────────


// ─── Component ────────────────────────────────────────────────────────────────

const CartItemRow = ({ item, className = '' }: CartItemProps) => {
  const { removeItem, updateQuantity } = useCart();

  // Look up the product so we can find the variant's max stock
  const product  = getProductById(item.productId);
  const variant  = product?.variants.find((v) => v.id === item.variantId);
  const maxStock = variant?.stock ?? 99;
  const slug     = product?.slug ?? '';

  const itemTotal = item.price * item.quantity;

  const dec = () => {
    if (item.quantity > 1) updateQuantity(item.productId, item.variantId, item.quantity - 1);
  };
  const inc = () => {
    if (item.quantity < maxStock) updateQuantity(item.productId, item.variantId, item.quantity + 1);
  };

  return (
    <div
      className={[
        'flex gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-[#E8E4D9]',
        className,
      ].join(' ')}
    >
      {/* Image */}
      <Link
        to={slug ? `/product/${slug}` : '#'}
        className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden
                   bg-[var(--brand-background)] focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[var(--brand-accent)]"
        tabIndex={slug ? 0 : -1}
      >
        <ProductImage src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
      </Link>

      {/* Info + controls */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Name + remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={slug ? `/product/${slug}` : '#'}
              className="text-sm font-semibold text-[#292D28] hover:text-[var(--brand-primary)]
                         transition-colors line-clamp-2 focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {item.name}
            </Link>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-[#73786F] bg-[var(--brand-background)] border
                               border-[#E8E4D9] px-2 py-0.5 rounded-full font-medium">
                {item.variantLabel}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#73786F]">
                <Package size={11} aria-hidden="true" />
                Resealable Pouch
              </span>
              {variant && (
                <span className="text-xs text-[#73786F]">SKU: {variant.sku}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            aria-label={`Remove ${item.name} from cart`}
            className="shrink-0 p-1.5 rounded-lg text-[#73786F] hover:text-red-500
                       hover:bg-red-50 transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Price + qty */}
        <div className="flex items-center justify-between gap-3 mt-auto flex-wrap">
          {/* Unit price */}
          <span className="text-sm text-[#73786F]">
            {formatINR(item.price)} × {item.quantity}
          </span>

          {/* Qty control */}
          <div className="flex items-center border border-[#E8E4D9] rounded-xl
                          overflow-hidden bg-white">
            <button
              type="button"
              onClick={dec}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-[#73786F]
                         hover:bg-[var(--brand-background)] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
            >
              <Minus size={13} aria-hidden="true" />
            </button>
            <span
              className="w-9 text-center text-sm font-semibold text-[#292D28] select-none"
              aria-live="polite"
              aria-label={`Quantity ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={inc}
              disabled={item.quantity >= maxStock}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-[#73786F]
                         hover:bg-[var(--brand-background)] transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
            >
              <Plus size={13} aria-hidden="true" />
            </button>
          </div>

          {/* Item subtotal */}
          <span className="text-sm font-bold text-[#292D28] min-w-[60px] text-right">
            {formatINR(itemTotal)}
          </span>
        </div>

        {/* Low-stock warning */}
        {variant && variant.stock <= 5 && variant.stock > 0 && (
          <p className="text-[10px] text-amber-600 font-medium">
            Only {variant.stock} left in stock
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItemRow;
