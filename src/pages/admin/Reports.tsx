import { useState, useMemo } from 'react';
import {
  IndianRupee, ShoppingCart, Package, TrendingUp,
  Download, Users, AlertTriangle, BarChart2, Search,
  BadgePercent,
} from 'lucide-react';
import { getAllOrders }         from '../../data/orders';
import { loadAllCustomers }     from '../../utils/customerStore';
import { loadStockHistory, getAllProducts } from '../../utils/productStore';
import { formatINR }            from '../../utils/formatPrice';
import {
  isSaleEligible,
  calcAggregateFinancials,
  calcProductFinancials,
} from '../../utils/financials';
import type { OrderSource } from '../../types/Order';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import { useAdminSettings }     from '../../hooks/useAdminSettings';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-400', confirmed: 'bg-blue-400', processing: 'bg-blue-500',
  shipped: 'bg-[var(--brand-primary)]', 'out-for-delivery': 'bg-emerald-400',
  delivered: 'bg-emerald-600', cancelled: 'bg-red-500', returned: 'bg-purple-400',
};
const CATEGORY_COLORS: Record<string, string> = {
  tea: 'var(--brand-accent)', coffee: '#8B4513', 'green-tea': 'var(--brand-primary)',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

type PeriodPreset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last-month' | 'year' | 'custom' | 'all';

function getPresetRange(preset: PeriodPreset): { from: string; to: string } {
  const now   = new Date();
  const fmt   = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(now);
  switch (preset) {
    case 'today':      return { from: today, to: today };
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate() - 1); return { from: fmt(y), to: fmt(y) }; }
    case '7d':        { const d = new Date(now); d.setDate(d.getDate() - 6);  return { from: fmt(d), to: today }; }
    case '30d':       { const d = new Date(now); d.setDate(d.getDate() - 29); return { from: fmt(d), to: today }; }
    case 'month':     { const d = new Date(now.getFullYear(), now.getMonth(), 1); return { from: fmt(d), to: today }; }
    case 'last-month':{ const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 0); return { from: fmt(s), to: fmt(e) }; }
    case 'year':      return { from: `${now.getFullYear()}-01-01`, to: today };
    default:          return { from: '', to: '' };
  }
}

