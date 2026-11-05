import {
  useState,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'search'
  | 'url';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  type?:       InputType;
  label?:      string;
  helperText?: string;
  error?:      string;
  required?:   boolean;
  leftIcon?:   ReactNode;
  rightIcon?:  ReactNode;
  fullWidth?:  boolean;
  wrapperClassName?: string;
}

// ─── Shared label/helper style helpers ────────────────────────────────────────

const labelBase =
  'block text-sm font-medium text-[#292D28] mb-1.5';
const helperBase =
  'mt-1.5 text-xs text-[#73786F]';
const errorBase =
  'mt-1.5 text-xs text-red-600 flex items-center gap-1';

// ─── Component ────────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type         = 'text',
      label,
      helperText,
      error,
      required     = false,
      leftIcon,
      rightIcon,
      fullWidth    = false,
      disabled     = false,
      wrapperClassName = '',
      className    = '',
      id,
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputId    = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const hasLeftPadding  = !!leftIcon;
    const hasRightPadding = !!rightIcon || isPassword || !!error;

    const borderColor = error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10';

    return (
      <div className={['flex flex-col', fullWidth ? 'w-full' : '', wrapperClassName].filter(Boolean).join(' ')}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelBase}>
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span
              className="pointer-events-none absolute left-3 text-[#73786F]"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={[
              // base
              'w-full rounded-[8px] border bg-white',
              'text-sm text-[#292D28] placeholder:text-[#73786F]/70',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2',
              // padding
              hasLeftPadding  ? 'pl-10' : 'pl-3.5',
              hasRightPadding ? 'pr-10' : 'pr-3.5',
              'py-2.5',
              // border / focus
              borderColor,
              // disabled
              disabled ? 'opacity-50 cursor-not-allowed bg-[var(--brand-background)]' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          />

          {/* Right area: error icon > password toggle > custom right icon */}
          <span className="absolute right-3 flex items-center gap-1.5 text-[#73786F]">
            {error ? (
              <AlertCircle
                size={16}
                className="text-red-500 shrink-0"
                aria-hidden="true"
              />
            ) : isPassword ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-0.5 rounded hover:text-[#292D28] transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : rightIcon ? (
              <span aria-hidden="true">{rightIcon}</span>
            ) : null}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} role="alert" className={errorBase}>
            <AlertCircle size={12} aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper text (hidden when there is an error) */}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className={helperBase}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
