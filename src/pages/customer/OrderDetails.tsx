import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle } from 'lucide-react';
import { useAuth }          from '../../hooks/useAuth';
import { getOrderById }     from '../../data/orders';
import { isCancellable, cancelOrder } from '../../utils/orderUtils';
import { formatINR }        from '../../utils/formatPrice';
import { printInvoice }     from '../../utils/printUtils';
import OrderStatusBadge     from '../../components/orders/OrderStatusBadge';
import OrderItemCard        from '../../components/orders/OrderItemCard';
import OrderSummaryPanel    from '../../components/orders/OrderSummaryPanel';
import ConfirmDialog        from '../../components/common/ConfirmDialog';
import EmptyState           from '../../components/common/EmptyState';
import { useOrderSync } from '../../hooks/useOrderSync';

// ─── Page ─────────────────────────────────────────────────────────────────────

const OrderDetails = () => {
  const { id }                    = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate                  = useNavigate();
  useOrderSync();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [toast,       setToast]       = useState('');

  const order = id ? getOrderById(id) : undefined;

  // Not found
  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <EmptyState
          title="Order Not Found"
          description={`We could not find order ${id ?? ''}. It may have been removed or does not exist.`}
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
          description="You are not authorised to view this order."
          action={<Link to="/my-orders" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">Back to My Orders</Link>}
        />
      </div>
    );
  }

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    const updated = cancelOrder(order);
    setCancelling(false);
    setConfirmOpen(false);
    if (updated) {
      setToast('Your order has been cancelled.');
      setTimeout(() => setToast(''), 3000);
      navigate(`/order-details/${order.id}`, { replace: true });
    }
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--brand-background)] py-8 sm:py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="container max-w-5xl mx-auto px-6">

        {/* Back nav */}
        <Link to="/my-orders"
              className="inline-flex items-center gap-2 text-sm text-[#73786F]
                         hover:text-[var(--brand-primary)] transition-colors mb-6
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)] rounded">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to My Orders
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Order Details
            </h1>
            <p className="text-sm text-[#73786F] mt-0.5">
              <span className="font-mono font-bold text-[#292D28]">{order.orderNumber}</span>
              {' · '}{orderDate}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.status} size="medium" />
            {!['cancelled', 'returned', 'delivered'].includes(order.status) && (
              <Link
                to={`/track-order/${order.id}`}
                className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                           text-sm font-semibold px-4 py-2.5 rounded-xl
                           hover:bg-[var(--brand-dark)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <Truck size={15} aria-hidden="true" />
                Track Order
              </Link>
            )}
            {/* Download Invoice — only for delivered orders belonging to this customer */}
            {order.status === 'delivered' && (
              <button
                type="button"
                onClick={() => printInvoice(order)}
                className="flex items-center gap-2 border border-[var(--brand-primary)] text-[var(--brand-primary)]
                           text-sm font-semibold px-4 py-2.5 rounded-xl
                           hover:bg-[var(--brand-primary)] hover:text-white transition-all
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <CheckCircle size={15} aria-hidden="true" />
                Download Invoice
              </button>
            )}
            {isCancellable(order.status) && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-2 border border-red-300 text-red-600
                           text-sm font-semibold px-4 py-2.5 rounded-xl
                           hover:bg-red-50 transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div role="status" aria-live="polite"
               className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                          rounded-xl px-4 py-3 mb-5 text-sm text-emerald-700">
            <CheckCircle size={15} aria-hidden="true" />{toast}
          </div>
        )}

        {/* Layout grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left — items */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#E8E4D9] p-5">
            <h2 className="text-base font-semibold text-[#292D28] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Items Ordered
            </h2>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <OrderItemCard
                  key={`${item.productId}-${item.variantId}`}
                  item={item}
                />
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#E8E4D9] flex justify-between text-sm">
              <span className="text-[#73786F]">
                {order.items.reduce((a, i) => a + i.quantity, 0)} item{order.items.reduce((a, i) => a + i.quantity, 0) !== 1 ? 's' : ''}
              </span>
              <span className="font-bold text-[#292D28]">{formatINR(order.total)}</span>
            </div>
          </div>

          {/* Right — summary */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <OrderSummaryPanel order={order} />
          </div>
        </div>

        {/* COD disclaimer for cancelled */}
        {order.status === 'cancelled' && order.paymentMethod === 'Cash on Delivery' && (
          <p className="text-xs text-[#73786F] mt-4 bg-white rounded-xl border border-[#E8E4D9]
                        px-4 py-3">
            This order was cancelled. No payment was collected for this Cash on Delivery order.
          </p>
        )}
      </div>

      {/* Cancel confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel This Order?"
        description={`Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default OrderDetails;
