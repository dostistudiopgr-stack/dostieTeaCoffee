import {
  ShoppingCart, Package, Users, IndianRupee,
  Clock, AlertTriangle, TrendingUp, Wallet,
  AlertCircle, BadgePercent,
} from 'lucide-react';
import { getAllOrders }          from '../../data/orders';
import { getAllProducts }        from '../../utils/productStore';
import { loadAllCustomers }      from '../../utils/customerStore';
import { formatINR }             from '../../utils/formatPrice';
import { calcAggregateFinancials } from '../../utils/financials';
import StatCard                  from '../../admin-components/dashboard/StatCard';
import SalesChart                from '../../admin-components/dashboard/SalesChart';
import RecentOrders              from '../../admin-components/dashboard/RecentOrders';
import TopProducts               from '../../admin-components/dashboard/TopProducts';
import LowStockAlerts            from '../../admin-components/dashboard/LowStockAlerts';
import OrderStatusBadge          from '../../components/orders/OrderStatusBadge';
import { useAdminAuth }          from '../../hooks/useAdminAuth';
import type { OrderStatus }      from '../../types';
import { useLocalDataRevision }  from '../../hooks/useLocalDataRevision';

// ─── Status list ──────────────────────────────────────────────────────────────

const ORDER_STATUS_LIST: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending',           label: 'Pending',          color: 'bg-amber-400'   },
  { status: 'confirmed',         label: 'Confirmed',        color: 'bg-blue-400'    },
  { status: 'processing',        label: 'Processing',       color: 'bg-blue-500'    },
  { status: 'shipped',           label: 'Shipped',          color: 'bg-[var(--brand-primary)]' },
  { status: 'out-for-delivery',  label: 'Out for Delivery', color: 'bg-emerald-500' },
  { status: 'delivered',         label: 'Delivered',        color: 'bg-emerald-600' },
  { status: 'cancelled',         label: 'Cancelled',        color: 'bg-red-500'     },
];

// ─── Margin pill ──────────────────────────────────────────────────────────────

