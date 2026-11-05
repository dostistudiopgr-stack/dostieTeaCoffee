import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronRight, Package, ChevronLeft,
  ShoppingCart, Clock, CheckCircle, Truck, X,
} from 'lucide-react';
import { getAllOrders } from '../../data/orders';
import { formatINR } from '../../utils/formatPrice';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import type { OrderStatus, PaymentStatus } from '../../types';
import { useOrderSync } from '../../hooks/useOrderSync';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey      = 'newest' | 'oldest' | 'highest' | 'lowest';
type PayFilter    = 'all' | PaymentStatus;
type MethodFilter = 'all' | 'cod' | 'online';

const ALL_STATUSES: OrderStatus[] = [
  'pending','confirmed','processing','shipped','out-for-delivery','delivered','cancelled','returned',
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:           'Pending',
  confirmed:         'Confirmed',
  processing:        'Processing',
  packed:            'Packed',
  shipped:           'Shipped',
  'out-for-delivery':'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
  returned:          'Returned',
};

const ITEMS_PER_PAGE = 10;
const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Orders() {
  const syncKey = useOrderSync();
  const allOrders = useMemo(() => { void syncKey; return getAllOrders(); }, [syncKey]);

  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'all' | OrderStatus>('all');
  const [payFilter,     setPayFilter]     = useState<PayFilter>('all');
  const [methodFilter,  setMethodFilter]  = useState<MethodFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'website' | 'phone_order' | 'walk_in_sale'>('all');
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [sort,          setSort]          = useState<SortKey>('newest');
  const [page,          setPage]          = useState(1);

  // ── Counts for summary cards ────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { total: allOrders.length };
    ALL_STATUSES.forEach((s) => { c[s] = allOrders.filter((o) => o.status === s).length; });
    return c;
  }, [allOrders]);

  // ── Filtered + sorted ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allOrders];

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.shippingAddress.fullName.toLowerCase().includes(q) ||
      o.shippingAddress.phone.includes(q)
    );

    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (payFilter     !== 'all') list = list.filter((o) => o.paymentStatus === payFilter);
    if (methodFilter  === 'cod')    list = list.filter((o) => o.paymentMethod === 'Cash on Delivery');
    if (methodFilter  === 'online') list = list.filter((o) => o.paymentMethod !== 'Cash on Delivery');
    if (sourceFilter !== 'all') list = list.filter((o) => (o.orderSource ?? 'website') === sourceFilter);

    if (dateFrom) list = list.filter((o) => o.createdAt >= dateFrom);
    if (dateTo)   list = list.filter((o) => o.createdAt <= dateTo + 'T23:59:59');

    list.sort((a, b) => {
      if (sort === 'oldest')  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'highest') return b.total - a.total;
      if (sort === 'lowest')  return a.total - b.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });

    return list;
  }, [allOrders, search, statusFilter, payFilter, methodFilter, sourceFilter, dateFrom, dateTo, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const hasFilters = search || statusFilter !== 'all' || payFilter !== 'all' || methodFilter !== 'all' || sourceFilter !== 'all' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(''); setStatusFilter('all'); setPayFilter('all');
    setMethodFilter('all'); setDateFrom(''); setDateTo(''); setPage(1);
    setSourceFilter('all');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Orders
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">Manage website orders, phone orders and warehouse sales.</p>
        <Link to="/admin/sales/new" className="inline-flex mt-3 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white">Create Sale</Link>
      </div>

      {/* ── Summary cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total',         value: counts.total,           icon: <ShoppingCart size={16} />, color: 'text-[#292D28]'  },
          { label: 'Pending',       value: counts.pending,         icon: <Clock        size={16} />, color: 'text-amber-600'  },
          { label: 'Confirmed',     value: counts.confirmed,       icon: <CheckCircle  size={16} />, color: 'text-blue-600'   },
          { label: 'Processing',    value: counts.processing,      icon: <Package      size={16} />, color: 'text-blue-500'   },
          { label: 'Shipped',       value: counts.shipped,         icon: <Truck        size={16} />, color: 'text-[var(--brand-primary)]'  },
          { label: 'Delivered',     value: counts.delivered,       icon: <CheckCircle  size={16} />, color: 'text-emerald-600'},
          { label: 'Cancelled',     value: counts.cancelled,       icon: <X            size={16} />, color: 'text-red-500'    },
        ].map(({ label, value, icon, color }) => (
          <div key={label}
               className="bg-white rounded-xl border border-[#E8E4D9] p-3.5 cursor-pointer
                          hover:shadow-sm transition-shadow"
               onClick={() => { setStatusFilter(label === 'Total' ? 'all' : label.toLowerCase() as OrderStatus); setPage(1); }}>
            <div className={`flex items-center gap-1.5 ${color} mb-1`}>{icon}
              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters toolbar ──────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
          <input type="search" value={search}
                 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                 placeholder="Order ID, customer name or phone…"
                 className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl
                            text-sm text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)]
                            focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
        </div>

        <select value={statusFilter}  onChange={(e) => { setStatusFilter(e.target.value as 'all' | OrderStatus); setPage(1); }} className={selectCls}>
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>

        <select value={payFilter}     onChange={(e) => { setPayFilter(e.target.value as PayFilter); setPage(1); }} className={selectCls}>
          <option value="all">All Payments</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>

        <select value={methodFilter}  onChange={(e) => { setMethodFilter(e.target.value as MethodFilter); setPage(1); }} className={selectCls}>
          <option value="all">All Methods</option>
          <option value="cod">Cash on Delivery</option>
          <option value="online">Online</option>
        </select>

        <select aria-label="Filter by order source" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value as typeof sourceFilter); setPage(1); }} className={selectCls}>
          <option value="all">All Sources</option><option value="website">Website</option><option value="phone_order">Phone / WhatsApp</option><option value="walk_in_sale">Warehouse Walk-in</option>
        </select>

        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
               className={selectCls} title="From date" />
        <input type="date" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }}
               className={selectCls} title="To date" />

        <select value={sort}          onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }} className={selectCls}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>

        {hasFilters && (
          <button type="button" onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#73786F]
                             hover:text-red-500 transition-colors px-3 py-2.5 bg-white
                             border border-[#E8E4D9] rounded-xl">
            <X size={13} />Clear
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-[#73786F]">
        Showing <strong className="text-[#292D28]">{filtered.length}</strong> of{' '}
        <strong className="text-[#292D28]">{allOrders.length}</strong> orders
      </p>

      {/* ── Desktop table ────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Order ID</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Date</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Items</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Amount</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Payment</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Pay Status</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {paginated.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--brand-background)] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#292D28] whitespace-nowrap">
                    {order.orderNumber}
                    <span className="block mt-1 font-sans text-[10px] text-[#73786F]">{order.orderSource === 'phone_order' ? 'Phone / WhatsApp' : order.orderSource === 'walk_in_sale' ? 'Walk-in sale' : 'Website'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#73786F] whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#292D28] truncate max-w-[140px]">
                      {order.shippingAddress.fullName}
                    </p>
                    <p className="text-xs text-[#73786F]">{order.shippingAddress.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap text-center">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#292D28] whitespace-nowrap">
                    {formatINR(order.total)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#73786F] whitespace-nowrap">
                    {order.paymentMethod === 'Cash on Delivery' ? 'COD' : order.paymentMethod}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {order.paymentStatus === 'paid'
                      ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Paid</span>
                      : order.paymentStatus === 'refunded'
                      ? <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Refunded</span>
                      : <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} size="small" dot={false} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold
                                     text-[var(--brand-primary)] hover:text-[var(--brand-dark)] whitespace-nowrap">
                      View<ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E4D9]">
            <p className="text-xs text-[#73786F]">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F]
                                 hover:bg-[var(--brand-background)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-[#292D28] px-1">{safePage}</span>
              <button type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F]
                                 hover:bg-[var(--brand-background)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No orders found</p>
            <p className="text-xs text-[#73786F]">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* ── Mobile cards ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginated.map((order) => (
          <div key={order.id}
               className="bg-white rounded-2xl border border-[#E8E4D9] p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs font-mono font-bold text-[#292D28]">{order.orderNumber}</p>
                <p className="text-xs text-[#73786F]">{formatDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} size="small" dot={false} />
            </div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-medium text-[#292D28]">{order.shippingAddress.fullName}</p>
                <p className="text-xs text-[#73786F]">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
              </div>
              <p className="text-base font-bold text-[#292D28]">{formatINR(order.total)}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D9]">
              <span className="text-xs text-[#73786F]">
                {order.paymentMethod === 'Cash on Delivery' ? 'COD' : order.paymentMethod} ·{' '}
                <span className={order.paymentStatus === 'paid' ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                </span>
              </span>
              <Link to={`/admin/orders/${order.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)]">
                View Details<ChevronRight size={13} />
              </Link>
            </div>
          </div>
        ))}
        {paginated.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-2xl border border-[#E8E4D9] text-center">
            <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No orders found</p>
          </div>
        )}
        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                    className="p-2 rounded-lg border border-[#E8E4D9] disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-[#292D28]">{safePage} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                    className="p-2 rounded-lg border border-[#E8E4D9] disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
