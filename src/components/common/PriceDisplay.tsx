import { calcDiscount, formatINR } from '../../utils/formatPrice';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PriceDisplaySize = 'small' | 'medium' | 'large';

export interface PriceDisplayProps {
  price:           number;           // current / sale price in INR paise or rupees
  compareAtPrice?: number;           // original price (shown struck through)
  showDiscount?:   boolean;          // show "XX% OFF" badge — default true when compareAtPrice > price
  size?:           PriceDisplaySize;
  className?:      string;
  inline?:         boolean;          // render in a row instead of stacked
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<
  PriceDisplaySize,
  { current: string; original: string; badge: string }
> = {
  small: {
    current:  'text-base font-semibold',
    original: 'text-xs',
    badge:    'text-[10px] px-1.5 py-0.5',
  },
  medium: {
    current:  'text-xl font-semibold',
    original: 'text-sm',
    badge:    'text-xs px-2 py-0.5',
  },
  large: {
    current:  'text-2xl font-bold',
    original: 'text-base',
    badge:    'text-xs px-2.5 py-1',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const PriceDisplay = ({
  price,
  compareAtPrice,
  showDiscount = true,
  size         = 'medium',
  className    = '',
  inline       = false,
}: PriceDisplayProps) => {
  const hasDiscount  = compareAtPrice !== undefined && compareAtPrice > price;
  const discountPct  = hasDiscount ? calcDiscount(compareAtPrice!, price) : 0;
  const styles       = sizeMap[size];

  return (
    <div
      className={[
        'flex flex-wrap',
        inline ? 'flex-row items-center gap-2' : 'flex-col gap-0.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Current price */}
      <span
        className={`${styles.current} text-[#292D28]`}
        aria-label={`Price: ${formatINR(price)}`}
      >
        {formatINR(price)}
      </span>

      {/* Original + discount row */}
      {hasDiscount && (
        <span className="flex items-center gap-2 flex-wrap">
          {/* Struck-through original price */}
          <span
            className={`${styles.original} text-[#73786F] line-through`}
            aria-label={`Original price: ${formatINR(compareAtPrice!)}`}
          >
            {formatINR(compareAtPrice!)}
          </span>

          {/* Discount badge */}
          {showDiscount && discountPct > 0 && (
            <span
              className={[
                'rounded-[4px] font-semibold leading-none',
                'bg-emerald-50 text-emerald-700 border border-emerald-100',
                styles.badge,
              ].join(' ')}
              aria-label={`${discountPct}% discount`}
            >
              {discountPct}% OFF
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default PriceDisplay;
