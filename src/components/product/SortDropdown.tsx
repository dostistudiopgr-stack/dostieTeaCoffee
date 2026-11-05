import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SortOption } from '../../hooks/useShopFilters';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured',   label: 'Featured'           },
  { value: 'bestselling',label: 'Best Selling'       },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest'             },
  { value: 'top-rated',  label: 'Top Rated'          },
  { value: 'name-asc',   label: 'Name: A to Z'       },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SortDropdownProps {
  value:     SortOption;
  onChange:  (v: SortOption) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SortDropdown = ({ value, onChange, className = '' }: SortDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sort by';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Sort by: ${selectedLabel}`}
        className="flex items-center gap-2 bg-white border border-[#E8E4D9]
                   rounded-xl px-4 py-2.5 text-sm font-medium text-[#292D28]
                   hover:border-[var(--brand-primary)]/40 transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[var(--brand-accent)] whitespace-nowrap"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={15}
          className={`text-[#73786F] transition-transform duration-200
                      ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Sort options"
          className="absolute right-0 top-full mt-2 z-30 bg-white
                     border border-[#E8E4D9] rounded-xl shadow-lg
                     py-1.5 min-w-[200px]
                     animate-[slideUp_150ms_ease]"
        >
          {SORT_OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={[
                    'w-full flex items-center justify-between gap-3',
                    'px-4 py-2 text-sm transition-colors duration-100',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--brand-accent)]',
                    isSelected
                      ? 'text-[var(--brand-primary)] font-semibold bg-[var(--brand-primary)]/6'
                      : 'text-[#292D28] hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)]',
                  ].join(' ')}
                >
                  {opt.label}
                  {isSelected && (
                    <Check size={14} className="text-[var(--brand-primary)] shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SortDropdown;
