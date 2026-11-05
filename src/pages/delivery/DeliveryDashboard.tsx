import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { getCurrentDeliveryBoy } from '../../utils/deliveryStore';
import { getAllOrders } from '../../data/orders';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useOrderSync } from '../../hooks/useOrderSync';

export default function DeliveryDashboard() {
  const boy = getCurrentDeliveryBoy();
  const syncKey = useOrderSync();
  const [refreshKey] = useState(0); void refreshKey;

  const myOrders = useMemo(() => {
    void syncKey; // re-run when cross-tab storage changes
    if (!boy) return [];
    return getAllOrders().filter((o) => o.deliveryBoyId === boy.id);
  }, [boy, syncKey]);

  const today = new Date().toISOString().split('T')[0];

  const todayAssigned = myOrders.filter((o) => o.assignedAt?.startsWith(today)).length;
  const pendingPickup = myOrders.filter((o) => o.status === 'shipped').length;
  const outForDelivery = myOrders.filter((o) => o.status === 'out-for-delivery').length;
  const deliveredToday = myOrders.filter((o) => o.status === 'delivered' &&
    o.timeline.some((t) => t.status === 'delivered' && t.timestamp.startsWith(today))).length;

  const recentOrders = myOrders.slice(0, 5);

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">Welcome, {boy?.name}!</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Assigned", value: todayAssigned, icon: <Clock size={18} />, color: 'text-amber-600' },
          { label: 'Pending Pickup',  value: pendingPickup,  icon: <Package size={18} />, color: 'text-blue-600' },
          { label: 'Out for Delivery', value: outForDelivery, icon: <Truck size={18} />, color: 'text-[var(--brand-primary)]' },
          { label: 'Delivered Today',  value: deliveredToday,  icon: <CheckCircle size={18} />, color: 'text-emerald-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E8E4D9] p-4">
            <div className={`flex items-center gap-1.5 ${color} mb-2`}>{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#292D28]">Recent Assigned Orders</h2>
          <Link to="/delivery/orders" className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)]">
            View All →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentOrders.length > 0 ? recentOrders.map((order) => (
            <Link key={order.id} to={`/delivery/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#E8E4D9] hover:border-[var(--brand-primary)]/30 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-bold text-[#292D28]">{order.orderNumber}</p>
                <p className="text-sm font-medium text-[#292D28] truncate">{order.shippingAddress.fullName}</p>
                <p className="text-xs text-[#73786F]">{order.shippingAddress.city} · 📞 {order.shippingAddress.phone}</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <OrderStatusBadge status={order.status} size="small" dot={false} />
                <ChevronRight size={16} className="text-[#73786F]" />
              </div>
            </Link>
          )) : (
            <div className="bg-white rounded-xl border border-[#E8E4D9] py-8 text-center">
              <Package size={32} strokeWidth={1.5} className="text-[#73786F] mx-auto mb-2" />
              <p className="text-sm text-[#73786F]">No orders assigned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
