import type { ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title:        string;
  description?: string;
  icon?:        ReactNode;
  action?:      ReactNode;
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const EmptyState = ({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) => {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        'px-6 py-16 gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full
                   bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]"
        aria-hidden="true"
      >
        {icon ?? <PackageSearch size={32} strokeWidth={1.5} />}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3
          className="text-base font-semibold text-[#292D28]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h3>

        {description && (
          <p className="text-sm text-[#73786F] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
