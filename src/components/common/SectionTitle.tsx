import type { ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionTitleAlignment = 'left' | 'center' | 'right';

export interface SectionTitleProps {
  id?:         string;   // passed to the <h2> as id for aria-labelledby
  title:       string;
  subtitle?:   string;
  eyebrow?:    string;   // small label above the title
  action?:     ReactNode; // e.g. a "View All" button/link
  alignment?:  SectionTitleAlignment;
  className?:  string;
  titleClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const alignmentClasses: Record<SectionTitleAlignment, string> = {
  left:   'items-start text-left',
  center: 'items-center text-center',
  right:  'items-end text-right',
};

const SectionTitle = ({
  id,
  title,
  subtitle,
  eyebrow,
  action,
  alignment      = 'center',
  className      = '',
  titleClassName = '',
}: SectionTitleProps) => {
  const align = alignmentClasses[alignment];

  return (
    <div className={`flex flex-col gap-2 ${align} ${className}`}>
      {/* Eyebrow */}
      {eyebrow && (
        <span
          className="inline-block text-xs font-semibold tracking-[0.15em] uppercase
                     text-[var(--brand-accent)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {eyebrow}
        </span>
      )}

      {/* Title + optional action on the same row for left/right alignment */}
      <div
        className={`flex flex-wrap gap-3 ${
          alignment === 'center'
            ? 'justify-center'
            : alignment === 'right'
            ? 'justify-end'
            : 'justify-between items-end w-full'
        }`}
      >
        <h2
          id={id}
          className={[
            'text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#292D28] leading-tight',
            titleClassName,
          ].join(' ')}
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h2>

        {/* Action rendered inline with title for left alignment */}
        {action && alignment !== 'center' && (
          <div className="shrink-0">{action}</div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="text-sm sm:text-base text-[#73786F] leading-relaxed max-w-xl"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {subtitle}
        </p>
      )}

      {/* Action below title for center alignment */}
      {action && alignment === 'center' && (
        <div className="mt-1">{action}</div>
      )}

      {/* Decorative underline */}
      <div
        className={`flex mt-1 ${
          alignment === 'center'
            ? 'justify-center'
            : alignment === 'right'
            ? 'justify-end'
            : 'justify-start'
        }`}
      >
        <span className="block h-[3px] w-12 rounded-full bg-[var(--brand-accent)]" aria-hidden="true" />
      </div>
    </div>
  );
};

export default SectionTitle;
