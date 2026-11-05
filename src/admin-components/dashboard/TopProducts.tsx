import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getAllOrders } from '../../data/orders';
import { getAllProducts } from '../../utils/productStore';
import { formatINR } from '../../utils/formatPrice';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

export default function TopProducts() {
  useLocalDataRevision();
  const products = new Map(getAllProducts().map((product) => [product.id, product]));
  const totals = new Map<string, { name: string; units: number; revenue: number; productId: string }>();
  for (const order of getAllOrders().filter((entry) => entry.status !== 'cancelled')) for (const item of order.items) {
    const current = totals.get(item.productId) ?? { name: item.name, units: 0, revenue: 0, productId: item.productId };
    current.units += item.quantity; current.revenue += item.quantity * item.price; totals.set(item.productId, current);
  }
  const items = [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  return <section className="overflow-hidden rounded-2xl border border-[#E8E4D9] bg-white">
    <div className="flex items-center justify-between border-b border-[#E8E4D9] px-5 py-4"><h2 className="font-semibold">Top selling products</h2><Link to="/admin/products" className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]">Products <ArrowRight size={13} /></Link></div>
    {items.length ? <ol className="divide-y divide-[#E8E4D9]">{items.map((item, index) => { const product = products.get(item.productId); return <li key={item.productId} className="flex items-center gap-3 px-5 py-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-background)] text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product ? <Link to={`/admin/products/${product.id}/edit`}>{item.name}</Link> : item.name}</p><p className="text-xs text-[#73786F]">{item.units} units sold</p></div><p className="text-sm font-semibold">{formatINR(item.revenue)}</p></li>; })}</ol> : <p className="px-5 py-8 text-center text-sm text-[#73786F]">Sales data will appear when orders are recorded.</p>}
  </section>;
}
