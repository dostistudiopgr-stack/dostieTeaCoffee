import {
  forwardRef,
  type TextareaHTMLAttributes,
  type ChangeEvent,
} from 'react';
import { AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'maxLength'> {
  label?:      string;
  helperText?: string;
  error?:      string;
  required?:   boolean;
  maxLength?:  number;
  showCount?:  boolean;  // show character counter (auto-enabled when maxLength set)
  fullWidth?:  boolean;
  wrapperClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      required         = false,
      maxLength,
      showCount        = !!maxLength,
      rows             = 4,
      fullWidth        = false,
      disabled         = false,
      wrapperClassName = '',
      className        = '',
      id,
      value,
      defaultValue,
      onChange,
      ...rest
    },
    ref
  ) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    // Derive current character count from value prop when controlled
    const currentLength =
      typeof value === 'string' ? value.length : undefined;

    const borderColor = error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10';

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
    };

    return (
      <div
        className={[
          'flex flex-col',
          fullWidth ? 'w-full' : '',
          wrapperClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Label row */}
        {(label ?? (showCount && maxLength)) && (
          <div className="flex items-center justify-between mb-1.5">
            {label && (
              <label
                htmlFor={textareaId}
                className="block text-sm font-medium text-[#292D28]"
              >
                {label}
                {required && (
                  <span className="text-red-500 ml-0.5" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            )}

            {/* Character counter — right-aligned in label row */}
            {showCount && maxLength && (
              <span
                className={`text-xs tabular-nums ${
                  currentLength !== undefined && currentLength >= maxLength
                    ? 'text-red-500 font-medium'
                    : 'text-[#73786F]'
                }`}
                aria-live="polite"
                aria-atomic="true"
              >
                {currentLength !== undefined
                  ? `${currentLength} / ${maxLength}`
                  : `0 / ${maxLength}`}
              </span>
            )}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          className={[
            'w-full rounded-[8px] border bg-white',
            'px-3.5 py-2.5 text-sm text-[#292D28] placeholder:text-[#73786F]/70',
            'resize-y transition-all duration-150',
            'focus:outline-none focus:ring-2',
            borderColor,
            disabled ? 'opacity-50 cursor-not-allowed bg-[var(--brand-background)] resize-none' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {/* Error */}
        {error && (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper */}
        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-[#73786F]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
