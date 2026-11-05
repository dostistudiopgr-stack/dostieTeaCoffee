import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
export type ButtonSize    = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  ReactNode;
  rightIcon?: ReactNode;
  children:   ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand-primary)] text-white border border-[var(--brand-primary)] hover:bg-[var(--brand-dark)] hover:border-[var(--brand-dark)] active:bg-[var(--brand-dark)]',
  secondary:
    'bg-white text-[var(--brand-primary)] border border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)] active:bg-[var(--brand-primary)]/10',
  outline:
    'bg-transparent text-[var(--brand-primary)] border border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white active:bg-[var(--brand-dark)] active:border-[var(--brand-dark)]',
  ghost:
    'bg-transparent text-[var(--brand-primary)] border border-transparent hover:bg-[var(--brand-primary)]/10 active:bg-[var(--brand-primary)]/20',
  danger:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700 active:bg-red-800',
  gold:
    'bg-[var(--brand-accent)] text-white border border-[var(--brand-accent)] hover:bg-[#b8924d] hover:border-[#b8924d] active:bg-[#b8924d]',
};

const sizeStyles: Record<ButtonSize, string> = {
  small:  'px-3 py-1.5 text-sm gap-1.5 rounded-[6px]',
  medium: 'px-5 py-2.5 text-sm gap-2 rounded-[8px]',
  large:  'px-7 py-3 text-base gap-2.5 rounded-[10px]',
};

const iconSizes: Record<ButtonSize, number> = {
  small:  14,
  medium: 16,
  large:  18,
};

// ─── Component ────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'medium',
      loading   = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      type      = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const iconSize   = iconSizes[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2',
          'select-none whitespace-nowrap',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          isDisabled
            ? 'opacity-50 cursor-not-allowed pointer-events-none'
            : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        ) : null}

        <span>{children}</span>

        {!loading && rightIcon ? (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
