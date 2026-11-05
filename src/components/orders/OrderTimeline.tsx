import {
  Clock, CheckCircle, Package, Truck, Home,
  XCircle, RotateCcw, ShoppingBag,
} from 'lucide-react';
import type { OrderStatus, OrderTimeline as TimelineEntry } from '../../types';

// ─── Full timeline step config ────────────────────────────────────────────────

interface StepConfig {
  status:      OrderStatus;
  label:       string;
  description: string;
  icon:        React.ReactNode;
}

const STEPS: StepConfig[] = [
  { status: 'pending',            label: 'Order Placed',      description: 'Your order has been placed and is awaiting confirmation.',   icon: <ShoppingBag size={18} aria-hidden="true" /> },
  { status: 'confirmed',          label: 'Order Confirmed',   description: 'Your order has been confirmed and will be processed soon.',  icon: <CheckCircle size={18} aria-hidden="true" /> },
  { status: 'processing',         label: 'Processing',        description: 'Your order is being prepared.',                             icon: <Package     size={18} aria-hidden="true" /> },
  { status: 'packed',             label: 'Packed',            description: 'Your order has been packed and is ready for dispatch.',      icon: <Package     size={18} aria-hidden="true" /> },
  { status: 'shipped',            label: 'Shipped',           description: 'Your order has been dispatched and is on the way.',          icon: <Truck       size={18} aria-hidden="true" /> },
  { status: 'out-for-delivery',   label: 'Out for Delivery',  description: 'Your order is out for delivery today.',                     icon: <Truck       size={18} aria-hidden="true" /> },
  { status: 'delivered',          label: 'Delivered',         description: 'Your order has been delivered. Thank you!',                 icon: <Home        size={18} aria-hidden="true" /> },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  timeline:      TimelineEntry[];
  className?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrderTimeline = ({ currentStatus, timeline, className = '' }: OrderTimelineProps) => {
  // Special cases
  if (currentStatus === 'cancelled') {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {timeline.map((entry, idx) => {
          const isCancelled = entry.status === 'cancelled';
          return (
            <div key={idx} className="flex items-start gap-4">
              <div className={[
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                isCancelled
                  ? 'bg-red-100 text-red-600'
                  : 'bg-[var(--brand-primary)] text-white',
              ].join(' ')}>
                {isCancelled ? <XCircle size={18} /> : <CheckCircle size={18} />}
              </div>
              <div className="flex-1 pb-4 border-b border-[#E8E4D9] last:border-0">
                <p className={`text-sm font-semibold ${isCancelled ? 'text-red-600' : 'text-[#292D28]'}`}>
                  {isCancelled ? 'Order Cancelled' : STEPS.find((s) => s.status === entry.status)?.label ?? entry.status}
                </p>
                {entry.note && <p className="text-xs text-[#73786F] mt-0.5">{entry.note}</p>}
                <p className="text-xs text-[#73786F] mt-1">
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
    );
  }

  if (currentStatus === 'returned') {
    return (
      <div className={`flex items-center gap-3 p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] ${className}`}>
        <RotateCcw size={20} className="text-[#73786F]" />
        <div>
          <p className="text-sm font-semibold text-[#292D28]">Order Returned</p>
          <p className="text-xs text-[#73786F]">This order has been returned.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={`flex flex-col ${className}`} role="list" aria-label="Order tracking timeline">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent   = idx === currentIdx;
        const isUpcoming  = idx > currentIdx;

        // Find matching timeline entry for timestamp
        const entry = timeline.find((t) => t.status === step.status);

        return (
          <div
            key={step.status}
            role="listitem"
            className="flex items-start gap-4"
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Icon + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div className={[
                'w-10 h-10 rounded-full flex items-center justify-center',
                'border-2 transition-all z-10',
                isCompleted ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
                : isCurrent  ? 'bg-white border-[var(--brand-primary)] text-[var(--brand-primary)]'
                :              'bg-white border-[#E8E4D9] text-[#C5C5C5]',
              ].join(' ')}>
                {isCompleted ? <CheckCircle size={18} /> : step.icon}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={[
                  'w-0.5 flex-1 min-h-[32px] mt-1',
                  isCompleted ? 'bg-[var(--brand-primary)]' : 'bg-[#E8E4D9]',
                ].join(' ')} aria-hidden="true" />
              )}
            </div>

            {/* Text */}
            <div className={`pb-6 flex-1 min-w-0 ${idx === STEPS.length - 1 ? 'pb-0' : ''}`}>
              <p className={[
                'text-sm font-semibold leading-tight',
                isUpcoming ? 'text-[#C5C5C5]' : 'text-[#292D28]',
              ].join(' ')}>
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-[10px] font-bold bg-[var(--brand-primary)] text-white
                                   px-2 py-0.5 rounded-full align-middle">
                    Current
                  </span>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${isUpcoming ? 'text-[#D4D0CB]' : 'text-[#73786F]'}`}>
                {step.description}
              </p>
              {entry && (
                <p className="text-xs text-[var(--brand-primary)] font-medium mt-1">
                  {new Date(entry.timestamp).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                  {entry.note && ` — ${entry.note}`}
                </p>
              )}
              {/* Upcoming placeholder time */}
              {!entry && isCurrent && (
                <div className="mt-1 flex items-center gap-1.5">
                  <Clock size={11} className="text-[var(--brand-accent)]" aria-hidden="true" />
                  <span className="text-xs text-[var(--brand-accent)] font-medium">In progress</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
