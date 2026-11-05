import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Check, Package, MapPin, User,
  CreditCard, Clock, CheckCircle, X, AlertTriangle,
  Truck, ChevronRight, FileText, Printer, Bike,
  IndianRupee, Edit2, XCircle,
} from 'lucide-react';
import { getOrderById } from '../../data/orders';
import { updateOrderInStorage, adminChangePaymentMethod, adminVerifyCashPayment, adminRejectCashCollection } from '../../utils/orderUtils';
import { formatINR } from '../../utils/formatPrice';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { printInvoice, printShippingLabel, printWalkInSaleBill } from '../../utils/printUtils';
import { getAllDeliveryBoys, getDeliveryBoyById } from '../../utils/deliveryStore';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useOrderSync } from '../../hooks/useOrderSync';
import type { Order, OrderStatus } from '../../types';

// ─── Status transition rules ──────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:           ['confirmed', 'cancelled'],
  confirmed:         ['processing', 'cancelled'],
  processing:        ['packed', 'shipped', 'cancelled'],
  packed:            ['shipped', 'cancelled'],
  shipped:           ['out-for-delivery'],
  'out-for-delivery':['delivered'],
  delivered:         ['returned'],
  cancelled:         [],
  returned:          [],
};

const STATUS_ACTIONS: Record<OrderStatus, { to: OrderStatus; label: string; color: string }[]> = {
  pending:           [{ to: 'confirmed',         label: 'Confirm Order',      color: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  confirmed:         [{ to: 'processing',         label: 'Start Processing',   color: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-dark)] text-white' }],
  processing:        [{ to: 'packed',             label: 'Mark as Packed',     color: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-dark)] text-white' },
                     { to: 'shipped',             label: 'Mark as Shipped',    color: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-dark)] text-white' }],
  packed:            [{ to: 'shipped',            label: 'Mark as Shipped',    color: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-dark)] text-white' }],
  shipped:           [{ to: 'out-for-delivery',   label: 'Out for Delivery',   color: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-dark)] text-white' }],
  'out-for-delivery':[{ to: 'delivered',          label: 'Mark as Delivered',  color: 'bg-emerald-600 hover:bg-emerald-700 text-white' }],
  delivered:         [{ to: 'returned',           label: 'Mark as Returned',   color: 'bg-purple-600 hover:bg-purple-700 text-white' }],
  cancelled:         [],
  returned:          [],
};

const STATUS_ICONS: Partial<Record<OrderStatus, React.ReactNode>> = {
  pending:           <Clock        size={16} className="text-amber-500"    aria-hidden="true" />,
  confirmed:         <CheckCircle  size={16} className="text-blue-500"     aria-hidden="true" />,
  processing:        <Package      size={16} className="text-blue-600"     aria-hidden="true" />,
  shipped:           <Truck        size={16} className="text-[var(--brand-primary)]"    aria-hidden="true" />,
  'out-for-delivery':<Truck        size={16} className="text-emerald-500"  aria-hidden="true" />,
  delivered:         <CheckCircle  size={16} className="text-emerald-600"  aria-hidden="true" />,
  cancelled:         <X            size={16} className="text-red-500"      aria-hidden="true" />,
  returned:          <ChevronRight size={16} className="text-purple-500"   aria-hidden="true" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E8E4D9] bg-[var(--brand-background)]">
      <span className="text-[var(--brand-primary)]">{icon}</span>
      <h3 className="text-sm font-semibold text-[#292D28]">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-[#73786F] shrink-0">{label}</span>
    <span className={`text-right text-[#292D28] ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</span>
  </div>
);

// ─── Status Note Modal ────────────────────────────────────────────────────────

interface StatusNoteModalProps {
  title:    string;
  label:    string;
  onSave:   (note: string) => void;
  onCancel: () => void;
  required?: boolean;
}

function StatusNoteModal({ title, label, onSave, onCancel, required }: StatusNoteModalProps) {
  const [note, setNote] = useState('');
  const [err,  setErr]  = useState('');

  const handleSave = () => {
    if (required && !note.trim()) { setErr('This field is required.'); return; }
    onSave(note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
           onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[#292D28] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => { setNote(e.target.value); setErr(''); }}
          placeholder="Add a note (optional)…"
          className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28]
                     bg-white placeholder:text-[#73786F]/60 resize-none
                     focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
        />
        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={handleSave}
                  className="flex-1 bg-[var(--brand-primary)] text-white font-semibold text-sm py-2.5 rounded-xl
                             hover:bg-[var(--brand-dark)] transition-colors focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            Confirm
          </button>
          <button type="button" onClick={onCancel}
                  className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-2.5 rounded-xl hover:bg-[var(--brand-background)]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderDetails() {
  const { id }      = useParams<{ id: string }>();
  const syncKey = useOrderSync();
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const order = useMemo(() => { void refreshKey; void syncKey; return id ? getOrderById(id) : undefined; }, [id, refreshKey, syncKey]);

  const { admin } = useAdminAuth();

  const [pendingAction, setPendingAction] = useState<{
    newStatus: OrderStatus; title: string; noteLabel: string; noteRequired: boolean;
  } | null>(null);
  const [toast, setToast] = useState('');

  // Delivery boy assignment
  const activeDeliveryBoys = getAllDeliveryBoys().filter((b) => b.isActive);
  const canAssign = order && order.orderSource !== 'walk_in_sale' && ['packed', 'shipped', 'out-for-delivery'].includes(order.status);
  const [assignBoyId, setAssignBoyId] = useState('');

  const handleAssign = () => {
    if (!order || !assignBoyId) return;
    const boy = getDeliveryBoyById(assignBoyId);
    if (!boy) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      deliveryBoyId: boy.id,
      deliveryBoyName: boy.name,
      assignedAt: now,
      assignedBy: admin?.name ?? 'admin',
      assignmentHistory: [...(order.assignmentHistory ?? []).map((entry) =>
        !entry.unassignedAt ? { ...entry, unassignedAt: now } : entry
      ), {
        deliveryBoyId: boy.id, deliveryBoyName: boy.name,
        assignedAt: now, assignedBy: admin?.name ?? 'admin',
      }],
      updatedAt: now,
      timeline: [...order.timeline, { status: order.status, timestamp: now, updatedBy: admin?.name ?? 'admin', actorId: admin?.id, actorRole: 'admin' as const, note: `Assigned to ${boy.name}.` }],
    };
    updateOrderInStorage(updated);
    setRefreshKey((k) => k + 1);
    setAssignBoyId('');
    showToast(`Order assigned to ${boy.name}.`);
  };

  const handleUnassign = () => {
    if (!order) return;
    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      deliveryBoyId: undefined,
      deliveryBoyName: undefined,
      assignedAt: undefined,
      assignedBy: undefined,
      assignmentHistory: (order.assignmentHistory ?? []).map((assignment, index, all) =>
        index === all.length - 1 && !assignment.unassignedAt ? { ...assignment, unassignedAt: now } : assignment
      ),
      updatedAt: now,
      timeline: [...order.timeline, { status: order.status, timestamp: now, updatedBy: admin?.name ?? 'admin', actorId: admin?.id, actorRole: 'admin' as const, note: 'Delivery boy unassigned.' }],
    };
    updateOrderInStorage(updated);
    setRefreshKey((k) => k + 1);
    showToast('Delivery boy unassigned.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Status change ─────────────────────────────────────────────────────────

  const applyStatusChange = useCallback((newStatus: OrderStatus, note: string) => {
    if (!order) return;
    if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) return;

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      status:    newStatus,
      updatedAt: now,
      timeline:  [
        ...order.timeline,
        {
          status:    newStatus,
          timestamp: now,
          updatedBy: admin?.name ?? 'Admin',
          actorId:   admin?.id,
          actorRole: 'admin' as const,
          note:      note || `Status updated to ${newStatus} by admin.`,
        },
      ],
    };
    updateOrderInStorage(updated);
    setRefreshKey((k) => k + 1);
    setPendingAction(null);
    showToast(`Order status updated to ${newStatus}.`);
  }, [order, admin]);

  const handleActionClick = (to: OrderStatus) => {
    const actionLabel = STATUS_ACTIONS[order!.status].find((a) => a.to === to)?.label ?? '';
    const isCancelOrReturn = to === 'cancelled' || to === 'returned';
    setPendingAction({
      newStatus:    to,
      title:        actionLabel,
      noteLabel:    isCancelOrReturn ? 'Reason (required)' : 'Note (optional)',
      noteRequired: isCancelOrReturn,
    });
  };

  // ── Cash payment verification ───────────────────────────────────────────────

  const [showPayModal, setShowPayModal] = useState(false);
  const [showChangePayModal, setShowChangePayModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const markCODPaid = (note: string) => {
    if (!order || !admin) return;
    const result = adminVerifyCashPayment(order.id, admin.name, admin.id, note);
    if (result.ok) {
      setRefreshKey((k) => k + 1);
      setShowPayModal(false);
      showToast('Cash payment verified and marked as Paid.');
    } else {
      setShowPayModal(false);
      showToast(result.error ?? 'Verification failed.');
    }
  };

  // New payment method selection state
  const [newPayMethod, setNewPayMethod] = useState('');

  const handlePaymentMethodChange = (note: string) => {
    if (!order || !admin || !newPayMethod) return;
    const result = adminChangePaymentMethod(order.id, admin.name, admin.id, newPayMethod, note);
    if (result.ok) {
      setRefreshKey((k) => k + 1);
      setShowChangePayModal(false);
      setNewPayMethod('');
      showToast(`Payment method changed to ${newPayMethod}.`);
    } else {
      setShowChangePayModal(false);
      setNewPayMethod('');
      showToast(result.error ?? 'Could not change payment method.');
    }
  };

  const handleRejectCollection = (note: string) => {
    if (!order || !admin) return;
    const result = adminRejectCashCollection(order.id, admin.name, admin.id, note);
    if (result.ok) {
      setRefreshKey((k) => k + 1);
      setShowRejectModal(false);
      showToast('Cash collection rejected. Payment remains pending.');
    } else {
      setShowRejectModal(false);
      showToast(result.error ?? 'Could not reject collection.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
        <p className="text-base font-semibold text-[#292D28]">Order not found</p>
        <p className="text-sm text-[#73786F]">The order ID may be invalid.</p>
        <Link to="/admin/orders" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const canCancel  = VALID_TRANSITIONS[order.status]?.includes('cancelled');
  const isCash     = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'Cash';
  // Cash pending: show Verify button after delivery (or for walk-in sales)
  const cashPending = isCash && order.paymentStatus === 'pending' &&
    (order.status === 'delivered' || order.orderSource === 'walk_in_sale');
  const actions    = STATUS_ACTIONS[order.status] ?? [];
  const canChangePayment = order.paymentStatus !== 'paid' && order.status !== 'cancelled';

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to="/admin/orders"
                className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors shrink-0 mt-0.5">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Order Details
            </h1>
            <p className="text-xs font-mono text-[#73786F] mt-0.5">{order.orderNumber}</p>
            <p className="text-xs text-[#73786F]">
              Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} size="medium" />
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite"
             className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                        rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={15} />{toast}
        </div>
      )}

      {/* ── Status action buttons ──────────────────────── */}
      {(actions.length > 0 || canCancel || cashPending || (canChangePayment && !cashPending)) && (
        <div className="flex flex-wrap gap-2">
          {actions.map(({ to, label, color }) => (
            <button key={to} type="button" onClick={() => handleActionClick(to)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5
                               rounded-lg transition-colors focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] ${color}`}>
              <Check size={15} />{label}
            </button>
          ))}

          {canCancel && (
            <button type="button" onClick={() => handleActionClick('cancelled')}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg
                               border border-red-300 text-red-600 hover:bg-red-50 transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
              <X size={15} />Cancel Order
            </button>
          )}

          {order.orderSource === 'walk_in_sale' ? (
            <button type="button" onClick={() => printWalkInSaleBill(order)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border border-[#E8E4D9] text-[var(--brand-primary)] hover:bg-[var(--brand-background)]">
              <Printer size={15} />Print Sale Bill
            </button>
          ) : (
          <>
          <button type="button" onClick={() => printInvoice(order)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border border-[#E8E4D9] text-[var(--brand-primary)] hover:bg-[var(--brand-background)]">
            <Printer size={15} />Print Invoice
          </button>
          <button
            type="button"
            onClick={() => printShippingLabel(order)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg
                       border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
          >
            <Printer size={15} aria-hidden="true" />
            Print Shipping Label
          </button>
          </>
          )}

          {cashPending && (
            <button type="button" onClick={() => setShowPayModal(true)}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg
                               bg-emerald-600 text-white hover:bg-emerald-700 transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
              <IndianRupee size={15} />Verify Cash Payment
            </button>
          )}

          {canChangePayment && !cashPending && (
            <button type="button" onClick={() => { setNewPayMethod(''); setShowChangePayModal(true); }}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg
                               border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-colors
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
              <Edit2 size={15} />Change Payment Method
            </button>
          )}
        </div>
      )}

      {/* ── Delivery boy assignment ──────────────────────── */}
      {order && (
        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
          <h2 className="text-sm font-semibold text-[#292D28] mb-4 flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}>
            <Bike size={16} className="text-[var(--brand-primary)]" />Delivery Boy Assignment
          </h2>

          {order.deliveryBoyId ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{order.deliveryBoyName?.charAt(0).toUpperCase() ?? '?'}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#292D28]">{order.deliveryBoyName}</p>
                  <p className="text-xs text-[#73786F]">
                    Assigned {order.assignedAt ? new Date(order.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    {order.assignedBy && ` by ${order.assignedBy}`}
                  </p>
                </div>
              </div>
              {canAssign && (
                <button type="button" onClick={handleUnassign}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <X size={13} />Unassign
                </button>
              )}
            </div>
          ) : canAssign ? (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-[#73786F] mb-1 block">Select Delivery Boy</label>
                <select value={assignBoyId} onChange={(e) => setAssignBoyId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10">
                  <option value="">Choose a delivery boy…</option>
                  {activeDeliveryBoys.map((boy) => (
                    <option key={boy.id} value={boy.id}>{boy.name} ({boy.phone})</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleAssign} disabled={!assignBoyId}
                      className="flex items-center gap-2 bg-[var(--brand-primary)] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Check size={15} />Assign
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#73786F]">
              {['cancelled', 'returned'].includes(order.status)
                ? 'Cannot assign cancelled or returned orders.'
                : 'Orders can be assigned once they reach the Shipped status.'}
            </p>
          )}
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

        {/* Left — items + timeline */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Order items */}
          <SectionCard title="Items Ordered" icon={<Package size={16} />}>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`}
                     className="flex items-center gap-3.5 p-3 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E8E4D9]">
                    <img src={item.thumbnail} alt={item.name} loading="lazy"
                         className="w-full h-full object-cover"
                         onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#292D28] truncate">{item.name}</p>
                    <p className="text-xs text-[#73786F]">
                      {item.variantLabel} · Resealable Pouch · Qty {item.quantity}
                    </p>
                    <p className="text-xs font-semibold text-[var(--brand-primary)] mt-0.5">
                      {formatINR(item.price)} × {item.quantity} = {formatINR(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Order Timeline */}
          <SectionCard title="Order Timeline" icon={<Clock size={16} />}>
            <div className="flex flex-col" role="list">
              {order.timeline.map((entry, idx) => {
                const isLast = idx === order.timeline.length - 1;
                return (
                  <div key={idx} className="flex items-start gap-4" role="listitem">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={[
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        isLast ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]',
                      ].join(' ')}>
                        {STATUS_ICONS[entry.status] ?? <Check size={14} />}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 min-h-[24px] bg-[#E8E4D9] my-1" />
                      )}
                    </div>
                    <div className="pb-5 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#292D28] capitalize">
                        {entry.status.replace('-', ' ')}
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
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right — customer, address, payment, price */}
        <div className="flex flex-col gap-5">

          {/* Customer */}
          <SectionCard title="Customer" icon={<User size={16} />}>
            <div className="flex flex-col gap-2.5">
              <InfoRow label="Name"   value={order.shippingAddress.fullName} />
              <InfoRow label="Phone"  value={
                <a href={`tel:${order.shippingAddress.phone}`}
                   className="text-[var(--brand-primary)] hover:underline font-medium">
                  📞 {order.shippingAddress.phone}
                </a>
              } />
              <InfoRow label="User ID" value={order.userId} mono />
            </div>
          </SectionCard>

          {/* Delivery address */}
          <SectionCard title="Delivery Address" icon={<MapPin size={16} />}>
            <address className="not-italic text-sm text-[#73786F] leading-relaxed">
              <strong className="text-[#292D28]">{order.shippingAddress.fullName}</strong><br />
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state}<br />
              PIN: {order.shippingAddress.pincode}<br />
              📞 {order.shippingAddress.phone}
            </address>
          </SectionCard>

          {/* Payment summary */}
          <SectionCard title="Payment Summary" icon={<CreditCard size={16} />}>
            <div className="flex flex-col gap-2.5">
              <InfoRow label="Subtotal"
                       value={formatINR(order.subtotal)} />
              {order.discount > 0 && (
                <InfoRow label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                         value={<span className="text-emerald-600">−{formatINR(order.discount)}</span>} />
              )}
              <InfoRow label="Delivery"
                       value={order.shippingCharge === 0
                         ? <span className="text-emerald-600">Free</span>
                         : formatINR(order.shippingCharge)} />
              <InfoRow label="GST (5%)"  value={formatINR(order.tax)} />
              <div className="border-t border-[#E8E4D9] pt-2.5 flex justify-between">
                <span className="font-bold text-[#292D28]">Total</span>
                <span className="font-bold text-[var(--brand-primary)] text-base">{formatINR(order.total)}</span>
              </div>
            </div>
          </SectionCard>

          {/* Payment status */}
          <SectionCard title="Payment Details" icon={<FileText size={16} />}>
            <div className="flex flex-col gap-2.5">
              <InfoRow label="Method" value={order.paymentMethod} />
              <InfoRow label="Status"
                       value={
                         <span className={[
                           'text-xs font-semibold px-2.5 py-1 rounded-full',
                           order.paymentStatus === 'paid'     ? 'bg-emerald-50 text-emerald-700'
                           : order.paymentStatus === 'refunded' ? 'bg-blue-50 text-blue-700'
                           :                                      'bg-amber-50 text-amber-700',
                         ].join(' ')}>
                           {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                         </span>
                       } />
          {isCash && order.paymentStatus === 'pending' && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <AlertTriangle size={12} className="inline mr-1" />
                  {order.cashCollection
                    ? <>Cash collected by delivery boy. Click <strong>Verify Cash Payment</strong> above after confirming the cash is in hand, or <strong>Reject Collection</strong> if there is a discrepancy.</>
                    : order.orderSource === 'walk_in_sale'
                      ? <>Record the payment method and verify cash collection above after receiving it.</>
                      : <>Cash payment not yet collected. Once the order is delivered, verify cash collection above.</>
                  }
                </div>
              )}
              {/* Cash collection confirmation from delivery boy */}
              {order.cashCollection && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                  <Bike size={12} className="inline mr-1" />
                  Cash ₹{order.cashCollection.amount.toLocaleString('en-IN')} collected by {order.cashCollection.confirmedBy} on{' '}
                  {new Date(order.cashCollection.confirmedAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {order.cashCollection.note && <p className="mt-1 text-blue-700">Note: {order.cashCollection.note}</p>}
                  {order.paymentStatus === 'pending' && (
                    <button type="button" onClick={() => setShowRejectModal(true)}
                            className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      <XCircle size={11} />Reject Collection
                    </button>
                  )}
                </div>
              )}
              {/* Payment verified */}
              {order.paymentStatus === 'paid' && (order.codVerifiedBy || order.cashCollectionVerifiedBy) && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <CheckCircle size={12} className="inline mr-1" />
                  Verified by <strong>{order.codVerifiedBy ?? order.cashCollectionVerifiedBy}</strong>
                  {(order.codVerifiedAt ?? order.cashCollectionVerifiedAt) && (
                    <> on {new Date(order.codVerifiedAt ?? order.cashCollectionVerifiedAt ?? '').toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</>
                  )}
                </div>
              )}
              {/* Non-cash pending payment info */}
              {!isCash && order.paymentStatus !== 'paid' && (
                <div className="mt-1 p-3 bg-[var(--brand-background)] border border-[#E8E4D9] rounded-xl text-xs text-[#73786F]">
                  {order.paymentMethod === 'UPI QR Payment'
                    ? 'UPI QR payment — customer scans and pays via UPI app. Payment stays pending until manually verified. Use Change Payment Method if customer cannot pay online.'
                    : order.paymentMethod === 'Online Payment'
                      ? 'Online payment (demo) — no real gateway integrated. Payment stays pending until manually verified.'
                      : 'Payment stays pending until manually verified.'}
                </div>
              )}
              {/* Payment method change history */}
              {order.paymentMethodHistory && order.paymentMethodHistory.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--brand-background)] border border-[#E8E4D9] rounded-xl">
                  <p className="text-xs font-semibold text-[#292D28] mb-2 flex items-center gap-1.5">
                    <Edit2 size={11} />Payment Method History
                  </p>
                  <div className="flex flex-col gap-2">
                    {order.paymentMethodHistory.map((change, idx) => (
                      <div key={idx} className="text-[11px] text-[#73786F] border-l-2 border-[var(--brand-accent)] pl-2.5">
                        <p>
                          <span className="font-medium text-[#292D28]">{change.fromMethod}</span>
                          {' → '}
                          <span className="font-medium text-[#292D28]">{change.toMethod}</span>
                          {' by '}
                          <span className={`font-semibold ${change.actorRole === 'delivery' ? 'text-blue-700' : 'text-[var(--brand-primary)]'}`}>
                            {change.changedBy}
                          </span>
                        </p>
                        <p className="text-[#73786F]">
                          {new Date(change.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {change.reason && <p className="text-[#73786F] italic mt-0.5">{change.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

        </div>
      </div>

      {/* ── Status note modal ────────────────────────────── */}
      {pendingAction && (
        <StatusNoteModal
          title={pendingAction.title}
          label={pendingAction.noteLabel}
          required={pendingAction.noteRequired}
          onSave={(note) => applyStatusChange(pendingAction.newStatus, note)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* ── Cash payment verification modal ─────────────────────────── */}
      {showPayModal && (
        <StatusNoteModal
          title="Verify Cash Payment"
          label="Verification note (optional)"
          required={false}
          onSave={markCODPaid}
          onCancel={() => setShowPayModal(false)}
        />
      )}

      {/* ── Change payment method modal ────────────────────────────── */}
      {showChangePayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             onClick={() => setShowChangePayModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#292D28] mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
              Change Payment Method
            </h3>
            <p className="text-xs text-[#73786F] mb-3">
              Current method: <strong className="text-[#292D28]">{order.paymentMethod}</strong>
              {' · '}Amount: <strong className="text-[#292D28]">₹{order.total.toLocaleString('en-IN')}</strong>
            </p>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              New Payment Method <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select value={newPayMethod} onChange={(e) => setNewPayMethod(e.target.value)}
                    className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28] bg-white
                               focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10">
              <option value="">Select a method…</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="Cash">Cash (walk-in)</option>
              <option value="UPI QR Payment">UPI QR Payment</option>
              <option value="Online Payment">Online Payment</option>
            </select>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block mt-3">
              Reason <span className="text-[#73786F] font-normal">(optional)</span>
            </label>
            <textarea rows={2} placeholder="e.g. Customer requested COD instead of UPI…"
                      className="w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28]
                                 bg-white placeholder:text-[#73786F]/60 resize-none
                                 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
                      id="change-pay-reason" />
            <div className="flex gap-3 mt-4">
              <button type="button"
                      onClick={() => {
                        const noteEl = document.getElementById('change-pay-reason') as HTMLTextAreaElement;
                        if (!newPayMethod) return;
                        handlePaymentMethodChange(noteEl?.value ?? '');
                      }}
                      disabled={!newPayMethod}
                      className="flex-1 bg-[var(--brand-primary)] text-white font-semibold text-sm py-2.5 rounded-xl
                                 hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-50
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
                Confirm Change
              </button>
              <button type="button" onClick={() => { setShowChangePayModal(false); setNewPayMethod(''); }}
                      className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-2.5 rounded-xl
                                 hover:bg-[var(--brand-background)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject cash collection modal ────────────────────────────── */}
      {showRejectModal && (
        <StatusNoteModal
          title="Reject Cash Collection"
          label="Reason for rejection (required)"
          required={true}
          onSave={handleRejectCollection}
          onCancel={() => setShowRejectModal(false)}
        />
      )}

    </div>
  );
}
