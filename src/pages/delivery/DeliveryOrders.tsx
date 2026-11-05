import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, ChevronRight } from 'lucide-react';
import { getCurrentDeliveryBoy } from '../../utils/deliveryStore';
import { getAllOrders } from '../../data/orders';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useOrderSync } from '../../hooks/useOrderSync';

type FilterTab = 'all' | 'shipped' | 'out-for-delivery' | 'delivered';

export default function DeliveryOrders() {
  const boy = getCurrentDeliveryBoy();
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const syncKey = useOrderSync();
  const [refreshKey] = useState(0); void refreshKey;

  const myOrders = useMemo(() => {
    void syncKey;
    if (!boy) return [];
    return getAllOrders().filter((o) => o.orderSource !== 'walk_in_sale' && o.deliveryBoyId === boy.id);
  }, [boy, syncKey]);

  const filtered = useMemo(() => {
    let list = [...myOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (tab !== 'all') list = list.filter((o) => o.status === tab);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.shippingAddress.fullName.toLowerCase().includes(q) || o.shippingAddress.phone.includes(q));
    return list;
  }, [myOrders, tab, search]);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'shipped', label: 'Pending Pickup' },
    { id: 'out-for-delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: 'var(--font-body)' }}>
      <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>My Orders</h1>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F]" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Search order ID or customer…"
               className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => {
          const count = id === 'all' ? myOrders.length : myOrders.filter((o) => o.status === id).length;
          if (id !== 'all' && count === 0) return null;
          return (
            <button key={id} type="button" onClick={() => setTab(id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-[var(--brand-primary)] text-white' : 'bg-white border border-[#E8E4D9] text-[#73786F] hover:text-[#292D28]'}`}>
              {label}<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-[#E8E4D9]'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      <div className="flex flex-col gap-3">
        {filtered.length > 0 ? filtered.map((order) => (
          <Link key={order.id} to={`/delivery/orders/${order.id}`}
                className="flex items-start justify-between gap-3 p-4 bg-white rounded-xl border border-[#E8E4D9] hover:border-[var(--brand-primary)]/30 transition-colors">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono font-bold text-[#292D28]">{order.orderNumber}</p>
              <p className="text-sm font-semibold text-[#292D28] mt-0.5">{order.shippingAddress.fullName}</p>
              <p className="text-xs text-[#73786F] mt-0.5">
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city} — {order.shippingAddress.pincode}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <a href={`tel:${order.shippingAddress.phone}`} onClick={(e) => e.stopPropagation()}
                   className="text-xs font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-full">
                  📞 {order.shippingAddress.phone}
                </a>
                <span className="text-xs text-[#73786F]">{order.items.length} items</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <OrderStatusBadge status={order.status} size="small" dot={false} />
              <ChevronRight size={16} className="text-[#73786F]" />
            </div>
          </Link>
        )) : (
          <div className="bg-white rounded-xl border border-[#E8E4D9] py-10 text-center">
            <Package size={32} strokeWidth={1.5} className="text-[#73786F] mx-auto mb-2" />
            <p className="text-sm text-[#73786F]">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