function inRange(isoDate: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = isoDate.split('T')[0];
  if (from && d < from) return false;
  if (to   && d > to)   return false;
  return true;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]): void {
  const csv  = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

const BAR_H = 120;
function BarChart({ data, color = 'var(--brand-primary)' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div className="flex items-end gap-1.5 h-[140px] overflow-x-auto">
      {data.map((d, idx) => {
        const h = Math.max(4, Math.round((d.value / max) * BAR_H));
        return (
          <div key={idx} className="flex flex-col items-center flex-1 min-w-[28px] gap-1 relative"
               onMouseEnter={() => setHov(idx)} onMouseLeave={() => setHov(null)}>
            {hov === idx && (
              <div className="absolute -top-9 z-10 bg-[#292D28] text-white text-[10px] font-semibold
                              rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg">
                {d.label}: {d.value > 999 ? formatINR(d.value) : d.value}
              </div>
            )}
            <div className="w-full flex items-end" style={{ height: `${BAR_H}px` }}>
              <div className="w-full rounded-t-md transition-all duration-200"
                   style={{ height: `${h}px`, backgroundColor: hov === idx ? 'var(--brand-dark)' : color }} />
            </div>
            <span className="text-[9px] text-[#73786F] truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-[#73786F]">No data for this period</div>
      )}
    </div>
  );
}

function HBar({ label, value, max, color = 'var(--brand-primary)', suffix = '' }: {
  label: string; value: number; max: number; color?: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 gap-2">
        <span className="text-[#292D28] truncate">{label}</span>
        <span className="text-[#292D28] font-semibold shrink-0">{suffix}{value.toLocaleString('en-IN')}</span>
      </div>
      <div className="h-2 bg-[#E8E4D9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
             style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const SCard = ({ title, icon, action, children }: {
  title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4D9]">
      <h3 className="text-sm font-semibold text-[#292D28] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}>{icon}{title}</h3>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const ExportBtn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)]
                     border border-[var(--brand-primary)]/30 px-3 py-1.5 rounded-lg
                     hover:bg-[var(--brand-primary)]/5 transition-colors">
    <Download size={13} />CSV
  </button>
);

// ─── Margin pill ──────────────────────────────────────────────────────────────

function MarginPill({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-[#73786F]">—</span>;
  const cls = pct >= 40 ? 'text-emerald-700 bg-emerald-50'
            : pct >= 20 ? 'text-amber-700 bg-amber-50'
            :             'text-red-700 bg-red-50';
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>{pct.toFixed(1)}%</span>;
}

// ─── Source label ─────────────────────────────────────────────────────────────

const sourceLabel = (s: string) =>
  s === 'phone_order' ? 'Phone / WhatsApp'
  : s === 'walk_in_sale' ? 'Walk-in'
  : 'Website';

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Reports() {
  useLocalDataRevision();
  const settings = useAdminSettings();

  // ── Date filter ───────────────────────────────────────────────────────────
  const [preset,     setPreset]     = useState<PeriodPreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [dateErr,    setDateErr]    = useState('');
  const [activeFrom, setActiveFrom] = useState(() => getPresetRange('30d').from);
  const [activeTo,   setActiveTo]   = useState(() => getPresetRange('30d').to);

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'products' | 'inventory' | 'customers'>('sales');

  // ── Products tab: channel filter ──────────────────────────────────────────
  const [prodChannel, setProdChannel] = useState<'all' | OrderSource>('all');

  // ── Raw data ──────────────────────────────────────────────────────────────
  const allOrders    = getAllOrders();
  const customers    = loadAllCustomers();
  const stockHistory = loadStockHistory();
  const threshold    = settings.inventory.lowStockThreshold ?? 15;

  // ── Period-filtered orders ────────────────────────────────────────────────
  const filteredOrders = useMemo(
    () => allOrders.filter((o) => inRange(o.createdAt, activeFrom, activeTo)),
    [allOrders, activeFrom, activeTo],
  );

  // ── Sale-eligible orders (revenue, independent of payment) ───────────────
  // Rule: confirmed/processing/packed/shipped/out-for-delivery/delivered.
  // Cancelled and returned are excluded. Payment status is irrelevant here.
  const revenueOrders = useMemo(
    () => filteredOrders.filter(isSaleEligible),
    [filteredOrders],
  );

  // ── Aggregate financials ──────────────────────────────────────────────────
  const fin = useMemo(() => calcAggregateFinancials(filteredOrders), [filteredOrders]);

  // ── Legacy source breakdown ────────────────────────────────────────────────
  const sourceTotals = useMemo(() =>
    (['website', 'phone_order', 'walk_in_sale'] as OrderSource[]).map((source) => {
      const orders = revenueOrders.filter((o) => (o.orderSource ?? 'website') === source);
      return { source, count: orders.length, revenue: orders.reduce((s, o) => s + o.total, 0) };
    }),
    [revenueOrders],
  );

  // ── Gross margin by channel ────────────────────────────────────────────────
  const margins = useMemo(() =>
    (['website', 'offline'] as const).map((channel) => {
      const orders = revenueOrders.filter((o) =>
        channel === 'website'
          ? (o.orderSource ?? 'website') === 'website'
          : o.orderSource === 'phone_order' || o.orderSource === 'walk_in_sale',
      );
      const chFin = calcAggregateFinancials(orders);
      return { channel, ...chFin };
    }),
    [revenueOrders],
  );

  // ── Inventory valuation (current, not historical) ─────────────────────────
  const inventoryValuation = useMemo(() =>
    getAllProducts().reduce((sum, p) =>
      sum + p.variants.reduce((vs, v) => vs + (v.purchaseCost ?? 0) * v.stock, 0), 0),
    [],
  );

  const totalOrders   = filteredOrders.length;
  const pendingCount  = filteredOrders.filter((o) => o.status === 'pending').length;

  // ── Revenue trend ─────────────────────────────────────────────────────────
  const revenueTrend = useMemo(() => {
    const map = new Map<string, number>();
    revenueOrders.forEach((o) => { const d = o.createdAt.split('T')[0]; map.set(d, (map.get(d) ?? 0) + o.total); });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([l, v]) => ({ label: l.slice(5), value: v }));
  }, [revenueOrders]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    revenueOrders.forEach((o) => { const m = o.createdAt.slice(0, 7); map.set(m, (map.get(m) ?? 0) + o.total); });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([l, v]) => ({ label: l.slice(5), value: v }));
  }, [revenueOrders]);

  // ── Order status distribution ─────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return counts;
  }, [filteredOrders]);

  // ── Product performance (with financials) ─────────────────────────────────
  const productPerfAll = useMemo(() => {
    // attach category from product store
    const prods = getAllProducts();
    return calcProductFinancials(revenueOrders).map((p) => ({
      ...p,
      category: prods.find((x) => x.id === p.productId)?.category ?? 'unknown',
    }));
  }, [revenueOrders]);

  // Filtered by channel
  const productPerfFiltered = useMemo(() => {
    if (prodChannel === 'all') return productPerfAll;
    const channelOrders = revenueOrders.filter((o) => (o.orderSource ?? 'website') === prodChannel);
    const prods = getAllProducts();
    return calcProductFinancials(channelOrders).map((p) => ({
      ...p,
      category: prods.find((x) => x.id === p.productId)?.category ?? 'unknown',
    }));
  }, [productPerfAll, revenueOrders, prodChannel]);

  const topProducts    = productPerfFiltered.slice(0, 8);
  const bottomProducts = [...productPerfFiltered].sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 5);

  // ── Category performance ──────────────────────────────────────────────────
  const catPerf = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number; orders: number }>();
    revenueOrders.forEach((o) => {
      const cats = new Set<string>();
      o.items.forEach((item) => {
        const p   = getAllProducts().find((x) => x.id === item.productId);
        const cat = p?.category ?? 'unknown';
        cats.add(cat);
        const e = map.get(cat);
        if (e) { e.units += item.quantity; e.revenue += item.price * item.quantity; }
        else map.set(cat, { units: item.quantity, revenue: item.price * item.quantity, orders: 0 });
      });
      cats.forEach((cat) => { const e = map.get(cat); if (e) e.orders++; });
    });
    return [...map.entries()].map(([category, vals]) => ({ category, ...vals })).sort((a, b) => b.revenue - a.revenue);
  }, [revenueOrders]);

  const totalCatRevenue = catPerf.reduce((s, c) => s + c.revenue, 0);

  // ── Inventory ─────────────────────────────────────────────────────────────
  const allVariants = useMemo(() => {
    const list: { name: string; label: string; sku: string; stock: number; category: string }[] = [];
    getAllProducts().filter((p) => p.isActive).forEach((p) =>
      p.variants.forEach((v) => list.push({ name: p.name, label: v.label, sku: v.sku, stock: v.stock, category: p.category })),
    );
    return list;
  }, []);

  const totalUnits = allVariants.reduce((s, v) => s + v.stock, 0);
  const inStock    = allVariants.filter((v) => v.stock > threshold).length;
  const lowStock   = allVariants.filter((v) => v.stock > 0 && v.stock <= threshold).length;
  const outOfStock = allVariants.filter((v) => v.stock === 0).length;
  const recentMoves = stockHistory.slice(0, 10);

  // ── Customers ─────────────────────────────────────────────────────────────
  const newCustomers = customers.filter((c) => inRange(c.createdAt, activeFrom, activeTo)).length;
  const withOrders   = customers.filter((c) => allOrders.some((o) => o.userId === c.id)).length;
  const topCustomers = customers
    .map((c) => ({
      ...c,
      spent:      allOrders.filter((o) => o.userId === c.id).reduce((s, o) => s + o.total, 0),
      orderCount: allOrders.filter((o) => o.userId === c.id).length,
    }))
    .filter((c) => c.orderCount > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  // ── Preset ────────────────────────────────────────────────────────────────
  const applyPreset = (p: PeriodPreset) => {
    setPreset(p); setDateErr('');
    if (p !== 'custom') { const { from, to } = getPresetRange(p); setActiveFrom(from); setActiveTo(to); }
  };
  const applyCustom = () => {
    if (!customFrom || !customTo) { setDateErr('Both dates are required.'); return; }
    if (customFrom > customTo)    { setDateErr('Start date must be before end date.'); return; }
    setDateErr(''); setActiveFrom(customFrom); setActiveTo(customTo);
  };

  // ── CSV exports ───────────────────────────────────────────────────────────
  const exportSales = () => {
    const rows = [['Date', 'Order ID', 'Source', 'Customer', 'Total (₹)', 'Payment', 'Status']];
    revenueOrders.forEach((o) => rows.push([
      o.createdAt.split('T')[0], o.orderNumber, sourceLabel(o.orderSource ?? 'website'),
      o.shippingAddress.fullName, String(o.total), o.paymentMethod, o.status,
    ]));
    downloadCSV('sales-report.csv', rows);
  };

  const exportOrders = () => {
    const rows = [['Order ID', 'Date', 'Source', 'Customer', 'Total (₹)', 'Payment', 'Status']];
    filteredOrders.forEach((o) => rows.push([
      o.orderNumber, o.createdAt.split('T')[0], sourceLabel(o.orderSource ?? 'website'),
      o.shippingAddress.fullName, String(o.total), o.paymentMethod, o.status,
    ]));
    downloadCSV('orders-report.csv', rows);
  };

  const exportProducts = () => {
    const rows = [[
      'Product', 'Pack Size', 'Category', 'Channel', 'Units Sold',
      'Selling Revenue (₹)', 'Purchase Cost (₹)', 'Gross Profit (₹)',
      'Profit Margin %', 'Unknown Cost Units',
    ]];
    productPerfFiltered.forEach((p) => rows.push([
      p.productName,
      p.variantLabel,
      p.category,
      prodChannel === 'all' ? 'All' : sourceLabel(prodChannel),
      String(p.unitsSold),
      String(p.sellingRevenue),
      p.purchaseCost > 0 ? String(p.purchaseCost) : 'Cost unavailable',
      p.grossProfit > 0  ? String(p.grossProfit)  : 'Cost unavailable',
      p.grossMarginPct !== null ? `${p.grossMarginPct.toFixed(1)}%` : 'Cost unavailable',
      String(p.unknownCostQty),
    ]));
    downloadCSV('product-performance.csv', rows);
  };

  const exportInventory = () => {
    const rows = [['Product', 'Pack Size', 'SKU', 'Stock', 'Status']];
    allVariants.forEach((v) => rows.push([
      v.name, v.label, v.sku, String(v.stock),
      v.stock === 0 ? 'Out of Stock' : v.stock <= threshold ? 'Low Stock' : 'In Stock',
    ]));
    downloadCSV('inventory-report.csv', rows);
  };

  const exportCustomers = () => {
    const rows = [['Name', 'Email', 'Phone', 'Registered', 'Orders', 'Total Spent (₹)', 'Status']];
    topCustomers.forEach((c) => rows.push([
      c.name, c.email, c.phone, c.createdAt.split('T')[0],
      String(c.orderCount), String(c.spent), c.isActive ? 'Active' : 'Inactive',
    ]));
    downloadCSV('customers-report.csv', rows);
  };

  const TABS = [
    { id: 'sales'     as const, label: 'Sales & Revenue' },
    { id: 'orders'    as const, label: 'Orders'          },
    { id: 'products'  as const, label: 'Products'        },
    { id: 'inventory' as const, label: 'Inventory'       },
    { id: 'customers' as const, label: 'Customers'       },
  ];

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      <div>
        <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
          Reports &amp; Analytics
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">Track sales, orders, products and business performance.</p>
      </div>

      {/* ── Date filter ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-wrap gap-1">
          {([
            ['all','All Time'],['today','Today'],['yesterday','Yesterday'],
            ['7d','7 Days'],['30d','30 Days'],['month','This Month'],
            ['last-month','Last Month'],['year','This Year'],['custom','Custom'],
          ] as [PeriodPreset, string][]).map(([p, label]) => (
            <button key={p} type="button" onClick={() => applyPreset(p)}
                    className={['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                      preset === p ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-background)] text-[#73786F] hover:text-[#292D28]',
                    ].join(' ')}>
              {label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#73786F]">From</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                     className="px-3 py-2 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#73786F]">To</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                     className="px-3 py-2 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)]" />
            </div>
            <button type="button" onClick={applyCustom}
                    className="px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--brand-dark)]">
              Apply
            </button>
          </div>
        )}
        {dateErr && <p className="text-xs text-red-600 w-full">{dateErr}</p>}
        {(activeFrom || activeTo) && preset !== 'all' && (
          <p className="text-xs text-[#73786F] w-full">
            Showing: <strong>{activeFrom || '—'}</strong> to <strong>{activeTo || '—'}</strong>
          </p>
        )}
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Sales Revenue',    value: formatINR(fin.salesRevenue),    icon: <IndianRupee size={18} />, color: 'text-emerald-600',           title: 'All committed sales (excl. cancelled)' },
          { label: 'Orders',           value: totalOrders,                    icon: <ShoppingCart size={18}/>, color: 'text-blue-600',              title: 'All orders in period' },
          { label: 'Avg Order Value',  value: formatINR(fin.avgOrderValue),   icon: <TrendingUp   size={18}/>, color: 'text-[var(--brand-primary)]', title: 'Sales Revenue ÷ Sale Orders' },
          { label: 'Units Sold',       value: fin.unitsSold,                  icon: <Package      size={18}/>, color: 'text-purple-600',            title: 'Units in sale-eligible orders' },
          { label: 'Gross Profit',     value: fin.grossProfit > 0 ? formatINR(fin.grossProfit) : '—', icon: <BadgePercent size={18}/>, color: 'text-[var(--brand-primary)]', title: 'Revenue − Purchase Cost (known lines)' },
          { label: 'Pending Orders',   value: pendingCount,                   icon: <AlertTriangle size={18}/>,color: 'text-amber-600',            title: 'Orders awaiting confirmation' },
        ].map(({ label, value, icon, color, title }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E8E4D9] p-4" title={title}>
            <div className={`flex items-center gap-1.5 ${color} mb-2`}>{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[#E8E4D9] overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className={['shrink-0 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                    activeTab === id ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-[#73786F] hover:text-[#292D28]',
                  ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ SALES TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'sales' && (
        <div className="flex flex-col gap-5">

          {/* Financial overview */}
          <SCard title="Financial Overview" icon={<IndianRupee size={16} className="text-[var(--brand-primary)]" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Sales Revenue',      value: formatINR(fin.salesRevenue),       desc: 'All committed sales, excl. cancelled' },
                { label: 'Payment Collected',  value: formatINR(fin.paymentCollected),   desc: 'Paid orders only' },
                { label: 'Outstanding COD',    value: formatINR(fin.outstandingCod),     desc: 'Delivered, admin verify pending' },
                { label: 'Purchase Cost',      value: fin.totalPurchaseCost > 0 ? formatINR(fin.totalPurchaseCost) : '—', desc: 'From purchase cost snapshots' },
                { label: 'Gross Profit',       value: fin.grossProfit > 0 ? formatINR(fin.grossProfit) : '—', desc: fin.ordersWithUnknownCost > 0 ? `Partial — ${fin.ordersWithUnknownCost} orders lack cost data` : 'Revenue − Purchase Cost' },
                { label: 'Gross Margin',       value: fin.grossMarginPct !== null ? `${fin.grossMarginPct.toFixed(1)}%` : '—', desc: 'On orders with known cost data' },
              ].map(({ label, value, desc }) => (
                <div key={label} className="rounded-xl bg-[var(--brand-background)] p-4">
                  <p className="text-xs text-[#73786F]">{label}</p>
                  <p className="mt-1 text-lg font-bold text-[var(--brand-primary)]">{value}</p>
                  <p className="text-[10px] text-[#73786F] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            {fin.totalUnknownCostLines > 0 && (
              <div className="flex items-start gap-2 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <p>
                  <strong>{fin.totalUnknownCostLines} item line{fin.totalUnknownCostLines !== 1 ? 's' : ''}</strong> across
                  {' '}<strong>{fin.ordersWithUnknownCost} order{fin.ordersWithUnknownCost !== 1 ? 's' : ''}</strong> are
                  missing purchase cost data. Historical profit is shown only for lines with a saved cost snapshot.
                  Future orders will capture costs if you add them in Products → Edit Variant.
                </p>
              </div>
            )}
          </SCard>

          <SCard title="Sales by Source" icon={<ShoppingCart size={16} className="text-[var(--brand-primary)]" />}>
            <div className="grid sm:grid-cols-3 gap-3">
              {sourceTotals.map(({ source, count, revenue }) => (
                <div key={source} className="rounded-xl bg-[var(--brand-background)] p-4">
                  <p className="text-xs text-[#73786F]">{sourceLabel(source)}</p>
                  <p className="mt-2 text-lg font-bold text-[var(--brand-primary)]">{formatINR(revenue)}</p>
                  <p className="text-xs text-[#73786F]">{count} sales</p>
                </div>
              ))}
            </div>
          </SCard>

          <SCard title="Gross Margin by Channel" icon={<BadgePercent size={16} className="text-[var(--brand-primary)]" />}>
            <div className="grid sm:grid-cols-3 gap-3">
              {margins.map(({ channel, grossProfit, grossMarginPct, ordersWithUnknownCost }) => (
                <div key={channel} className="rounded-xl bg-[var(--brand-background)] p-4">
                  <p className="text-xs text-[#73786F]">{channel === 'website' ? 'Online' : 'Offline'} gross margin</p>
                  <p className="mt-2 text-lg font-bold text-[var(--brand-primary)]">
                    {grossProfit > 0 ? formatINR(grossProfit) : '—'}
                    {grossMarginPct !== null && <span className="text-sm font-medium ml-2">· {grossMarginPct.toFixed(1)}%</span>}
                  </p>
                  {ordersWithUnknownCost > 0 && (
                    <p className="text-[10px] text-amber-700 mt-1">{ordersWithUnknownCost} orders missing cost data</p>
                  )}
                </div>
              ))}
              <div className="rounded-xl bg-[var(--brand-background)] p-4">
                <p className="text-xs text-[#73786F]">Inventory cost value</p>
                <p className="mt-2 text-lg font-bold text-[var(--brand-primary)]">{formatINR(inventoryValuation)}</p>
                <p className="text-[10px] text-[#73786F] mt-0.5">Current stock at purchase cost</p>
              </div>
            </div>
          </SCard>

          <SCard title="Revenue Trend" icon={<TrendingUp size={16} className="text-[var(--brand-primary)]" />} action={<ExportBtn onClick={exportSales} />}>
            {revenueTrend.length > 0
              ? <BarChart data={revenueTrend} />
              : <p className="text-sm text-[#73786F] text-center py-8">No revenue data for this period.</p>}
            <p className="text-[10px] text-[#73786F] mt-3 flex items-center gap-1">
              <AlertTriangle size={10} />Revenue = confirmed + active + delivered orders, regardless of payment status.
            </p>
          </SCard>

          {(preset === 'year' || preset === 'all') && (
            <SCard title="Monthly Revenue" icon={<BarChart2 size={16} className="text-[var(--brand-primary)]" />}>
              <BarChart data={monthlyRevenue} />
            </SCard>
          )}
        </div>
      )}

      {/* ══ ORDERS TAB ═══════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-5">
          <SCard title="Order Status Distribution" icon={<ShoppingCart size={16} className="text-[var(--brand-primary)]" />} action={<ExportBtn onClick={exportOrders} />}>
            <div className="flex flex-col gap-3">
              {Object.entries(statusCounts).length > 0
                ? Object.entries(statusCounts).map(([status, count]) => {
                    const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-xs mb-1 gap-2">
                          <span className="text-[#292D28] capitalize">{status.replace('-', ' ')}</span>
                          <span className="text-[#73786F]">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-[#E8E4D9] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-[#E8E4D9]'} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-[#73786F] text-center py-6">No orders in this period.</p>}
            </div>
          </SCard>
          <SCard title="Order Counts" icon={<BarChart2 size={16} className="text-[var(--brand-primary)]" />}>
            <BarChart data={Object.entries(statusCounts).map(([label, value]) => ({ label: label.replace('-', ' '), value }))} />
          </SCard>
        </div>
      )}

      {/* ══ PRODUCTS TAB ════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-5">

          {/* Channel filter for products */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#73786F] uppercase tracking-wide">Channel:</span>
            {(['all', 'website', 'phone_order', 'walk_in_sale'] as const).map((ch) => (
              <button key={ch} type="button" onClick={() => setProdChannel(ch)}
                      className={['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                        prodChannel === ch ? 'bg-[var(--brand-primary)] text-white' : 'bg-white border border-[#E8E4D9] text-[#73786F] hover:text-[#292D28]',
                      ].join(' ')}>
                {ch === 'all' ? 'All Channels' : sourceLabel(ch)}
              </button>
            ))}
          </div>

          {/* Product-wise financial table */}
          <SCard
            title="Product Performance"
            icon={<Package size={16} className="text-[var(--brand-primary)]" />}
            action={<ExportBtn onClick={exportProducts} />}
          >
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E4D9]">
                      <th className="text-left text-[#73786F] px-2 py-2 min-w-[140px]">Product</th>
                      <th className="text-left text-[#73786F] px-2 py-2 whitespace-nowrap">Pack Size</th>
                      <th className="text-right text-[#73786F] px-2 py-2 whitespace-nowrap">Units</th>
                      <th className="text-right text-[#73786F] px-2 py-2 whitespace-nowrap">Selling Rev.</th>
                      <th className="text-right text-[#73786F] px-2 py-2 whitespace-nowrap">Purchase Cost</th>
                      <th className="text-right text-[#73786F] px-2 py-2 whitespace-nowrap">Gross Profit</th>
                      <th className="text-right text-[#73786F] px-2 py-2 whitespace-nowrap">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4D9]">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[var(--brand-background)]">
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
                              <img src={p.thumbnail} alt={p.productName} loading="lazy" className="w-full h-full object-cover"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                            <span className="text-[#292D28] font-medium truncate max-w-[120px]">{p.productName}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-[#73786F] whitespace-nowrap">{p.variantLabel}</td>
                        <td className="px-2 py-2 text-right font-semibold text-[#292D28]">{p.unitsSold}</td>
                        <td className="px-2 py-2 text-right font-semibold text-[#292D28]">{formatINR(p.sellingRevenue)}</td>
                        <td className="px-2 py-2 text-right">
                          {p.purchaseCost > 0
                            ? <span className="text-[#292D28] font-medium">{formatINR(p.purchaseCost)}</span>
                            : <span className="text-amber-600 italic">Cost unavailable</span>}
                          {p.unknownCostQty > 0 && p.purchaseCost > 0 && (
                            <span className="text-[9px] text-amber-600 block">+{p.unknownCostQty} units no cost</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {p.grossProfit > 0
                            ? <span className="text-emerald-700 font-semibold">{formatINR(p.grossProfit)}</span>
                            : <span className="text-amber-600 italic">—</span>}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <MarginPill pct={p.grossMarginPct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-[#73786F] text-center py-6">No product sales in this period.</p>}
          </SCard>

          <SCard title="Category Performance" icon={<BarChart2 size={16} className="text-[var(--brand-primary)]" />}>
            {catPerf.length > 0
              ? <div className="flex flex-col gap-4">
                  {catPerf.map(({ category, revenue }) => (
                    <HBar key={category}
                          label={category.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          value={revenue} max={totalCatRevenue}
                          color={CATEGORY_COLORS[category] ?? '#E8E4D9'} suffix="₹" />
                  ))}
                </div>
              : <p className="text-sm text-[#73786F] text-center py-6">No category data in this period.</p>}
          </SCard>

          {bottomProducts.length > 0 && (
            <SCard title="Least Selling Products" icon={<Search size={16} className="text-[#73786F]" />}>
              <div className="flex flex-col gap-2.5">
                {bottomProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#292D28] truncate max-w-[240px]">{p.productName} — {p.variantLabel}</span>
                    <span className="text-[#73786F] shrink-0 text-xs">{p.unitsSold} units</span>
                  </div>
                ))}
              </div>
            </SCard>
          )}
        </div>
      )}

      {/* ══ INVENTORY TAB ════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="flex flex-col gap-5">
          <SCard title="Stock Overview" icon={<Package size={16} className="text-[var(--brand-primary)]" />} action={<ExportBtn onClick={exportInventory} />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Total Units',  value: totalUnits.toLocaleString('en-IN'), color: 'text-[#292D28]'   },
                { label: 'In Stock',     value: inStock,    color: 'text-emerald-600' },
                { label: 'Low Stock',    value: lowStock,   color: 'text-amber-600'   },
                { label: 'Out of Stock', value: outOfStock, color: 'text-red-600'     },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[var(--brand-background)] rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-[#73786F] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <BarChart data={[
              { label: 'In Stock', value: inStock }, { label: 'Low Stock', value: lowStock }, { label: 'Out of Stock', value: outOfStock },
            ]} color="var(--brand-accent)" />
          </SCard>

          {recentMoves.length > 0 && (
            <SCard title="Recent Stock Adjustments" icon={<TrendingUp size={16} className="text-[var(--brand-primary)]" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#E8E4D9]">
                    {['Date','Product','Size','Type','Change','New Stock'].map((h) => (
                      <th key={h} className="text-left text-[#73786F] px-2 py-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-[#E8E4D9]">
                    {recentMoves.map((m) => (
                      <tr key={m.id} className="hover:bg-[var(--brand-background)]">
                        <td className="px-2 py-2 text-[#73786F] whitespace-nowrap">{m.timestamp.split('T')[0]}</td>
                        <td className="px-2 py-2 text-[#292D28] truncate max-w-[140px]">{m.productName}</td>
                        <td className="px-2 py-2 text-[#73786F] whitespace-nowrap">{m.variantLabel}</td>
                        <td className="px-2 py-2 capitalize whitespace-nowrap">{m.adjustmentType.replace('-', ' ')}</td>
                        <td className={`px-2 py-2 font-semibold whitespace-nowrap ${m.newStock > m.previousStock ? 'text-emerald-600' : 'text-red-600'}`}>
                          {m.newStock > m.previousStock ? '+' : '−'}{Math.abs(m.newStock - m.previousStock)}
                        </td>
                        <td className="px-2 py-2 font-bold text-[#292D28] whitespace-nowrap">{m.newStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SCard>
          )}
        </div>
      )}

      {/* ══ CUSTOMERS TAB ════════════════════════════════════════════════ */}
      {activeTab === 'customers' && (
        <div className="flex flex-col gap-5">
          <SCard title="Customer Overview" icon={<Users size={16} className="text-[var(--brand-primary)]" />} action={<ExportBtn onClick={exportCustomers} />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Total',           value: customers.length,             color: 'text-[#292D28]' },
                { label: 'New This Period',  value: newCustomers,                 color: 'text-[var(--brand-accent)]' },
                { label: 'With Orders',     value: withOrders,                   color: 'text-[var(--brand-primary)]' },
                { label: 'No Orders',       value: customers.length - withOrders, color: 'text-[#73786F]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[var(--brand-background)] rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-[#73786F] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </SCard>

          {topCustomers.length > 0 && (
            <SCard title="Top Customers by Spending" icon={<TrendingUp size={16} className="text-[var(--brand-primary)]" />}>
              <div className="flex flex-col gap-3">
                {topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${idx === 0 ? 'bg-[var(--brand-accent)] text-white' : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'}`}>
                      {idx + 1}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#292D28] truncate">{c.name}</p>
                      <p className="text-xs text-[#73786F]">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-[#292D28] shrink-0">{formatINR(c.spent)}</span>
                  </div>
                ))}
              </div>
            </SCard>
          )}
        </div>
      )}
    </div>
  );
}
