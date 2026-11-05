import {
  forwardRef,
  type SelectHTMLAttributes,
} from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value:    string | number;
  label:    string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?:       string;
  placeholder?: string;
  options:      SelectOption[];
  error?:       string;
  helperText?:  string;
  required?:    boolean;
  fullWidth?:   boolean;
  wrapperClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      placeholder,
      options,
      error,
      helperText,
      required         = false,
      fullWidth        = false,
      disabled         = false,
      wrapperClassName = '',
      className        = '',
      id,
      ...rest
    },
    ref
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const borderColor = error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10';

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
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[#292D28] mb-1.5"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            className={[
              'w-full appearance-none rounded-[8px] border bg-white',
              'pl-3.5 pr-10 py-2.5',
              'text-sm transition-all duration-150',
              'focus:outline-none focus:ring-2',
              borderColor,
              // empty value → secondary text colour
              'text-[#292D28]',
              disabled ? 'opacity-50 cursor-not-allowed bg-[var(--brand-background)]' : 'cursor-pointer',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <span
            className="pointer-events-none absolute right-3 text-[#73786F]"
            aria-hidden="true"
          >
            <ChevronDown size={16} />
          </span>
        </div>

        {/* Error */}
        {error && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
          >
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-[#73786F]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
