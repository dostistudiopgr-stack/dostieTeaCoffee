import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { CartItem } from '../../types';
import { formatINR } from '../../utils/formatPrice';
import { getProductById } from '../../utils/productStore';
import ProductImage from '../product/ProductImage';

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderItemCardProps {
  item:       CartItem;
  compact?:   boolean;  // condensed view for order list cards
  className?: string;
}


// ─── Component ────────────────────────────────────────────────────────────────

const OrderItemCard = ({ item, compact = false, className = '' }: OrderItemCardProps) => {
  const product  = getProductById(item.productId);
  const variant  = product?.variants.find((v) => v.id === item.variantId);
  const slug     = product?.slug;


  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
          <ProductImage src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#292D28] truncate">{item.name}</p>
          <p className="text-xs text-[#73786F]">{item.variantLabel} × {item.quantity}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={[
      'flex items-center gap-4 p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9]',
      className,
    ].join(' ')}>
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E8E4D9]">
        <ProductImage src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {slug ? (
          <Link to={`/product/${slug}`}
                className="text-sm font-semibold text-[#292D28] hover:text-[var(--brand-primary)]
                           transition-colors line-clamp-1 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
            {item.name}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-[#292D28] line-clamp-1">{item.name}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          <span className="text-xs text-[#73786F] bg-white border border-[#E8E4D9]
                           px-2 py-0.5 rounded-full font-medium">
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
        <p className="text-xs text-[#73786F] mt-1">
          {formatINR(item.price)} × {item.quantity}
        </p>
      </div>

      {/* Item total */}
      <span className="text-sm font-bold text-[#292D28] shrink-0">
        {formatINR(item.price * item.quantity)}
      </span>
    </div>
  );
};

export default OrderItemCard;
