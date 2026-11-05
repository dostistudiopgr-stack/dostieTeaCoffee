import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  title:       string;
  value:       string | number;
  icon:        ReactNode;
  iconBg?:     string;
  iconColor?:  string;
  change?:     number;
  description?: string;
  className?:  string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const StatCard = ({
  title, value, icon,
  iconBg    = 'bg-[var(--brand-primary)]/10',
  iconColor = 'text-[var(--brand-primary)]',
  change,
  description,
  className = '',
}: StatCardProps) => {
  const hasChange = change !== undefined;
  const up        = (change ?? 0) > 0;
  const flat      = change === 0;

  return (
    <div className={[
      'bg-white rounded-2xl border border-[#E8E4D9] p-5',
      'hover:shadow-md transition-shadow duration-200',
      'flex flex-col h-full',
      className,
    ].join(' ')}>
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>

        {hasChange && (
          <span className={[
            'flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
            flat ? 'bg-[var(--brand-background)] text-[#73786F]'
            : up  ? 'bg-emerald-50 text-emerald-700'
            :        'bg-red-50 text-red-600',
          ].join(' ')}>
            {flat ? <Minus size={10} aria-hidden="true" />
              : up ? <TrendingUp  size={10} aria-hidden="true" />
              :      <TrendingDown size={10} aria-hidden="true" />}
            {Math.abs(change ?? 0)}%
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-xl sm:text-2xl font-bold text-[#292D28] leading-tight">
        {value}
      </p>

      {/* Title */}
      <p className="text-sm font-medium text-[#73786F] mt-1">{title}</p>

      {/* Description */}
      {description && (
        <p className="text-xs text-[#73786F]/60 mt-1 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
};

export default StatCard;
