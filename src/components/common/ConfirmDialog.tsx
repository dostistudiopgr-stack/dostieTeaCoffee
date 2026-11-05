import { useRef, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import Button from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialogVariant = 'danger' | 'default';

export interface ConfirmDialogProps {
  isOpen:          boolean;
  onClose:         () => void;
  onConfirm:       () => void;
  title:           string;
  description?:    string;
  confirmLabel?:   string;
  cancelLabel?:    string;
  variant?:        ConfirmDialogVariant;
  loading?:        boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  loading      = false,
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when dialog opens (safer default)
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger   = variant === 'danger';
  const IconEl     = isDanger ? AlertTriangle : Info;
  const iconColors = isDanger
    ? 'bg-red-50 text-red-600'
    : 'bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Panel */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-xl shadow-xl
                   flex flex-col gap-5 p-6
                   animate-[slideUp_200ms_ease]"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#73786F]
                     hover:text-[#292D28] hover:bg-[var(--brand-background)]
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        >
          <X size={16} />
        </button>

        {/* Icon + Text */}
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center
                        justify-center ${iconColors}`}
            aria-hidden="true"
          >
            <IconEl size={20} />
          </div>

          <div className="flex flex-col gap-1 pt-0.5 pr-4">
            <h3
              id="confirm-title"
              className="text-base font-semibold text-[#292D28] leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {title}
            </h3>
            {description && (
              <p id="confirm-desc" className="text-sm text-[#73786F] leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            ref={cancelRef}
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="small"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
