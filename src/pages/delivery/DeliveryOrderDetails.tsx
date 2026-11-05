import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Truck, CheckCircle, MapPin, Phone, Package,
  Clock, AlertCircle, X, Navigation, IndianRupee, User,
  Bike,
} from 'lucide-react';
import { getCurrentDeliveryBoy } from '../../utils/deliveryStore';
import { getOrderById } from '../../data/orders';
import { deliveryBoyTransitionOrder, deliveryBoyRequestCashCollection, deliveryBoyConfirmCashCollected } from '../../utils/orderUtils';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useOrderSync } from '../../hooks/useOrderSync';

// ─── Timeline icon by actor role ──────────────────────────────────────────────

function TimelineIcon({ role }: { role?: string }) {
  if (role === 'delivery') return <Bike size={13} aria-hidden="true" />;
  if (role === 'admin')    return <User size={13} aria-hidden="true" />;
  return <CheckCircle size={13} aria-hidden="true" />;
}

// ─── COD amount banner ────────────────────────────────────────────────────────

function CodBanner({ total, collected }: { total: number; collected: boolean }) {
  if (collected) {
    return (
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200
                      rounded-xl px-4 py-3 text-sm text-emerald-800">
        <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" aria-hidden="true" />
        <div>
          <p className="font-semibold">Cash collected — awaiting admin verification</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Admin will confirm ₹{total.toLocaleString('en-IN')} has been received and mark payment as Paid.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200
                    rounded-xl px-4 py-3 text-sm text-amber-900">
      <IndianRupee size={16} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
      <div>
        <p className="font-semibold">
          Collect ₹{total.toLocaleString('en-IN')} cash on delivery
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Do <strong>not</strong> mark as paid — admin verifies collection separately.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliveryOrderDetails() {
  const { id }     = useParams<{ id: string }>();
  const boy        = getCurrentDeliveryBoy();
  const syncKey    = useOrderSync();

  const [confirmDeliver, setConfirmDeliver] = useState(false);
  const [deliveryNote,   setDeliveryNote]   = useState('');
  const [busy,           setBusy]           = useState(false);
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

  // Payment fallback state
  const [showCashRequest,    setShowCashRequest]    = useState(false);
  const [cashRequestReason,   setCashRequestReason]   = useState('');
  const [showCashConfirm,     setShowCashConfirm]    = useState(false);
  const [cashConfirmNote,     setCashConfirmNote]     = useState('');

  // ── Live order read — re-runs on cross-tab storage change ─────────────────
  const order = useMemo(() => {
    void syncKey;
    return id ? getOrderById(id) : undefined;
  }, [id, syncKey]);

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
        <p className="text-base font-semibold text-[#292D28]">Order not found</p>
        <Link to="/delivery/orders"
              className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!boy || order.deliveryBoyId !== boy.id) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle size={36} className="text-red-500" />
        <p className="text-base font-semibold text-[#292D28]">Access Denied</p>
        <p className="text-sm text-[#73786F]">This order is not assigned to you.</p>
        <Link to="/delivery/orders"
              className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  // ── Workflow flags ────────────────────────────────────────────────────────
  // packed OR shipped → delivery boy can start ("Out for Delivery")
  const canStartDelivery = order.status === 'packed' || order.status === 'shipped';
  const canMarkDelivered = order.status === 'out-for-delivery';
  const isDelivered      = order.status === 'delivered';

  const isCod            = order.paymentMethod === 'Cash on Delivery';
  const codCollected     = Boolean(order.codCollectedAt) || Boolean(order.cashCollection);
  const isNonCashPending = order.paymentStatus === 'pending' && !isCod;
  const canRequestCash   = isNonCashPending && !canStartDelivery; // can request cash once order is in delivery workflow
  const canConfirmCash   = isCod && !codCollected && order.paymentStatus === 'pending';

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStartDelivery = async () => {
    if (!boy || busy) return;
    setBusy(true);
    const result = deliveryBoyTransitionOrder(order.id, boy.id, boy.name, 'out-for-delivery');
    setBusy(false);
    if (result.ok) {
      showToast('Order marked as Out for Delivery.');
    } else {
      showToast(result.error ?? 'Could not update order.', false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!boy || busy) return;
    setBusy(true);
    const result = deliveryBoyTransitionOrder(
      order.id, boy.id, boy.name, 'delivered',
      deliveryNote.trim() || undefined,
    );
    setBusy(false);
    setConfirmDeliver(false);
    setDeliveryNote('');
    if (result.ok) {
      showToast(isCod ? 'Delivered! Remember to hand over the cash to admin.' : 'Order marked as Delivered.');
    } else {
      showToast(result.error ?? 'Could not update order.', false);
    }
  };

  // ── Payment fallback: request cash collection ────────────────────────────
  const handleCashRequest = async () => {
    if (!boy || busy) return;
    if (!cashRequestReason.trim()) {
      showToast('Please provide a reason for switching to cash.', false);
      return;
    }
    setBusy(true);
    const result = deliveryBoyRequestCashCollection(
      order.id, boy.id, boy.name, cashRequestReason,
    );
    setBusy(false);
    setShowCashRequest(false);
    setCashRequestReason('');
    if (result.ok) {
      showToast('Payment method changed to Cash on Delivery. Admin will be notified.');
    } else {
      showToast(result.error ?? 'Could not change payment method.', false);
    }
  };

  // ── Payment fallback: confirm cash collected ──────────────────────────────
  const handleCashConfirm = async () => {
    if (!boy || busy) return;
    setBusy(true);
    const result = deliveryBoyConfirmCashCollected(
      order.id, boy.id, boy.name, cashConfirmNote.trim() || undefined,
    );
    setBusy(false);
    setShowCashConfirm(false);
    setCashConfirmNote('');
    if (result.ok) {
      showToast('Cash collection confirmed. Admin will verify the payment.');
    } else {
      showToast(result.error ?? 'Could not confirm cash collection.', false);
    }
  };

  const addr = order.shippingAddress;

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link to="/delivery/orders"
              className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F]
                         hover:bg-[var(--brand-background)] hover:text-[#292D28]
                         transition-colors shrink-0
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
              aria-label="Back to orders">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Order Details
          </h1>
          <p className="text-xs font-mono text-[#73786F]">{order.orderNumber}</p>
        </div>
        <OrderStatusBadge status={order.status} size="medium" />
      </div>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div role="status" aria-live="polite"
             className={[
               'flex items-center gap-2 rounded-xl px-4 py-3 text-sm border',
               toast.ok
                 ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                 : 'bg-red-50 border-red-200 text-red-800',
             ].join(' ')}>
          {toast.ok
            ? <CheckCircle size={15} aria-hidden="true" />
            : <AlertCircle size={15} aria-hidden="true" />}
          {toast.msg}
        </div>
      )}

      {/* ── COD collection banner ────────────────────────────────────────── */}
      {isCod && (canMarkDelivered || isDelivered) && (
        <CodBanner total={order.total} collected={codCollected} />
      )}

      {/* ── Payment fallback actions ──────────────────────────────────────── */}
      {(canRequestCash || canConfirmCash) && (
        <div className="flex flex-col gap-2">
          {/* Request cash (fallback from UPI/Online) */}
          {canRequestCash && (
            <button
              type="button"
              onClick={() => setShowCashRequest(true)}
              disabled={busy}
              className="flex items-center justify-center gap-2 border border-amber-400 text-amber-700
                         bg-amber-50 font-semibold text-sm py-3 rounded-xl
                         hover:bg-amber-100 transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <IndianRupee size={16} aria-hidden="true" />
              Switch to Cash Collection
            </button>
          )}

          {/* Confirm cash collected (for COD or after switching to cash) */}
          {canConfirmCash && (
            <button
              type="button"
              onClick={() => setShowCashConfirm(true)}
              disabled={busy}
              className="flex items-center justify-center gap-2 border border-emerald-500 text-emerald-700
                         bg-emerald-50 font-semibold text-sm py-3 rounded-xl
                         hover:bg-emerald-100 transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <CheckCircle size={16} aria-hidden="true" />
              Confirm Cash Collected
            </button>
          )}
        </div>
      )}

      {/* ── Cash collection confirmed banner ─────────────────────────────── */}
      {codCollected && order.paymentStatus !== 'paid' && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200
                        rounded-xl px-4 py-3 text-sm text-blue-800">
          <CheckCircle size={16} className="shrink-0 mt-0.5 text-blue-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">Cash collected — awaiting admin verification</p>
            <p className="text-xs text-blue-700 mt-0.5">
              ₹{order.total.toLocaleString('en-IN')} collected. Admin will verify and mark payment as Paid.
            </p>
          </div>
        </div>
      )}

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      {(canStartDelivery || canMarkDelivered) && (
        <div className="flex gap-3">
          {canStartDelivery && (
            <button
              type="button"
              onClick={handleStartDelivery}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand-primary)]
                         text-white font-semibold text-sm py-3.5 rounded-xl
                         hover:bg-[var(--brand-dark)] transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              {busy
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Truck size={18} aria-hidden="true" />}
              Out for Delivery
            </button>
          )}
          {canMarkDelivered && (
            <button
              type="button"
              onClick={() => setConfirmDeliver(true)}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600
                         text-white font-semibold text-sm py-3.5 rounded-xl
                         hover:bg-emerald-700 transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <CheckCircle size={18} aria-hidden="true" />
              Mark as Delivered
            </button>
          )}
        </div>
      )}

      {/* ── Delivered confirmation strip ─────────────────────────────────── */}
      {isDelivered && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200
                        rounded-xl px-4 py-3 text-sm text-emerald-800">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Delivery complete</p>
            {order.codVerifiedAt
              ? <p className="text-xs text-emerald-700 mt-0.5">
                  Payment verified by {order.codVerifiedBy} on{' '}
                  {new Date(order.codVerifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              : isCod
                ? <p className="text-xs text-emerald-700 mt-0.5">
                    Awaiting admin payment verification.
                  </p>
                : null}
          </div>
        </div>
      )}

      {/* ── Customer + address ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
        <h2 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Customer &amp; Delivery Address
        </h2>

        <p className="text-base font-semibold text-[#292D28]">{addr.fullName}</p>

        {/* Large tap-target click-to-call */}
        <a href={`tel:${addr.phone}`}
           className="flex items-center justify-center gap-2 w-full bg-[var(--brand-primary)]
                      text-white font-semibold text-sm py-3 rounded-xl
                      hover:bg-[var(--brand-dark)] transition-colors mt-2
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[var(--brand-accent)]">
          <Phone size={18} aria-hidden="true" />
          Call {addr.fullName} — {addr.phone}
        </a>

        <p className="text-sm text-[#73786F] leading-relaxed mt-3">
          {addr.addressLine1}
          {addr.addressLine2 && `, ${addr.addressLine2}`}
          <br />
          {addr.city}, {addr.state} — {addr.pincode}
        </p>

        {/* Open in OpenStreetMap */}
        <a
          href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(
            typeof addr.lat === 'number' && typeof addr.lng === 'number'
              ? `${addr.lat},${addr.lng}`
              : [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode, 'India']
                  .filter(Boolean).join(', ')
          )}&zoom=16`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full border border-[var(--brand-primary)]
                     text-[var(--brand-primary)] font-semibold text-sm py-3 rounded-xl
                     hover:bg-[var(--brand-primary)] hover:text-white transition-all mt-2
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          <Navigation size={16} aria-hidden="true" />
          Open in Maps
        </a>
      </div>

      {/* ── Items ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
        <h2 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
          <Package size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Items ({order.items.length})
        </h2>
        <div className="flex flex-col gap-2.5">
          {order.items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`}
                 className="flex items-center gap-3 p-3 bg-[var(--brand-background)]
                            rounded-xl border border-[#E8E4D9]">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-[#E8E4D9]">
                <img src={item.thumbnail} alt={item.name} loading="lazy"
                     className="w-full h-full object-cover"
                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#292D28] truncate">{item.name}</p>
                <p className="text-xs text-[#73786F]">{item.variantLabel} · Qty {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment info ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
        <h2 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
          <IndianRupee size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Payment
        </h2>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#73786F]">Method</span>
            <span className="font-medium text-[#292D28]">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#73786F]">Status</span>
            <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending Collection'}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-[#E8E4D9] pt-2 mt-1">
            <span className="text-[#292D28]">Total</span>
            <span className="text-[var(--brand-primary)]">₹{order.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {isCod && order.codVerifiedBy && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200
                        rounded-lg px-3 py-2 mt-3">
            ✓ Verified by {order.codVerifiedBy}
            {order.codVerifiedAt &&
              ` on ${new Date(order.codVerifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
          </p>
        )}
      </div>

      {/* ── Order Timeline ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
        <h2 className="text-sm font-semibold text-[#292D28] mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Timeline
        </h2>
        <div className="flex flex-col" role="list">
          {order.timeline.map((entry, idx) => {
            const isLast = idx === order.timeline.length - 1;
            return (
              <div key={idx} className="flex items-start gap-3" role="listitem">
                {/* Icon + connector line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={[
                    'w-7 h-7 rounded-full flex items-center justify-center',
                    isLast
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]',
                  ].join(' ')}>
                    <TimelineIcon role={entry.actorRole} />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 min-h-[20px] bg-[#E8E4D9] my-1"
                         aria-hidden="true" />
                  )}
                </div>

                {/* Text */}
                <div className="pb-4 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#292D28] capitalize">
                    {entry.status.replace(/-/g, ' ')}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-[#73786F] mt-0.5">{entry.note}</p>
                  )}
                  {entry.updatedBy && (
                    <p className="text-[10px] text-[#73786F] mt-0.5 flex items-center gap-1">
                      {entry.actorRole === 'delivery'
                        ? <Bike size={10} aria-hidden="true" />
                        : entry.actorRole === 'admin'
                          ? <User size={10} aria-hidden="true" />
                          : null}
                      {entry.updatedBy}
                    </p>
                  )}
                  <p className="text-xs text-[var(--brand-primary)] font-medium mt-0.5">
                    {new Date(entry.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Confirm Delivery modal ───────────────────────────────────────── */}
      {confirmDeliver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => { if (!busy) setConfirmDeliver(false); }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6
                       animate-[slideUp_200ms_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#292D28]"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Confirm Delivery
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDeliver(false)}
                disabled={busy}
                className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
                aria-label="Close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-[#73786F] mb-1">
              Mark order <strong className="text-[#292D28]">{order.orderNumber}</strong> as delivered?
            </p>

            {/* COD reminder inside the confirmation modal */}
            {isCod && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200
                              rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-800">
                <IndianRupee size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  Collect <strong>₹{order.total.toLocaleString('en-IN')}</strong> in cash before confirming.
                  Admin will verify the collection separately.
                </p>
              </div>
            )}

            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Delivery note <span className="text-[#73786F] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="e.g. Handed to customer at door…"
              disabled={busy}
              className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm
                         text-[#292D28] bg-white placeholder:text-[#73786F]/60 resize-none
                         focus:outline-none focus:border-[var(--brand-primary)]
                         focus:ring-2 focus:ring-[var(--brand-primary)]/10
                         disabled:opacity-60"
            />

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleConfirmDelivery}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600
                           text-white font-semibold text-sm py-3 rounded-xl
                           hover:bg-emerald-700 transition-colors
                           disabled:opacity-60 disabled:cursor-not-allowed
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                {busy
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <CheckCircle size={15} aria-hidden="true" />}
                Confirm Delivery
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeliver(false)}
                disabled={busy}
                className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold
                           text-sm py-3 rounded-xl hover:bg-[var(--brand-background)]
                           disabled:opacity-60 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cash collection request modal (fallback from UPI/Online) ─────── */}
      {showCashRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
             onClick={() => { if (!busy) setShowCashRequest(false); }}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#292D28]"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Switch to Cash Collection
              </h3>
              <button type="button" onClick={() => setShowCashRequest(false)} disabled={busy}
                      className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]"
                      aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#73786F] mb-3">
              Change payment from <strong className="text-[#292D28]">{order.paymentMethod}</strong> to{' '}
              <strong className="text-[#292D28]">Cash on Delivery</strong>?
            </p>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Reason <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea rows={3} value={cashRequestReason}
                      onChange={(e) => setCashRequestReason(e.target.value)}
                      placeholder="e.g. Customer unable to complete UPI payment, UPI app not working…"
                      disabled={busy}
                      className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm
                                 text-[#292D28] bg-white placeholder:text-[#73786F]/60 resize-none
                                 focus:outline-none focus:border-[var(--brand-primary)]
                                 focus:ring-2 focus:ring-[var(--brand-primary)]/10
                                 disabled:opacity-60" />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={handleCashRequest} disabled={busy || !cashRequestReason.trim()}
                      className="flex-1 bg-amber-600 text-white font-semibold text-sm py-3 rounded-xl
                                 hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
                {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Confirm Switch'}
              </button>
              <button type="button" onClick={() => setShowCashRequest(false)} disabled={busy}
                      className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-3 rounded-xl
                                 hover:bg-[var(--brand-background)] disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm cash collected modal ─────────────────────────────────── */}
      {showCashConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
             onClick={() => { if (!busy) setShowCashConfirm(false); }}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#292D28]"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Confirm Cash Collected
              </h3>
              <button type="button" onClick={() => setShowCashConfirm(false)} disabled={busy}
                      className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]"
                      aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200
                            rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-800">
              <IndianRupee size={13} className="shrink-0 mt-0.5" />
              <p>
                Confirm you collected <strong>₹{order.total.toLocaleString('en-IN')}</strong> in cash.
                Payment will remain <strong>Pending Admin Verification</strong> — admin must verify before marking as Paid.
              </p>
            </div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Collection note <span className="text-[#73786F] font-normal">(optional)</span>
            </label>
            <textarea rows={2} value={cashConfirmNote}
                      onChange={(e) => setCashConfirmNote(e.target.value)}
                      placeholder="e.g. Cash received at doorstep…"
                      disabled={busy}
                      className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm
                                 text-[#292D28] bg-white placeholder:text-[#73786F]/60 resize-none
                                 focus:outline-none focus:border-[var(--brand-primary)]
                                 focus:ring-2 focus:ring-[var(--brand-primary)]/10
                                 disabled:opacity-60" />
            <div className="flex gap-3 mt-4">
              <button type="button" onClick={handleCashConfirm} disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600
                                 text-white font-semibold text-sm py-3 rounded-xl
                                 hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
                {busy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       : <><CheckCircle size={15} />Confirm Collected</>}
              </button>
              <button type="button" onClick={() => setShowCashConfirm(false)} disabled={busy}
                      className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-3 rounded-xl
                                 hover:bg-[var(--brand-background)] disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
