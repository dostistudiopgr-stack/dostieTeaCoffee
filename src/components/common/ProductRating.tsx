import { useId } from 'react';
import { Star } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RatingSize = 'small' | 'medium' | 'large';

export interface ProductRatingProps {
  rating:       number;          // 0 – 5
  reviewCount?: number;
  showCount?:   boolean;         // default true when reviewCount is provided
  size?:        RatingSize;
  showValue?:   boolean;         // show numeric rating alongside stars
  className?:   string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<RatingSize, { star: number; text: string; gap: string }> = {
  small:  { star: 12, text: 'text-xs', gap: 'gap-0.5' },
  medium: { star: 14, text: 'text-sm', gap: 'gap-1'   },
  large:  { star: 18, text: 'text-base', gap: 'gap-1'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * For a given star index (1-5) and rating, returns the fill fraction 0 | 0.5 | 1.
 */
const starFill = (index: number, rating: number): 0 | 0.5 | 1 => {
  const diff = rating - (index - 1);
  if (diff >= 1)   return 1;
  if (diff >= 0.5) return 0.5;
  return 0;
};

// ─── Sub-component: single star ───────────────────────────────────────────────

interface StarIconProps {
  fill:  0 | 0.5 | 1;
  size:  number;
}

const StarIcon = ({ fill, size }: StarIconProps) => {
  const clipId = `half-${useId().replaceAll(':', '')}`;
  if (fill === 1) {
    return (
      <Star
        size={size}
        className="text-[var(--brand-accent)] fill-[var(--brand-accent)]"
        aria-hidden="true"
      />
    );
  }

  if (fill === 0.5) {
    // Half-star: clip a filled star to 50% width
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
        {/* empty star background */}
        <Star
          size={size}
          className="text-[#E8E4D9]"
          style={{ position: 'absolute' }}
        />
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#E8E4D9"
          stroke="#E8E4D9"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* half-filled overlay */}
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="var(--brand-accent)"
          stroke="var(--brand-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    );
  }

  return (
    <Star
      size={size}
      className="text-[#E8E4D9] fill-[#E8E4D9]"
      aria-hidden="true"
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ProductRating = ({
  rating,
  reviewCount,
  showCount  = true,
  size       = 'medium',
  showValue  = false,
  className  = '',
}: ProductRatingProps) => {
  const { star, text, gap } = sizeMap[size];
  const clamped = Math.max(0, Math.min(5, rating));

  const label = reviewCount !== undefined
    ? `Rated ${clamped.toFixed(1)} out of 5 from ${reviewCount} review${reviewCount !== 1 ? 's' : ''}`
    : `Rated ${clamped.toFixed(1)} out of 5`;

  return (
    <div
      role="img"
      aria-label={label}
      className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}
    >
      {/* Stars */}
      <span className={`flex items-center ${gap}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon key={i} fill={starFill(i, clamped)} size={star} />
        ))}
      </span>

      {/* Numeric value */}
      {showValue && (
        <span className={`${text} font-semibold text-[#292D28] tabular-nums`}>
          {clamped.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {showCount && reviewCount !== undefined && (
        <span className={`${text} text-[#73786F]`}>
          ({reviewCount.toLocaleString('en-IN')})
        </span>
      )}
    </div>
  );
};

export default ProductRating;
