import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Package, MapPin, CreditCard,
  ShoppingBag, ClipboardList, ChevronRight,
} from 'lucide-react';
import { getOrderById }  from '../../data/orders';
import { formatINR }     from '../../utils/formatPrice';
import type { Order }    from '../../types';
import { useAuth } from '../../hooks/useAuth';

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrderConfirmation = () => {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!id) { navigate('/shop'); return; }
    // Small delay to allow localStorage to settle after cart clear
    const t = setTimeout(() => {
      const current = getOrderById(id);
      setOrder(current?.userId === user?.id ? current : null);
    }, 100);
    return () => clearTimeout(t);
  }, [id, navigate, user?.id]);

  // Loading
  if (order === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]
                        rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (order === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center
                      gap-4 px-6 py-16 text-center">
        <Package size={48} strokeWidth={1.5} className="text-[#73786F]" />
        <h1 className="text-xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Order not found
        </h1>
        <p className="text-sm text-[#73786F] max-w-sm">
          We could not find order <strong>{id}</strong>. It may not have been saved yet.
        </p>
        <Link to="/shop"
              className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                         text-sm font-semibold px-5 py-2.5 rounded-xl
                         hover:bg-[var(--brand-dark)] transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--brand-background)] py-10 sm:py-14"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="container max-w-2xl mx-auto px-6">

        {/* ── Success header ─────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center
                          justify-center">
            <CheckCircle size={40} className="text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Your order has been placed!
            </h1>
            <p className="text-[#73786F] text-sm mt-2">
              Thank you for shopping with Dosti Tea &amp; Coffee.
            </p>
          </div>

          {/* Order ID pill */}
          <div className="bg-[var(--brand-primary)] text-white px-6 py-2.5 rounded-full
                          flex items-center gap-2">
            <span className="text-xs opacity-75">Order ID</span>
            <span className="text-sm font-bold tracking-wider">{order.orderNumber}</span>
          </div>

          <p className="text-xs text-[#73786F]">Placed on {orderDate}</p>
        </div>

        {/* ── Card container ─────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden
                        flex flex-col divide-y divide-[#E8E4D9]">

          {/* Ordered items */}
          <section className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#292D28] mb-4 flex items-center gap-2">
              <ShoppingBag size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
              Items Ordered
            </h2>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`}
                     className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0">
                    <img src={item.thumbnail} alt={item.name}
                         loading="lazy"
                         className="w-full h-full object-cover"
                         onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#292D28] truncate">{item.name}</p>
                    <p className="text-xs text-[#73786F]">
                      {item.variantLabel} · Resealable Pouch · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#292D28] shrink-0">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Price breakdown */}
          <section className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#292D28] mb-4 flex items-center gap-2">
              <ClipboardList size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
              Payment Summary
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Subtotal"       value={formatINR(order.subtotal)} />
              {order.discount > 0 && (
                <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                     value={`−${formatINR(order.discount)}`}
                     green />
              )}
              <Row label="Delivery"
                   value={order.shippingCharge === 0 ? 'Free' : formatINR(order.shippingCharge)}
                   green={order.shippingCharge === 0} />
              <Row label="GST (5%)"       value={formatINR(order.tax)} />
              <div className="border-t border-[#E8E4D9] pt-2.5 mt-0.5 flex justify-between">
                <span className="font-bold text-[#292D28]">Total Paid</span>
                <span className="font-bold text-[var(--brand-primary)] text-base">
                  {formatINR(order.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Payment method */}
          <section className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
              <CreditCard size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
              Payment Method
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center
                                justify-center">
                  <Package size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#292D28]">{order.paymentMethod}</p>
                  <p className="text-xs text-[#73786F]">Pay on delivery</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold
                               bg-amber-50 text-amber-700 border border-amber-100">
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </section>

          {/* Delivery address */}
          <section className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
              <MapPin size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
              Delivery Address
            </h2>
            <address className="not-italic text-sm text-[#73786F] leading-relaxed">
              <strong className="text-[#292D28]">{addr.fullName}</strong><br />
              {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />
              {addr.city}, {addr.state} — {addr.pincode}<br />
              {addr.country}<br />
              <span className="font-medium text-[#292D28]">📞 {addr.phone}</span>
            </address>
          </section>

          {/* Order status */}
          <section className="p-5 sm:p-6 bg-[var(--brand-background)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#73786F]">Order Status</p>
                <p className="text-sm font-semibold text-[#292D28] capitalize mt-0.5">
                  {order.status}
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold
                               bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/15">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </section>
        </div>

        {/* ── Action buttons ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/my-orders"
                className="flex-1 flex items-center justify-center gap-2
                           border-2 border-[var(--brand-primary)] text-[var(--brand-primary)]
                           font-semibold text-sm py-3.5 rounded-xl
                           hover:bg-[var(--brand-primary)] hover:text-white transition-all
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]">
            <ClipboardList size={16} aria-hidden="true" />
            View My Orders
          </Link>
          <Link to="/shop"
                className="flex-1 flex items-center justify-center gap-2
                           bg-[var(--brand-primary)] text-white font-semibold text-sm
                           py-3.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]">
            Continue Shopping
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <p className="text-center text-xs text-[#73786F] mt-6">
          This is a demo order. No real transaction or delivery will occur.
        </p>
      </div>
    </div>
  );
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const Row = ({ label, value, green = false }: {
  label: string; value: string; green?: boolean;
}) => (
  <div className="flex justify-between text-[#73786F]">
    <span>{label}</span>
    <span className={`font-medium ${green ? 'text-emerald-600' : 'text-[#292D28]'}`}>
      {value}
    </span>
  </div>
);

export default OrderConfirmation;
