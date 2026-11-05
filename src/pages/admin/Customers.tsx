import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Users, X, Plus,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  UserCheck, UserX, Check, Mail, Phone,
} from 'lucide-react';
import { getAllOrders } from '../../data/orders';
import { loadAllCustomers, setCustomerActive, type AdminCustomer } from '../../utils/customerStore';
import { formatINR } from '../../utils/formatPrice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import type { Order } from '../../types';
import { createCustomerAccount } from '../../utils/customerStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey     = 'newest' | 'oldest' | 'alpha' | 'spent' | 'orders';
type FilterKey   = 'all' | 'active' | 'inactive' | 'with-orders' | 'no-orders' | 'new';

const ITEMS_PER_PAGE = 10;
const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function isNewCustomer(createdAt: string): boolean {
  return (Date.now() - new Date(createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
}

function buildCustomerOrderMap(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  orders.forEach((order) => {
    const uid = order.userId;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid)!.push(order);
  });
  return map;
}

// ─── Customer Details Panel ────────────────────────────────────────────────────

interface DetailPanelProps {
  customer:       AdminCustomer;
  orders:         Order[];
  onClose:        () => void;
  onStatusChange: (id: string, active: boolean) => void;
}

function CustomerDetailPanel({ customer, orders, onClose, onStatusChange }: DetailPanelProps) {
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [historyOpen,   setHistoryOpen]   = useState(true);

  const totalSpent      = orders.reduce((s, o) => s + o.total, 0);
  const delivered       = orders.filter((o) => o.status === 'delivered').length;
  const pending         = orders.filter((o) => o.status === 'pending').length;
  const cancelled       = orders.filter((o) => o.status === 'cancelled').length;
  const recentOrder     = orders[0];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
         onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Customer details"
        className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-2xl overflow-hidden animate-[slideUp_200ms_ease]
                   flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9] shrink-0">
          <h2 className="text-base font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Customer Details
          </h2>
          <button type="button" onClick={onClose}
                  className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* ── Profile header ─────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--brand-primary)] flex items-center
                              justify-center shrink-0">
                <span className="text-lg font-bold text-white">{getInitials(customer.name)}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-[#292D28]">{customer.name}</p>
                <p className="text-sm text-[#73786F] flex items-center gap-1.5">
                  <Mail size={12} />{customer.email}
                </p>
                {customer.phone && (
                  <p className="text-sm text-[#73786F] flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} />{customer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {customer.isActive
                ? <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><UserCheck size={12} />Active</span>
                : <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full"><UserX size={12} />Inactive</span>}
              {isNewCustomer(customer.createdAt) && (
                <span className="text-[10px] font-bold text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
          </div>

          {/* ── Personal info ──────────────────────────── */}
          <div className="bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] p-4">
            <p className="text-xs font-semibold text-[#73786F] uppercase tracking-wide mb-3">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              {[
                { label: 'Customer ID',    value: customer.id,    mono: true },
                { label: 'Registered',     value: fmtDate(customer.createdAt) },
                { label: 'Email',          value: customer.email },
                { label: 'Phone',          value: customer.phone || '—' },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-[#73786F]">{label}</p>
                  <p className={`font-medium text-[#292D28] mt-0.5 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Order summary ──────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-[#73786F] uppercase tracking-wide mb-3">Order Summary</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { label: 'Total Orders', value: orders.length,              color: 'text-[#292D28]'   },
                { label: 'Total Spent',  value: formatINR(totalSpent),      color: 'text-[var(--brand-primary)]'   },
                { label: 'Delivered',    value: delivered,                  color: 'text-emerald-600' },
                { label: 'Pending',      value: pending,                    color: 'text-amber-600'   },
                { label: 'Cancelled',    value: cancelled,                  color: 'text-red-500'     },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl border border-[#E8E4D9] p-3 text-center">
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-[#73786F] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
            {recentOrder && (
              <p className="text-xs text-[#73786F] mt-2">
                Most recent order: <strong className="text-[#292D28] font-mono">{recentOrder.orderNumber}</strong>
                {' '}on {fmtDate(recentOrder.createdAt)}
              </p>
            )}
          </div>

          {/* ── Address book ───────────────────────────── */}
          {customer.addresses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#73786F] uppercase tracking-wide mb-3">
                Address Book ({customer.addresses.length})
              </p>
              <div className="flex flex-col gap-2">
                {customer.addresses.map((addr) => (
                  <div key={addr.id}
                       className={`p-3.5 rounded-xl border text-sm ${addr.isDefault ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5' : 'border-[#E8E4D9] bg-[var(--brand-background)]'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[var(--brand-accent)] uppercase">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Check size={8} />Default
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-[#292D28]">{addr.fullName}</p>
                    <p className="text-xs text-[#73786F] mt-0.5">
                      {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}
                      {addr.landmark && `, Near ${addr.landmark}`}<br />
                      {addr.city}, {addr.state} — {addr.pincode}<br />
                      📞 {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Order history ──────────────────────────── */}
          <div>
            <button type="button"
                    className="flex items-center justify-between w-full text-xs font-semibold
                               text-[#73786F] uppercase tracking-wide mb-2
                               focus-visible:outline-none"
                    onClick={() => setHistoryOpen((v) => !v)}>
              Order History ({orders.length})
              {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {historyOpen && (
              orders.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {orders.map((o) => (
                    <Link key={o.id} to={`/admin/orders/${o.id}`}
                          onClick={onClose}
                          className="flex items-center justify-between p-3 bg-[var(--brand-background)]
                                     rounded-xl border border-[#E8E4D9] hover:border-[var(--brand-primary)]/30
                                     transition-colors">
                      <div>
                        <p className="text-xs font-mono font-bold text-[#292D28]">{o.orderNumber}</p>
                        <p className="text-xs text-[#73786F]">{fmtDate(o.createdAt)} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <OrderStatusBadge status={o.status} size="small" dot={false} />
                        <span className="text-sm font-bold text-[#292D28]">{formatINR(o.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#73786F] py-3">No orders placed yet.</p>
              )
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-[#E8E4D9]">
          <button type="button"
                  onClick={() => setConfirmToggle(true)}
                  className={[
                    'flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl',
                    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                    customer.isActive
                      ? 'border border-red-300 text-red-600 hover:bg-red-50'
                      : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                  ].join(' ')}>
            {customer.isActive ? <><UserX size={15} />Deactivate Account</> : <><UserCheck size={15} />Activate Account</>}
          </button>
          <button type="button" onClick={onClose}
                  className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm
                             py-2.5 rounded-xl hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors">
            Close
          </button>
        </div>

        {/* Status toggle confirm */}
        <ConfirmDialog
          isOpen={confirmToggle}
          onClose={() => setConfirmToggle(false)}
          onConfirm={() => { onStatusChange(customer.id, !customer.isActive); setConfirmToggle(false); onClose(); }}
          title={customer.isActive ? 'Deactivate Account?' : 'Activate Account?'}
          description={
            customer.isActive
              ? `"${customer.name}" will be marked inactive. Their authentication record is not deleted — this is a display-only status flag in this demo. Historical orders remain unchanged.`
              : `"${customer.name}" will be marked active. Their account will appear active in the admin panel.`
          }
          confirmLabel={customer.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={customer.isActive ? 'danger' : 'default'}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Customers() {
  useLocalDataRevision();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [createError, setCreateError] = useState('');
  void refreshKey;

  const allCustomers = useMemo(() => { void refreshKey; return loadAllCustomers(); }, [refreshKey]);
  const allOrders    = useMemo(() => { void refreshKey; return getAllOrders(); }, [refreshKey]);

  // Build order map: userId → orders[]
  const orderMap = useMemo(() => buildCustomerOrderMap(allOrders), [allOrders]);

  const getOrders = useCallback((c: AdminCustomer) => orderMap.get(c.id) ?? [], [orderMap]);
  const getSpent  = useCallback((c: AdminCustomer) => getOrders(c).reduce((s, o) => s + o.total, 0), [getOrders]);

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalCount       = allCustomers.length;
  const activeCount      = allCustomers.filter((c) => c.isActive).length;
  const newCount         = allCustomers.filter((c) => isNewCustomer(c.createdAt)).length;
  const withOrdersCount  = allCustomers.filter((c) => getOrders(c).length > 0).length;
  const noOrdersCount    = allCustomers.filter((c) => getOrders(c).length === 0).length;

  // ── Filters & sort ────────────────────────────────────────────────────────

  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterKey>('all');
  const [sort,       setSort]       = useState<SortKey>('newest');
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<AdminCustomer | null>(null);

  const filtered = useMemo(() => {
    let list = [...allCustomers];

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );

    if (filter === 'active')      list = list.filter((c) => c.isActive);
    if (filter === 'inactive')    list = list.filter((c) => !c.isActive);
    if (filter === 'new')         list = list.filter((c) => isNewCustomer(c.createdAt));
    if (filter === 'with-orders') list = list.filter((c) => getOrders(c).length > 0);
    if (filter === 'no-orders')   list = list.filter((c) => getOrders(c).length === 0);

    list.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'alpha')  return a.name.localeCompare(b.name);
      if (sort === 'spent')  return getSpent(b) - getSpent(a);
      if (sort === 'orders') return getOrders(b).length - getOrders(a).length;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });

    return list;
  }, [allCustomers, search, filter, sort, getOrders, getSpent]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const hasFilters = search || filter !== 'all';
  const clearFilters = () => { setSearch(''); setFilter('all'); setPage(1); };

  const handleStatusChange = (id: string, active: boolean) => {
    setCustomerActive(id, active);
    setRefreshKey((k) => k + 1);
  };
  const handleCreateCustomer = async (event: React.FormEvent) => {
    event.preventDefault(); setCreateError('');
    const result = await createCustomerAccount(createForm.name, createForm.email, createForm.phone, createForm.password);
    if (!result.success) { setCreateError(result.error ?? 'Could not create account.'); return; }
    setCreateForm({ name: '', email: '', phone: '', password: '' }); setShowCreate(false); setRefreshKey((key) => key + 1);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
        <h1 className="text-xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Customers
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">
          Registered customer accounts and their saved order history.
        </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />Add customer</button>
      </div>

      {/* ── Summary cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',          value: totalCount,      color: 'text-[#292D28]',   key: 'all'         as FilterKey },
          { label: 'Active',         value: activeCount,     color: 'text-emerald-600', key: 'active'      as FilterKey },
          { label: 'New (30 days)',   value: newCount,        color: 'text-[var(--brand-accent)]',   key: 'new'         as FilterKey },
          { label: 'With Orders',    value: withOrdersCount, color: 'text-[var(--brand-primary)]',   key: 'with-orders' as FilterKey },
          { label: 'No Orders',      value: noOrdersCount,   color: 'text-[#73786F]',   key: 'no-orders'   as FilterKey },
        ].map(({ label, value, color, key }) => (
          <div key={label}
               onClick={() => { setFilter(key); setPage(1); }}
               className={[
                 'bg-white rounded-xl border p-3.5 cursor-pointer hover:shadow-sm transition-shadow',
                 filter === key ? 'border-[var(--brand-primary)]/40 ring-1 ring-[var(--brand-primary)]/20' : 'border-[#E8E4D9]',
               ].join(' ')}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[#73786F] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
          <input type="search" value={search}
                 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                 placeholder="Search name, email or phone…"
                 className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl
                            text-sm text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)]
                            focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
        </div>

        <select value={filter} onChange={(e) => { setFilter(e.target.value as FilterKey); setPage(1); }} className={selectCls}>
          <option value="all">All Customers</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="new">New (30 days)</option>
          <option value="with-orders">With Orders</option>
          <option value="no-orders">No Orders</option>
        </select>

        <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }} className={selectCls}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="alpha">A–Z Name</option>
          <option value="spent">Highest Spending</option>
          <option value="orders">Most Orders</option>
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
        <strong className="text-[#292D28]">{allCustomers.length}</strong> customers
      </p>

      {/* ── Desktop table ─────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 min-w-[200px]">Customer</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Phone</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Registered</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Orders</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Spent</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {paginated.map((c) => {
                const orders     = getOrders(c);
                const totalSpent = getSpent(c);
                return (
                  <tr key={c.id} className="hover:bg-[var(--brand-background)] transition-colors">
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center
                                        justify-center shrink-0">
                          <span className="text-xs font-bold text-white">{getInitials(c.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#292D28] truncate max-w-[140px]">{c.name}</p>
                          {isNewCustomer(c.createdAt) && (
                            <span className="text-[10px] font-bold text-[var(--brand-accent)]">New</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#73786F] truncate max-w-[160px]">{c.email}</td>
                    <td className="px-4 py-3 text-[#73786F] whitespace-nowrap text-xs">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#73786F] whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-[#292D28] whitespace-nowrap text-center">{orders.length}</td>
                    <td className="px-4 py-3 font-semibold text-[#292D28] whitespace-nowrap">{formatINR(totalSpent)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.isActive
                        ? <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
                        : <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Inactive</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setSelected(c)}
                              className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E4D9]">
            <p className="text-xs text-[#73786F]">Page {safePage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
                      className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-[#292D28] px-1">{safePage}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                      className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Users size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No customers found</p>
            <p className="text-xs text-[#73786F]">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* ── Mobile cards ──────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginated.map((c) => {
          const orders = getOrders(c);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-[#E8E4D9] p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{getInitials(c.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292D28] truncate">{c.name}</p>
                  <p className="text-xs text-[#73786F] truncate">{c.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {c.isActive
                      ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Active</span>
                      : <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Inactive</span>}
                    {isNewCustomer(c.createdAt) && (
                      <span className="text-[10px] font-bold text-[var(--brand-accent)]">New</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D9]">
                <span className="text-xs text-[#73786F]">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} ·{' '}
                  {formatINR(getSpent(c))}
                </span>
                <button type="button" onClick={() => setSelected(c)}
                        className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)]">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
        {paginated.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-2xl border border-[#E8E4D9] text-center">
            <Users size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No customers found</p>
          </div>
        )}
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

      <p className="text-xs text-[#73786F]">Passwords and authentication hashes are not shown in customer records.</p>

      {/* ── Detail panel ────────────────────────────────── */}
      {selected && (
        <CustomerDetailPanel
          customer={selected}
          orders={getOrders(selected)}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}><form onSubmit={handleCreateCustomer} onClick={(event) => event.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Create customer account</h2><button type="button" aria-label="Close" onClick={() => setShowCreate(false)}><X size={18} /></button></div>
        <input required placeholder="Full name" value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} className="w-full rounded-lg border p-3" />
        <input required type="email" placeholder="Email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} className="w-full rounded-lg border p-3" />
        <input type="tel" placeholder="Phone" value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} className="w-full rounded-lg border p-3" />
        <input required type="password" minLength={10} autoComplete="new-password" placeholder="Temporary password (10+ characters)" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} className="w-full rounded-lg border p-3" />
        {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}
        <button className="w-full rounded-lg bg-[var(--brand-primary)] p-3 font-semibold text-white">Create customer</button>
      </form></div>}
    </div>
  );
}
