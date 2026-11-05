import { useState, type ReactNode } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { ShopFilters, RatingFilter } from '../../hooks/useShopFilters';
import type { ProductCategory } from '../../types';
import ProductRating from '../common/ProductRating';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterSidebarProps {
  filters:           ShopFilters;
  setFilter:         <K extends keyof ShopFilters>(key: K, val: ShopFilters[K]) => void;
  togglePackSize:    (label: string) => void;
  clearFilters:      (keepCategory?: boolean) => void;
  activeFilterCount: number;
  availablePackSizes: string[];
  globalPriceRange:  { min: number; max: number };
  totalCount:        number;
  // Mobile drawer props
  mobileOpen:        boolean;
  onMobileClose:     () => void;
}

// ─── Controlled collapsible section ───────────────────────────────────────────

const FilterSection = ({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E8E4D9] last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-3.5 cursor-pointer
                   select-none hover:text-[var(--brand-primary)] transition-colors
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[var(--brand-accent)] rounded px-1"
      >
        <span className="text-sm font-semibold text-[#292D28]">{title}</span>
        <ChevronDown
          size={15}
          className={`text-[#73786F] transition-transform duration-200
                      ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
};

// ─── Checkbox option ──────────────────────────────────────────────────────────

const CheckOption = ({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  children?: ReactNode;
}) => (
  <label className="flex items-center gap-2.5 cursor-pointer group py-1">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="w-4 h-4 rounded border-[#E8E4D9] text-[var(--brand-primary)]
                 accent-[var(--brand-primary)] cursor-pointer shrink-0"
    />
    <span className="text-sm text-[#292D28] group-hover:text-[var(--brand-primary)]
                     transition-colors leading-tight">
      {children ?? label}
    </span>
  </label>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Products'      },
  { value: 'tea',       label: 'Tea Powders'       },
  { value: 'coffee',    label: 'Coffee Powders'    },
  { value: 'green-tea', label: 'Green Tea Powders' },
];

const RATING_OPTIONS: { value: RatingFilter; label: string }[] = [
  { value: 5, label: '5 Stars only'   },
  { value: 4, label: '4 Stars & above'},
  { value: 3, label: '3 Stars & above'},
];

// ─── Sidebar content ──────────────────────────────────────────────────────────

const SidebarContent = ({
  filters,
  setFilter,
  togglePackSize,
  clearFilters,
  activeFilterCount,
  availablePackSizes,
  globalPriceRange,
  totalCount,
}: Omit<FilterSidebarProps, 'mobileOpen' | 'onMobileClose'>) => (
  <div className="flex flex-col gap-0">
    {/* Header row */}
    <div className="flex items-center justify-between pb-4 mb-1
                    border-b border-[#E8E4D9]">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
        <span className="text-sm font-bold text-[#292D28]">Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-[var(--brand-primary)] text-white text-[10px] font-bold
                           w-5 h-5 rounded-full flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </div>
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => clearFilters(false)}
          className="text-xs text-[var(--brand-accent)] font-semibold hover:text-[#b8924d]
                     transition-colors focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
        >
          Clear All
        </button>
      )}
    </div>

    <p className="text-xs text-[#73786F] pb-4">{totalCount} product{totalCount !== 1 ? 's' : ''} found</p>

    {/* ── Category ──────────────────────────────────────── */}
    <FilterSection title="Category">
      <div className="flex flex-col gap-0.5">
        {CATEGORIES.map(({ value, label }) => {
          const isSelected = filters.category === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter('category', value)}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-left',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                isSelected
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold'
                  : 'text-[#292D28] hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)]',
              ].join(' ')}
            >
              {/* Visual radio indicator */}
              <span className={[
                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                isSelected ? 'border-[var(--brand-primary)]' : 'border-[#C5C5C5]',
              ].join(' ')}>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />
                )}
              </span>
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </FilterSection>

    {/* ── Price Range ───────────────────────────────────── */}
    <FilterSection title="Price Range">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2
                             text-xs text-[#73786F]">₹</span>
            <input
              type="number"
              min={globalPriceRange.min}
              max={filters.priceMax}
              value={filters.priceMin}
              onChange={(e) => setFilter('priceMin', Math.max(0, Number(e.target.value)))}
              aria-label="Minimum price"
              className="w-full pl-6 pr-2 py-2 text-sm border border-[#E8E4D9]
                         rounded-lg text-[#292D28] focus:outline-none
                         focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
            />
          </div>
          <span className="text-xs text-[#73786F] shrink-0">to</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2
                             text-xs text-[#73786F]">₹</span>
            <input
              type="number"
              min={filters.priceMin}
              max={9999}
              value={filters.priceMax === 9999 ? '' : filters.priceMax}
              placeholder={String(globalPriceRange.max)}
              onChange={(e) =>
                setFilter('priceMax', e.target.value === '' ? 9999 : Math.max(0, Number(e.target.value)))
              }
              aria-label="Maximum price"
              className="w-full pl-6 pr-2 py-2 text-sm border border-[#E8E4D9]
                         rounded-lg text-[#292D28] focus:outline-none
                         focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
            />
          </div>
        </div>
        {(filters.priceMin > 0 || filters.priceMax < 9999) && (
          <button
            type="button"
            onClick={() => { setFilter('priceMin', 0); setFilter('priceMax', 9999); }}
            className="text-xs text-[#73786F] hover:text-red-500 transition-colors
                       text-left focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)] rounded"
          >
            Clear price range
          </button>
        )}
      </div>
    </FilterSection>

    {/* ── Pack Size ─────────────────────────────────────── */}
    <FilterSection title="Pack Size">
      <div className="flex flex-wrap gap-2">
        {availablePackSizes.map((label) => {
          const active = filters.packSizes.includes(label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => togglePackSize(label)}
              aria-pressed={active}
              className={[
                'px-3 py-1.5 text-xs font-semibold rounded-lg border',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--brand-accent)]',
                active
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'border-[#E8E4D9] text-[#73786F] hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>
    </FilterSection>

    {/* ── Availability ──────────────────────────────────── */}
    <FilterSection title="Availability">
      <div className="flex flex-col gap-0.5">
        <CheckOption
          label="All"
          checked={filters.inStockOnly === null}
          onChange={() => setFilter('inStockOnly', null)}
        >
          All
        </CheckOption>
        <CheckOption
          label="In Stock"
          checked={filters.inStockOnly === true}
          onChange={() => setFilter('inStockOnly', true)}
        >
          In Stock
        </CheckOption>
        <CheckOption
          label="Out of Stock"
          checked={filters.inStockOnly === false}
          onChange={() => setFilter('inStockOnly', false)}
        >
          Out of Stock
        </CheckOption>
      </div>
    </FilterSection>

    {/* ── Rating ────────────────────────────────────────── */}
    <FilterSection title="Customer Rating">
      <div className="flex flex-col gap-1">
        <CheckOption
          label="Any rating"
          checked={filters.minRating === null}
          onChange={() => setFilter('minRating', null)}
        >
          Any Rating
        </CheckOption>
        {RATING_OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2.5 cursor-pointer group py-1">
            <input
              type="radio"
              name="filter-rating"
              checked={filters.minRating === value}
              onChange={() => setFilter('minRating', value)}
              aria-label={label}
              className="w-4 h-4 accent-[var(--brand-primary)] cursor-pointer shrink-0"
            />
            <span className="flex items-center gap-1.5">
              <ProductRating rating={value} size="small" showCount={false} />
              <span className="text-xs text-[#73786F]">{label}</span>
            </span>
          </label>
        ))}
      </div>
    </FilterSection>
  </div>
);

// ─── Main export — desktop sidebar + mobile drawer ────────────────────────────

const FilterSidebar = (props: FilterSidebarProps) => {
  const { mobileOpen, onMobileClose, ...rest } = props;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className="hidden lg:block w-64 shrink-0"
        aria-label="Product filters"
      >
        <div className="sticky top-24 bg-white rounded-2xl border
                        border-[#E8E4D9] p-5 max-h-[calc(100vh-7rem)]
                        overflow-y-auto">
          <SidebarContent {...rest} />
        </div>
      </aside>

      {/* ── Mobile drawer ───────────────────────────────── */}
      <>
        {/* Backdrop */}
        <div
          onClick={onMobileClose}
          aria-hidden="true"
          className={[
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          ].join(' ')}
        />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className={[
            'fixed top-0 left-0 z-50 h-full w-80 max-w-[90vw] bg-white',
            'flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-[#E8E4D9] shrink-0">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
              <span className="text-sm font-bold text-[#292D28]">Filters</span>
              {props.activeFilterCount > 0 && (
                <span className="bg-[var(--brand-primary)] text-white text-[10px] font-bold
                                 w-5 h-5 rounded-full flex items-center justify-center">
                  {props.activeFilterCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close filters"
              className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                         hover:text-[#292D28] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            <SidebarContent {...rest} />
          </div>

          {/* Apply button */}
          <div className="shrink-0 px-5 py-4 border-t border-[#E8E4D9]">
            <button
              type="button"
              onClick={onMobileClose}
              className="w-full bg-[var(--brand-primary)] text-white font-semibold text-sm
                         py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              Show {props.totalCount} Results
            </button>
          </div>
        </div>
      </>
    </>
  );
};

export default FilterSidebar;