function MarginPill({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-[#73786F]">—</span>;
  const color = pct >= 40 ? 'text-emerald-700 bg-emerald-50'
              : pct >= 20 ? 'text-amber-700 bg-amber-50'
              :             'text-red-700 bg-red-50';
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  useLocalDataRevision();
  const { admin }   = useAdminAuth();
  const orders      = getAllOrders();
  const activeProds = getAllProducts().filter((p) => p.isActive);

  // ── Financial metrics (admin-only — never exposed to customers) ───────────
  const fin = calcAggregateFinancials(orders);

  // ── Operational metrics ───────────────────────────────────────────────────
  const totalOrders   = orders.length;
  const totalProducts = activeProds.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = activeProds.filter((p) =>
    p.variants.some((v) => v.stock > 0 && v.stock <= 15)
  ).length;
  const customerCount = loadAllCustomers().length;

  // ── Status distribution ───────────────────────────────────────────────────
  const statusCounts = ORDER_STATUS_LIST.map(({ status }) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));
  const maxCount = Math.max(...statusCounts.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard Overview
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">
          Welcome back{admin ? `, ${admin.name}` : ''}! Here&apos;s what&apos;s happening at Dosti Tea &amp; Coffee.
        </p>
      </div>

      {/* ── Financial metrics — 3 × 2 grid ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#73786F] uppercase tracking-wide mb-3">
          Financial Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

          {/* 1. Sales Revenue — all committed sales, regardless of payment */}
          <StatCard
            title="Sales Revenue"
            value={formatINR(fin.salesRevenue)}
            icon={<IndianRupee size={20} />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-700"
            description="Confirmed + active orders"
          />

          {/* 2. Payment Collected — only genuinely paid */}
          <StatCard
            title="Payment Collected"
            value={formatINR(fin.paymentCollected)}
            icon={<Wallet size={20} />}
            iconBg="bg-blue-100"
            iconColor="text-blue-700"
            description="Paid orders only"
          />

          {/* 3. Outstanding COD — delivered but admin not yet verified */}
          <StatCard
            title="Outstanding COD"
            value={formatINR(fin.outstandingCod)}
            icon={<AlertCircle size={20} />}
            iconBg="bg-amber-100"
            iconColor="text-amber-700"
            description="Delivered, awaiting admin verify"
          />

          {/* 4. Total Purchase Cost — sum of cost snapshots */}
          <StatCard
            title="Purchase Cost"
            value={fin.totalPurchaseCost > 0 ? formatINR(fin.totalPurchaseCost) : '—'}
            icon={<ShoppingCart size={20} />}
            iconBg="bg-purple-100"
            iconColor="text-purple-700"
            description={
              fin.totalUnknownCostLines > 0
                ? `${fin.totalUnknownCostLines} lines without cost data`
                : 'From order snapshots'
            }
          />

          {/* 5. Gross Profit */}
          <StatCard
            title="Gross Profit"
            value={fin.grossProfit > 0 ? formatINR(fin.grossProfit) : '—'}
            icon={<TrendingUp size={20} />}
            iconBg="bg-[var(--brand-primary)]/10"
            iconColor="text-[var(--brand-primary)]"
            description={
              fin.ordersWithUnknownCost > 0
                ? `Partial — ${fin.ordersWithUnknownCost} orders missing cost`
                : 'Revenue − Purchase Cost'
            }
          />

          {/* 6. Gross Margin % */}
          <StatCard
            title="Gross Margin"
            value={fin.grossMarginPct !== null ? `${fin.grossMarginPct.toFixed(1)}%` : '—'}
            icon={<BadgePercent size={20} />}
            iconBg="bg-[var(--brand-accent)]/10"
            iconColor="text-[var(--brand-accent)]"
            description={
              fin.grossMarginPct === null
                ? 'Add purchase costs in Products'
                : 'On orders with known cost'
            }
          />
        </div>

        {/* Missing cost data notice */}
        {fin.totalUnknownCostLines > 0 && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200
                          rounded-xl px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>{fin.totalUnknownCostLines} order line{fin.totalUnknownCostLines !== 1 ? 's' : ''}</strong> across{' '}
              <strong>{fin.ordersWithUnknownCost} order{fin.ordersWithUnknownCost !== 1 ? 's' : ''}</strong> are
              missing purchase cost data. Gross Profit and Margin are calculated only for lines that have a saved
              purchase cost snapshot. Open <strong>Products → Edit</strong> to add purchase costs to variants
              — they will apply to future orders.
            </p>
          </div>
        )}
      </div>

      {/* ── Operational stats ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#73786F] uppercase tracking-wide mb-3">
          Operations
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            icon={<ShoppingCart size={20} />}
            iconBg="bg-blue-100"
            iconColor="text-blue-700"
          />
          <StatCard
            title="Products"
            value={totalProducts}
            icon={<Package size={20} />}
            iconBg="bg-purple-100"
            iconColor="text-purple-700"
            description="Active SKUs"
          />
          <StatCard
            title="Customers"
            value={customerCount.toLocaleString('en-IN')}
            icon={<Users size={20} />}
            iconBg="bg-[var(--brand-primary)]/10"
            iconColor="text-[var(--brand-primary)]"
            description="Saved accounts"
          />
          <StatCard
            title="Pending Orders"
            value={pendingOrders}
            icon={<Clock size={20} />}
            iconBg="bg-amber-100"
            iconColor="text-amber-700"
            description="Awaiting confirm"
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount}
            icon={<AlertTriangle size={20} />}
            iconBg="bg-red-100"
            iconColor="text-red-700"
            description="Below 15 units"
          />
        </div>
      </div>

      {/* ── Gross margin summary row ─────────────────────────────────────── */}
      {fin.grossMarginPct !== null && (
        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
          <h3 className="text-sm font-semibold text-[#292D28] mb-4">
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Sales Revenue',      value: formatINR(fin.salesRevenue)      },
              { label: 'Purchase Cost',       value: formatINR(fin.totalPurchaseCost) },
              { label: 'Gross Profit',        value: formatINR(fin.grossProfit)       },
              { label: 'Gross Margin',        value: <MarginPill pct={fin.grossMarginPct} /> },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[var(--brand-background)] rounded-xl p-3">
                <p className="text-xs text-[#73786F] mb-1">{label}</p>
                <p className="text-base font-bold text-[#292D28]">{value}</p>
              </div>
            ))}
          </div>
          {fin.ordersWithUnknownCost > 0 && (
            <p className="text-[11px] text-amber-700 mt-3 text-center">
              * Calculated only from the {fin.saleOrderCount - fin.ordersWithUnknownCost} orders
              with complete purchase cost data.
            </p>
          )}
        </div>
      )}

      {/* ── Sales chart + order status ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-5">
          <h3 className="text-base font-semibold text-[#292D28] mb-5"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Orders by Status
          </h3>
          <div className="flex flex-col gap-3">
            {statusCounts.map(({ status, count }) => {
              const cfg = ORDER_STATUS_LIST.find((s) => s.status === status)!;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <OrderStatusBadge status={status} size="small" dot={false} />
                    <span className="text-sm font-bold text-[#292D28]">{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#E8E4D9] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.color} transition-all duration-500`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent orders ────────────────────────────────────────────────── */}
      <RecentOrders />

      {/* ── Top products + Low stock ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopProducts />
        <LowStockAlerts />
      </div>
    </div>
  );
};

export default Dashboard;
