import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  currentPage:  number;           // 1-indexed
  totalPages:   number;
  onPageChange: (page: number) => void;
  siblingCount?: number;          // pages visible around current; default 1
  showEdges?:    boolean;          // always show first & last page; default true
  className?:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOTS = '…';

function buildPageRange(
  current: number,
  total:   number,
  siblings: number
): (number | typeof DOTS)[] {
  // Total slots: siblings on each side + current + 2 edges + 2 dots = siblings*2 + 5
  const totalSlots = siblings * 2 + 5;

  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling  = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots  = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const pages: (number | typeof DOTS)[] = [];

  // Always include page 1
  pages.push(1);

  if (showLeftDots) {
    pages.push(DOTS);
  } else {
    for (let p = 2; p < leftSibling; p++) pages.push(p);
  }

  for (let p = leftSibling; p <= rightSibling; p++) pages.push(p);

  if (showRightDots) {
    pages.push(DOTS);
  } else {
    for (let p = rightSibling + 1; p < total; p++) pages.push(p);
  }

  // Always include last page
  pages.push(total);

  return pages;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PageBtnProps {
  children:  React.ReactNode;
  active?:   boolean;
  disabled?: boolean;
  onClick:   () => void;
  ariaLabel?: string;
}

const PageBtn = ({ children, active = false, disabled = false, onClick, ariaLabel }: PageBtnProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-current={active ? 'page' : undefined}
    className={[
      'inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-[8px]',
      'text-sm font-medium transition-colors duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-1',
      active
        ? 'bg-[var(--brand-primary)] text-white border border-[var(--brand-primary)] cursor-default'
        : disabled
        ? 'text-[#E8E4D9] cursor-not-allowed'
        : 'text-[#292D28] border border-[#E8E4D9] bg-white hover:bg-[var(--brand-background)] hover:border-[var(--brand-primary)]/30 cursor-pointer',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className    = '',
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(currentPage, totalPages, siblingCount);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <nav
      aria-label="Pagination"
      className={['flex items-center flex-wrap gap-1.5', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Previous */}
      <PageBtn
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        ariaLabel="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </PageBtn>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === DOTS ? (
          <span
            key={`dots-${idx}`}
            className="inline-flex items-center justify-center min-w-[36px] h-9
                       text-sm text-[#73786F] select-none"
            aria-hidden="true"
          >
            {DOTS}
          </span>
        ) : (
          <PageBtn
            key={page}
            active={page === currentPage}
            onClick={() => goTo(page as number)}
            ariaLabel={`Page ${page}`}
          >
            {page}
          </PageBtn>
        )
      )}

      {/* Next */}
      <PageBtn
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        ariaLabel="Next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </PageBtn>
    </nav>
  );
};

export default Pagination;
