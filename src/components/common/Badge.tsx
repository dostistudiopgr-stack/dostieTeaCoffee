import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type BadgeSize    = 'small' | 'medium';

export interface BadgeProps {
  variant?:  BadgeVariant;
  size?:     BadgeSize;
  dot?:      boolean;       // show a coloured dot before the label
  children:  ReactNode;
  className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot:   'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot:   'bg-amber-500',
  },
  danger: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot:   'bg-red-500',
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot:   'bg-blue-500',
  },
  neutral: {
    badge: 'bg-[var(--brand-background)] text-[#73786F] border border-[#E8E4D9]',
    dot:   'bg-[#73786F]',
  },
  brand: {
    badge: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20',
    dot:   'bg-[var(--brand-primary)]',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  small:  'px-2 py-0.5 text-xs gap-1.5 rounded-[4px]',
  medium: 'px-2.5 py-1 text-xs gap-2 rounded-[6px]',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Badge = ({
  variant   = 'neutral',
  size      = 'medium',
  dot       = false,
  children,
  className = '',
}: BadgeProps) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={[
        'inline-flex items-center font-medium leading-none whitespace-nowrap',
        styles.badge,
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={`shrink-0 w-1.5 h-1.5 rounded-full ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
