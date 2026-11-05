import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Package } from 'lucide-react';
import { useAuth }       from '../../hooks/useAuth';
import { getOrderById }  from '../../data/orders';
import { formatINR }     from '../../utils/formatPrice';
import OrderStatusBadge  from '../../components/orders/OrderStatusBadge';
import OrderTimeline     from '../../components/orders/OrderTimeline';
import EmptyState        from '../../components/common/EmptyState';
import { useOrderSync } from '../../hooks/useOrderSync';

// ─── Page ─────────────────────────────────────────────────────────────────────

const TrackOrder = () => {
  const { orderNumber }           = useParams<{ orderNumber: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate                  = useNavigate();
  useOrderSync();

  // Support both /track-order/:id (from Part 1 route) and named orderNumber
  const orderId = orderNumber;

  if (!isAuthenticated) {
    navigate(`/login?from=/track-order/${orderId ?? ''}`, { replace: true });
    return null;
  }

  const order = orderId ? getOrderById(orderId) : undefined;

  // Not found
  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <EmptyState
          title="Order Not Found"
          description={`We could not find order ${orderId ?? ''}.`}
          action={
            <Link to="/my-orders"
                  className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                             text-sm font-semibold px-5 py-2.5 rounded-xl
                             hover:bg-[var(--brand-dark)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]">
              Back to My Orders
            </Link>
          }
        />
      </div>
    );
  }

  // Ownership check
  if (order.userId !== user?.id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <EmptyState
          title="Access Denied"
          description="You are not authorised to track this order."
          action={<Link to="/my-orders" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">Back to My Orders</Link>}
        />
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const estDelivery = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-[var(--brand-background)] py-8 sm:py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="container max-w-4xl mx-auto px-6">

        {/* Back nav */}
        <Link to={`/order-details/${order.id}`}
              className="inline-flex items-center gap-2 text-sm text-[#73786F]
                         hover:text-[var(--brand-primary)] transition-colors mb-6
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)] rounded">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Order Details
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Track Your Order
          </h1>
          <p className="text-sm text-[#73786F] mt-1">
            Real-time tracking updates for{' '}
            <span className="font-mono font-bold text-[#292D28]">{order.orderNumber}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Timeline ──────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E4D9] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-[#292D28]"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Order Progress
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>

            <OrderTimeline
              currentStatus={order.status}
              timeline={order.timeline}
            />

            {/* Tracking limits */}
            <div className="mt-8 flex items-start gap-2.5 bg-amber-50 border border-amber-200
                            rounded-xl px-4 py-3.5">
              <Info size={15} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Tracking updates follow the saved order status. Live courier location is not available.
              </p>
            </div>
          </div>

          {/* ── Right: Order info ────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Order summary card */}
            <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
              <h3 className="text-sm font-semibold text-[#292D28] mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Order Info
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs text-[#73786F]">Order ID</p>
                  <p className="font-mono font-bold text-[#292D28] text-xs mt-0.5">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-[#73786F]">Order Date</p>
                  <p className="font-medium text-[#292D28] mt-0.5">{orderDate}</p>
                </div>
                {estDelivery && (
                  <div>
                    <p className="text-xs text-[#73786F]">Est. Delivery</p>
                    <p className="font-medium text-[var(--brand-primary)] mt-0.5">{estDelivery}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <p className="text-xs text-[#73786F]">Tracking No.</p>
                    <p className="font-mono text-xs font-medium text-[#292D28] mt-0.5">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
                <div className="border-t border-[#E8E4D9] pt-3 flex justify-between">
                  <span className="text-[#73786F]">Order Total</span>
                  <span className="font-bold text-[#292D28]">{formatINR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
              <h3 className="text-sm font-semibold text-[#292D28] mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Delivering To
              </h3>
              <address className="not-italic text-sm text-[#73786F] leading-relaxed">
                <strong className="text-[#292D28]">{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                {order.shippingAddress.pincode}
              </address>
            </div>

            {/* Items mini-list */}
            <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
              <h3 className="text-sm font-semibold text-[#292D28] mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Items ({order.items.reduce((a, i) => a + i.quantity, 0)})
              </h3>
              <div className="flex flex-col gap-2.5">
                {order.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`}
                       className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0">
                      <img src={item.thumbnail} alt={item.name} loading="lazy"
                           className="w-full h-full object-cover"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#292D28] truncate">{item.name}</p>
                      <p className="text-xs text-[#73786F]">{item.variantLabel} · Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Packaging notice */}
            <div className="flex items-center gap-2.5 bg-[var(--brand-primary)]/6 rounded-xl
                            border border-[var(--brand-primary)]/15 px-4 py-3">
              <Package size={15} className="text-[var(--brand-primary)] shrink-0" aria-hidden="true" />
              <p className="text-xs text-[#292D28]">
                Packaged in <strong>Resealable Stand-up Pouches</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
