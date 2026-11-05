import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getAllOrders }    from '../../data/orders';
import { formatINR }       from '../../utils/formatPrice';
import OrderStatusBadge    from '../../components/orders/OrderStatusBadge';

// ─── Component ────────────────────────────────────────────────────────────────

const RecentOrders = () => {
  const recent = getAllOrders().slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4D9]">
        <h3 className="text-base font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Recent Orders
        </h3>
        <Link to="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]
                         hover:text-[var(--brand-dark)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)] rounded">
          View All <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Recent orders">
          <thead>
            <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
              {['Order ID', 'Customer', 'Items', 'Date', 'Amount', 'Payment', 'Status', ''].map((h) => (
                <th key={h}
                    className="text-left text-xs font-semibold text-[#73786F] px-4 py-3
                               whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E4D9]">
            {recent.map((order) => {
              const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              });
              return (
                <tr key={order.id}
                    className="hover:bg-[var(--brand-background)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#292D28] whitespace-nowrap">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-[#292D28] whitespace-nowrap">
                    {order.shippingAddress.fullName}
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap text-xs">
                    {date}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#292D28] whitespace-nowrap">
                    {formatINR(order.total)}
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap text-xs">
                    {order.paymentMethod === 'Cash on Delivery' ? 'COD' : order.paymentMethod}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} size="small" dot={false} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${order.id}`}
                          className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)]
                                     transition-colors whitespace-nowrap
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[var(--brand-accent)] rounded">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
