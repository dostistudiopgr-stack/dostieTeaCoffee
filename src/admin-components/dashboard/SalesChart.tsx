import { getAllOrders } from '../../data/orders';
import { formatINR } from '../../utils/formatPrice';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

export default function SalesChart() {
  useLocalDataRevision();
  const orders = getAllOrders().filter((order) => order.status !== 'cancelled' && order.paymentStatus === 'paid');
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const matching = orders.filter((order) => order.createdAt.slice(0, 10) === key);
    return { key, label: date.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: matching.reduce((sum, order) => sum + order.total, 0), orders: matching.length };
  });
  const max = Math.max(...points.map((point) => point.revenue), 1);
  const total = points.reduce((sum, point) => sum + point.revenue, 0);
  const count = points.reduce((sum, point) => sum + point.orders, 0);
  return <section className="rounded-2xl border border-[#E8E4D9] bg-white p-5">
    <h2 className="text-base font-semibold text-[#292D28]">Revenue overview</h2>
    <p className="mt-0.5 text-xs text-[#73786F]">Saved orders from the last 7 days</p>
    <div className="my-5 grid grid-cols-2 gap-4"><div className="rounded-xl bg-[var(--brand-background)] p-3"><p className="text-xs text-[#73786F]">Revenue</p><p className="mt-1 font-bold text-[var(--brand-primary)]">{formatINR(total)}</p></div><div className="rounded-xl bg-[var(--brand-background)] p-3"><p className="text-xs text-[#73786F]">Orders</p><p className="mt-1 font-bold">{count}</p></div></div>
    {count === 0 ? <p className="py-8 text-center text-sm text-[#73786F]">No orders in this period.</p> : <div className="flex h-44 items-end gap-2" role="img" aria-label="Saved order revenue for the last 7 days">{points.map((point) => <div key={point.key} title={`${point.label}: ${formatINR(point.revenue)} (${point.orders} orders)`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t bg-[var(--brand-primary)]/70" style={{ height: `${Math.max(point.revenue ? 8 : 0, point.revenue / max * 130)}px` }} /><span className="text-[10px] text-[#73786F]">{point.label}</span></div>)}</div>}
  </section>;
}
