import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import ProductImage from './ProductImage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductGalleryProps {
  images:      string[];
  productName: string;
  className?:  string;
}

// ─── Fallback image ───────────────────────────────────────────────────────────


// ─── Zoom modal ───────────────────────────────────────────────────────────────

const ZoomModal = ({
  src,
  alt,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  src:     string;
  alt:     string;
  onClose: () => void;
  onPrev:  () => void;
  onNext:  () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft'  && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Image zoom"
    >
      {/* Image */}
      <div
        className="relative max-w-4xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <ProductImage src={src} alt={alt} className="w-full max-h-[85vh] object-contain rounded-xl" />
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close zoom"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10
                   text-white hover:bg-white/25 transition-colors
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-white"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full
                     bg-white/10 text-white hover:bg-white/25 transition-colors
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full
                     bg-white/10 text-white hover:bg-white/25 transition-colors
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-white"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
};

// ─── Main gallery ─────────────────────────────────────────────────────────────

const ProductGallery = ({ images, productName, className = '' }: ProductGalleryProps) => {
  const safeImages   = images.length > 0 ? images : [''];
  const [active,     setActive]     = useState(0);
  const [zoomed,     setZoomed]     = useState(false);
  const getSrc = (idx: number) => safeImages[idx];

  const prev = useCallback(() => setActive((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setActive((i) => Math.min(safeImages.length - 1, i + 1)), [safeImages.length]);

  const hasPrev = active > 0;
  const hasNext = active < safeImages.length - 1;

  return (
    <>
      <div className={`flex flex-col gap-3 ${className}`}>

        {/* ── Main image ──────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl bg-[var(--brand-background)]
                     border border-[#E8E4D9] aspect-square"
        >
          <ProductImage src={getSrc(active)} alt={`${productName} — image ${active + 1}`} className="w-full h-full object-cover transition-opacity duration-200" />

          {/* Zoom button */}
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="Zoom image"
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/80
                       backdrop-blur-sm text-[#292D28] shadow-sm
                       hover:bg-white transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <ZoomIn size={17} aria-hidden="true" />
          </button>

          {/* Prev/next on main image */}
          {hasPrev && (
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                         bg-white/80 backdrop-blur-sm text-[#292D28] shadow-sm
                         hover:bg-white transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                         bg-white/80 backdrop-blur-sm text-[#292D28] shadow-sm
                         hover:bg-white transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}

          {/* Image counter */}
          {safeImages.length > 1 && (
            <span className="absolute top-3 left-3 bg-black/40 text-white
                             text-xs font-medium px-2 py-1 rounded-full
                             backdrop-blur-sm">
              {active + 1} / {safeImages.length}
            </span>
          )}
        </div>

        {/* ── Thumbnails ──────────────────────────────────── */}
        {safeImages.length > 1 && (
          <div
            className="flex gap-2.5 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Product images"
          >
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === active}
                aria-label={`View image ${idx + 1}`}
                onClick={() => setActive(idx)}
                className={[
                  'shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden',
                  'border-2 transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--brand-accent)]',
                  idx === active
                    ? 'border-[var(--brand-primary)] shadow-sm'
                    : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/40 opacity-70 hover:opacity-100',
                ].join(' ')}
              >
                <ProductImage src={getSrc(idx)} alt={`${productName} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Zoom modal ──────────────────────────────────────── */}
      {zoomed && (
        <ZoomModal
          src={getSrc(active)}
          alt={`${productName} — enlarged`}
          onClose={() => setZoomed(false)}
          onPrev={prev}
          onNext={next}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </>
  );
};

export default ProductGallery;
