import { MapPin, CreditCard } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../utils/formatPrice';

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderSummaryPanelProps {
  order:      Order;
  className?: string;
}

// ─── Helper row ───────────────────────────────────────────────────────────────

const Row = ({ label, value, green = false, bold = false }: {
  label: string; value: string; green?: boolean; bold?: boolean;
}) => (
  <div className="flex justify-between text-sm">
    <span className="text-[#73786F]">{label}</span>
    <span className={[
      bold ? 'font-bold text-base' : 'font-medium',
      green ? 'text-emerald-600' : 'text-[#292D28]',
    ].join(' ')}>{value}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const OrderSummaryPanel = ({ order, className = '' }: OrderSummaryPanelProps) => {
  const addr = order.shippingAddress;

  return (
    <div className={[
      'bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden',
      className,
    ].join(' ')}>
      {/* Payment summary */}
      <div className="p-5 border-b border-[#E8E4D9]">
        <h3 className="text-sm font-semibold text-[#292D28] mb-4 flex items-center gap-2">
          <CreditCard size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Payment Summary
        </h3>
        <div className="flex flex-col gap-2.5">
          <Row label={`Subtotal (${order.items.reduce((a, i) => a + i.quantity, 0)} items)`}
               value={formatINR(order.subtotal)} />
          {order.discount > 0 && (
            <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                 value={`−${formatINR(order.discount)}`} green />
          )}
          <Row label="Delivery"
               value={order.shippingCharge === 0 ? 'Free' : formatINR(order.shippingCharge)}
               green={order.shippingCharge === 0} />
          <Row label="GST (5%)" value={formatINR(order.tax)} />
          <div className="border-t border-[#E8E4D9] pt-2.5 mt-1">
            <Row label="Grand Total" value={formatINR(order.total)} bold />
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="px-5 py-4 border-b border-[#E8E4D9] flex items-center justify-between">
        <div>
          <p className="text-xs text-[#73786F]">Payment Method</p>
          <p className="text-sm font-medium text-[#292D28] mt-0.5">{order.paymentMethod}</p>
        </div>
        <span className={[
          'text-xs px-2.5 py-1 rounded-full font-semibold',
          order.paymentStatus === 'paid'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100',
        ].join(' ')}>
          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
        </span>
      </div>

      {/* Delivery address */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-[#292D28] mb-3 flex items-center gap-2">
          <MapPin size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
          Delivery Address
        </h3>
        <address className="not-italic text-sm text-[#73786F] leading-relaxed">
          <strong className="text-[#292D28]">{addr.fullName}</strong><br />
          {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />
          {addr.city}, {addr.state} — {addr.pincode}<br />
          📞 {addr.phone}
        </address>
      </div>
    </div>
  );
};

export default OrderSummaryPanel;
