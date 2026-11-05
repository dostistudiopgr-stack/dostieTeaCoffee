import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface ModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  title?:        string;
  description?:  string;
  children?:     ReactNode;
  footer?:       ReactNode;
  size?:         ModalSize;
  closeOnBackdrop?: boolean;  // default true
  className?:    string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeClasses: Record<ModalSize, string> = {
  small:      'max-w-sm',
  medium:     'max-w-lg',
  large:      'max-w-2xl',
  fullscreen: 'max-w-none w-full h-full rounded-none',
};

// ─── Component ────────────────────────────────────────────────────────────────

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size             = 'medium',
  closeOnBackdrop  = true,
  className        = '',
}: ModalProps) => {
  const dialogRef  = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay lets the element become visible first
      const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Trap focus inside modal and close on Escape
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isFullscreen = size === 'fullscreen';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/50 backdrop-blur-[2px] animate-[fadeIn_150ms_ease]"
      onClick={closeOnBackdrop ? onClose : undefined}
      aria-hidden="true"
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={[
          'relative flex flex-col bg-white shadow-xl',
          'w-full',
          isFullscreen ? '' : 'rounded-xl max-h-[90vh]',
          sizeClasses[size],
          'animate-[slideUp_200ms_ease]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Header */}
        {(title ?? description) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4
                          border-b border-[#E8E4D9] shrink-0">
            <div className="flex flex-col gap-1">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-[#292D28] leading-snug"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="text-sm text-[#73786F]"
                >
                  {description}
                </p>
              )}
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 p-1.5 rounded-lg text-[#73786F]
                         hover:text-[#292D28] hover:bg-[var(--brand-background)]
                         transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Close button when no header */}
        {!(title ?? description) && (
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-[#73786F]
                       hover:text-[#292D28] hover:bg-[var(--brand-background)]
                       transition-colors duration-150 z-10
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
          >
            <X size={18} />
          </button>
        )}

        {/* Body */}
        {children && (
          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-[#292D28]">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-3
                          px-6 py-4 border-t border-[#E8E4D9]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
