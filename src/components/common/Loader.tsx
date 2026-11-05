import type { ReactNode } from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  size?:      SpinnerSize;
  color?:     string;   // CSS color value; defaults to brand green
  className?: string;
  label?:     string;   // sr-only accessible label
}

const spinnerDimensions: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border-[2px]',
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-6 h-6 border-[2px]',
  lg: 'w-9 h-9 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

export const Spinner = ({
  size      = 'md',
  className = '',
  label     = 'Loading…',
}: SpinnerProps) => (
  <span role="status" aria-label={label} className={`inline-flex items-center justify-center ${className}`}>
    <span
      className={[
        'rounded-full border-solid animate-spin',
        'border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]',
        spinnerDimensions[size],
      ].join(' ')}
    />
    <span className="sr-only">{label}</span>
  </span>
);

// ─── Button Loader (tiny inline spinner for use inside buttons) ───────────────

export const ButtonLoader = ({ label = 'Loading…' }: { label?: string }) => (
  <Spinner size="xs" label={label} />
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?:     string;  // e.g. 'w-full', 'w-48'
  height?:    string;  // e.g. 'h-4', 'h-32'
  rounded?:   string;  // e.g. 'rounded-md', 'rounded-full'
  className?: string;
}

export const Skeleton = ({
  width     = 'w-full',
  height    = 'h-4',
  rounded   = 'rounded-md',
  className = '',
}: SkeletonProps) => (
  <span
    aria-hidden="true"
    className={[
      'block bg-[#E8E4D9] animate-pulse',
      width,
      height,
      rounded,
      className,
    ].join(' ')}
  />
);

// ─── Skeleton Card (convenience preset for product cards) ─────────────────────

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8E4D9] ${className}`}>
    <Skeleton height="h-52" rounded="rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton width="w-2/3" height="h-3" />
      <Skeleton height="h-5" />
      <Skeleton width="w-1/2" height="h-3" />
      <Skeleton width="w-1/3" height="h-8" rounded="rounded-lg" />
    </div>
  </div>
);

// ─── Full-Page Loader ─────────────────────────────────────────────────────────

interface FullPageLoaderProps {
  message?: string;
  children?: ReactNode;
}

const FullPageLoader = ({ message = 'Loading…', children }: FullPageLoaderProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={message}
    className="fixed inset-0 z-50 flex flex-col items-center justify-center
               bg-[var(--brand-background)]/90 backdrop-blur-sm gap-4"
  >
    <Spinner size="xl" label={message} />
    {children ?? (
      <p
        className="text-sm font-medium text-[#73786F]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {message}
      </p>
    )}
  </div>
);

export default FullPageLoader;
