import { useState, type FormEvent } from 'react';
import { Tag, X, ChevronRight, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart }         from '../../hooks/useCart';
import { formatINR }       from '../../utils/formatPrice';
import { validateCoupon }  from '../../utils/orderUtils';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CartSummaryProps {
  onCheckout?:  () => void;
  checkoutLabel?: string;
  showCoupon?:  boolean;
  readOnly?:    boolean;   // true on checkout page — no coupon input, no button
  className?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CartSummary = ({
  onCheckout,
  checkoutLabel = 'Proceed to Checkout',
  showCoupon    = true,
  readOnly      = false,
  className     = '',
}: CartSummaryProps) => {
  const { summary, couponCode, applyCoupon, removeCoupon } = useCart();
  const settings = usePublicSettings();

  const [couponInput,   setCouponInput]   = useState('');
  const [couponMsg,     setCouponMsg]     = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleApplyCoupon = (e: FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (couponCode && couponCode === code) {
      setCouponMsg('This coupon is already applied.');
      setCouponSuccess(false);
      return;
    }

    const result = validateCoupon(code, summary.subtotal);
    setCouponMsg(result.message);
    setCouponSuccess(result.valid);

    if (result.valid) {
      applyCoupon(code, result.discount);
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponMsg('');
    setCouponSuccess(false);
    setCouponInput('');
  };

  const freeShippingGap = settings.delivery.freeThreshold - summary.subtotal;

  return (
    <div
      className={[
        'bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden',
        className,
      ].join(' ')}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E8E4D9]">
        <h2
          className="text-base font-semibold text-[#292D28]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Order Summary
        </h2>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">

        {/* Free delivery progress */}
        {!readOnly && summary.shipping > 0 && freeShippingGap > 0 && (
          <div className="bg-[var(--brand-background)] rounded-xl p-3.5 flex items-start gap-2.5">
            <Truck size={15} className="text-[var(--brand-primary)] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-[#73786F] leading-relaxed">
              Add{' '}
              <strong className="text-[#292D28]">{formatINR(freeShippingGap)}</strong>
              {' '}more to get{' '}
              <strong className="text-[var(--brand-primary)]">Free Delivery</strong>.
            </p>
          </div>
        )}
        {summary.shipping === 0 && summary.subtotal > 0 && (
          <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-600 shrink-0" aria-hidden="true" />
            <p className="text-xs text-emerald-700 font-medium">Free delivery applied!</p>
          </div>
        )}

        {/* Coupon input */}
        {showCoupon && !readOnly && (
          <div>
            {couponCode ? (
              <div className="flex items-center justify-between gap-2 bg-[var(--brand-primary)]/8
                              rounded-xl px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[var(--brand-primary)]" aria-hidden="true" />
                  <span className="text-sm font-semibold text-[var(--brand-primary)]">{couponCode}</span>
                  <span className="text-xs text-emerald-600">
                    −{formatINR(summary.discount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  aria-label="Remove coupon"
                  className="text-[#73786F] hover:text-red-500 transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)] rounded"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(''); }}
                  placeholder="Coupon code (e.g. DOSTI10)"
                  aria-label="Coupon code"
                  className="flex-1 text-sm border border-[#E8E4D9] rounded-xl
                             px-3.5 py-2.5 text-[#292D28] placeholder:text-[#73786F]/60
                             focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2
                             focus:ring-[var(--brand-primary)]/10 transition-all uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[var(--brand-primary)] text-white text-sm font-semibold
                             rounded-xl hover:bg-[var(--brand-dark)] transition-colors shrink-0
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Coupon message */}
            {couponMsg && (
              <p
                role="status"
                aria-live="polite"
                className={[
                  'mt-2 text-xs flex items-start gap-1.5',
                  couponSuccess ? 'text-emerald-600' : 'text-red-500',
                ].join(' ')}
              >
                {couponSuccess
                  ? <CheckCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                  : <AlertCircle size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
                }
                {couponMsg}
              </p>
            )}

            <p className="text-[10px] text-[#73786F] mt-1.5">
              Demo coupons: DOSTI10, FIRST50, SAVE20
            </p>
          </div>
        )}

        {/* Line items */}
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-[#73786F]">
            <span>Subtotal ({summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''})</span>
            <span className="font-medium text-[#292D28]">{formatINR(summary.subtotal)}</span>
          </div>

          {summary.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount {couponCode && `(${couponCode})`}</span>
              <span className="font-medium">−{formatINR(summary.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#73786F]">
            <span>Delivery</span>
            {summary.shipping === 0 ? (
              <span className="text-emerald-600 font-medium">Free</span>
            ) : (
              <span className="font-medium text-[#292D28]">{formatINR(summary.shipping)}</span>
            )}
          </div>

          <div className="flex justify-between text-[#73786F]">
            <span>GST (5%)</span>
            <span className="font-medium text-[#292D28]">{formatINR(summary.tax)}</span>
          </div>

          <div className="border-t border-[#E8E4D9] pt-3 flex justify-between">
            <span className="font-bold text-[#292D28] text-base">Grand Total</span>
            <span className="font-bold text-[var(--brand-primary)] text-lg">
              {formatINR(summary.total)}
            </span>
          </div>
        </div>

        {/* CTA */}
        {!readOnly && onCheckout && (
          <button
            type="button"
            onClick={onCheckout}
            disabled={summary.itemCount === 0}
            className="w-full flex items-center justify-center gap-2
                       bg-[var(--brand-primary)] text-white font-semibold text-sm
                       py-3.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            {checkoutLabel}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-[#73786F] text-center leading-relaxed">
          Prices and delivery estimates are for demonstration. No real transaction occurs.
        </p>
      </div>
    </div>
  );
};

export default CartSummary;
