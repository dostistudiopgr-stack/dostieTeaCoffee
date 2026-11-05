import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react';
import { useCart }     from '../../hooks/useCart';
import CartItemRow     from '../../components/cart/CartItem';
import CartSummary     from '../../components/cart/CartSummary';
import EmptyState      from '../../components/common/EmptyState';

// ─── Page ─────────────────────────────────────────────────────────────────────

const Cart = () => {
  const { items, summary } = useCart();
  const navigate           = useNavigate();

  const isEmpty = items.length === 0;

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] py-8 sm:py-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="container max-w-7xl mx-auto px-6">

        {/* Page heading */}
        <div className="mb-8">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Your Shopping Cart
          </h1>
          {!isEmpty && (
            <p className="text-sm text-[#73786F] mt-1">
              {summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>

        {/* ── Empty state ─────────────────────────────────── */}
        {isEmpty ? (
          <div className="bg-white rounded-2xl border border-[#E8E4D9] py-4">
            <EmptyState
              icon={<ShoppingBag size={40} strokeWidth={1.5} />}
              title="Your cart is waiting for something special"
              description="Browse our premium tea, coffee and green tea powders and add your favourites."
              action={
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                             text-sm font-semibold px-6 py-3 rounded-xl
                             hover:bg-[var(--brand-dark)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]"
                >
                  Continue Shopping
                </Link>
              }
            />
          </div>
        ) : (
          /* ── Cart content ────────────────────────────────── */
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left — cart items */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">

              {/* Items */}
              <div className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${item.variantId}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Bottom actions */}
              <div className="flex flex-col sm:flex-row items-center
                              justify-between gap-3 pt-2">
                <Link
                  to="/shop"
                  className="flex items-center gap-2 text-sm font-medium
                             text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)] rounded"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  Continue Shopping
                </Link>

                <p className="text-sm text-[#73786F]">
                  Subtotal:{' '}
                  <strong className="text-[#292D28]">
                    ₹{summary.subtotal.toLocaleString('en-IN')}
                  </strong>
                </p>
              </div>
            </div>

            {/* Right — order summary */}
            <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">
              <CartSummary
                onCheckout={() => navigate('/checkout')}
                checkoutLabel="Proceed to Checkout"
                showCoupon
              />
            </div>
          </div>
        )}

        {/* Mobile sticky checkout bar (only when cart has items) */}
        {!isEmpty && (
          <div className="fixed bottom-0 left-0 right-0 lg:hidden
                          bg-white border-t border-[#E8E4D9] px-4 py-3 shadow-lg z-20">
            <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
              <div>
                <p className="text-xs text-[#73786F]">Total</p>
                <p className="text-base font-bold text-[#292D28]">
                  ₹{summary.total.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                           font-semibold text-sm px-6 py-3 rounded-xl
                           hover:bg-[var(--brand-dark)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                Checkout
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom padding so sticky bar doesn't overlap */}
        {!isEmpty && <div className="h-20 lg:hidden" />}
      </div>
    </div>
  );
};

export default Cart;
