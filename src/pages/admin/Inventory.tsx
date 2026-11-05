import { useState, useMemo, type FormEvent } from 'react';
import {
  Search, Package, AlertTriangle, X,
  CheckCircle, AlertCircle, History, SlidersHorizontal,
  Layers, ArrowUpCircle, ArrowDownCircle, RotateCcw,
} from 'lucide-react';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import {
  adjustVariantStock, loadStockHistory,
  type AdjustmentType, type StockMovement,
} from '../../utils/productStore';
import { formatINR } from '../../utils/formatPrice';
import Badge from '../../components/common/Badge';
import { useAdminSettings } from '../../hooks/useAdminSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantRow {
  productId:    string;
  productName:  string;
  thumbnail:    string;
  category:     string;
  variantId:    string;
  variantLabel: string;
  sku:          string;
  stock:        number;
  price:        number;
}

type Tab            = 'inventory' | 'history';
type StockFilter    = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortKey        = 'name' | 'stock-asc' | 'stock-desc' | 'sku';

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'stock-in',   label: 'Stock In',        icon: <ArrowUpCircle   size={16} />, color: 'text-emerald-600' },
  { value: 'stock-out',  label: 'Stock Out',       icon: <ArrowDownCircle size={16} />, color: 'text-red-500'     },
  { value: 'correction', label: 'Stock Correction',icon: <RotateCcw       size={16} />, color: 'text-blue-600'    },
];

const REASONS = [
  'Purchase order received',
  'Customer return',
  'Damaged goods removed',
  'Manual correction',
  'Stock count discrepancy',
  'Internal transfer',
  'Other',
];

const inputCls = [
  'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10',
].join(' ');

const errCls = [
  'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200',
].join(' ');

// ─── Stock Adjustment Modal ────────────────────────────────────────────────────

interface AdjustModalProps {
  variant:    VariantRow;
  threshold:  number;
  onSave:     () => void;
  onClose:    () => void;
}

function AdjustModal({ variant, threshold, onSave, onClose }: AdjustModalProps) {
  const [adjType,   setAdjType]   = useState<AdjustmentType>('stock-in');
  const [quantity,  setQuantity]  = useState('');
  const [reason,    setReason]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty < 0) e.qty = 'Enter a valid non-negative number.';
    if (adjType === 'stock-out' && qty > variant.stock)
      e.qty = `Cannot remove more than current stock (${variant.stock} units).`;
    if (adjType === 'correction' && qty < 0) e.qty = 'Corrected stock cannot be negative.';
    if (!reason) e.reason = 'Please select a reason.';
    return e;
  };

  const preview = (): number => {
    const qty = Number(quantity) || 0;
    if (adjType === 'stock-in')   return variant.stock + qty;
    if (adjType === 'stock-out')  return Math.max(0, variant.stock - qty);
    return Math.max(0, qty);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    adjustVariantStock({
      productId:      variant.productId,
      variantId:      variant.variantId,
      productName:    variant.productName,
      variantLabel:   variant.variantLabel,
      sku:            variant.sku,
      adjustmentType: adjType,
      quantity:       Number(quantity),
      reason,
      notes,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSave(); onClose(); }, 800);
  };

  const newStock  = preview();
  const delta     = newStock - variant.stock;
  const deltaText = delta === 0 ? '±0' : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
         onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Adjust Stock"
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-2xl animate-[slideUp_200ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9]">
          <div>
            <h2 className="text-base font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}>Stock Adjustment</h2>
            <p className="text-xs text-[#73786F] mt-0.5 truncate max-w-[280px]">
              {variant.productName} — {variant.variantLabel}
            </p>
          </div>
          <button type="button" onClick={onClose}
                  className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Success */}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} />Stock updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate
              className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--brand-background)] rounded-xl p-3">
              <p className="text-[10px] text-[#73786F] uppercase tracking-wide">SKU</p>
              <p className="text-sm font-mono font-semibold text-[#292D28] mt-0.5">{variant.sku}</p>
            </div>
            <div className="bg-[var(--brand-background)] rounded-xl p-3">
              <p className="text-[10px] text-[#73786F] uppercase tracking-wide">Current Stock</p>
              <p className="text-sm font-bold text-[#292D28] mt-0.5">{variant.stock} units</p>
            </div>
          </div>

          {/* Adjustment type */}
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-2 block">Adjustment Type</label>
            <div className="flex gap-2">
              {ADJUSTMENT_TYPES.map(({ value, label, icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAdjType(value); setErrors({}); }}
                  className={[
                    'flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2',
                    'text-xs font-semibold transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                    adjType === value
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6 text-[var(--brand-primary)]'
                      : `border-[#E8E4D9] ${color}`,
                  ].join(' ')}
                >
                  {icon}
                  <span className="hidden sm:block leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              {adjType === 'correction' ? 'New Stock Level' : 'Quantity'}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setErrors((er) => ({ ...er, qty: '' })); }}
              className={errors.qty ? errCls : inputCls}
              placeholder={adjType === 'correction' ? 'Enter corrected stock level' : 'Enter quantity'}
            />
            {errors.qty && (
              <p role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.qty}
              </p>
            )}
          </div>

          {/* Preview */}
          {quantity && !errors.qty && (
            <div className={[
              'flex items-center justify-between rounded-xl px-4 py-3 text-sm',
              newStock === 0 ? 'bg-red-50 border border-red-200' :
              newStock <= threshold ? 'bg-amber-50 border border-amber-200' :
              'bg-emerald-50 border border-emerald-200',
            ].join(' ')}>
              <span className="text-[#73786F]">New stock will be:</span>
              <span className="font-bold text-[#292D28]">
                {newStock} units
                <span className={[
                  'ml-2 text-xs font-semibold',
                  delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-[#73786F]',
                ].join(' ')}>
                  ({deltaText})
                </span>
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((er) => ({ ...er, reason: '' })); }}
              className={errors.reason ? errCls : inputCls}
            >
              <option value="">Select a reason</option>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.reason && (
              <p role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />{errors.reason}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Notes <span className="text-[#73786F] font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Additional details about this adjustment…"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 border-t border-[#E8E4D9]">
            <button
              type="submit"
              disabled={saving || saved}
              className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white
                         font-semibold text-sm py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                         disabled:opacity-70 focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                : saved
                ? <><CheckCircle size={15} />Saved!</>
                : 'Save Adjustment'}
            </button>
            <button type="button" onClick={onClose}
                    className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm
                               py-3 rounded-xl hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [history]                       = useState<StockMovement[]>(() => loadStockHistory());
  const [search,  setSearch]            = useState('');
  const [adjFilter, setAdjFilter]       = useState<'all' | AdjustmentType>('all');
  const [dateFilter, setDateFilter]     = useState('');
  const [prodFilter]                    = useState('');

  const filtered = useMemo(() => {
    let list = [...history];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((m) => m.productName.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q));
    if (adjFilter !== 'all') list = list.filter((m) => m.adjustmentType === adjFilter);
    if (dateFilter) {
      list = list.filter((m) => m.timestamp.startsWith(dateFilter));
    }
    if (prodFilter) list = list.filter((m) => m.productName.toLowerCase().includes(prodFilter.toLowerCase()));
    return list;
  }, [history, search, adjFilter, dateFilter, prodFilter]);

  const typeLabel: Record<AdjustmentType, string> = {
    'stock-in':   'Stock In',
    'stock-out':  'Stock Out',
    'correction': 'Correction',
  };
  const typeBadge: Record<AdjustmentType, 'success' | 'danger' | 'info'> = {
    'stock-in':   'success',
    'stock-out':  'danger',
    'correction': 'info',
  };

  const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search product or SKU…"
                 className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
        </div>
        <select value={adjFilter} onChange={(e) => setAdjFilter(e.target.value as 'all' | AdjustmentType)} className={selectCls}>
          <option value="all">All Types</option>
          <option value="stock-in">Stock In</option>
          <option value="stock-out">Stock Out</option>
          <option value="correction">Correction</option>
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
               className={selectCls} />
        {(search || adjFilter !== 'all' || dateFilter) && (
          <button type="button"
                  onClick={() => { setSearch(''); setAdjFilter('all'); setDateFilter(''); }}
                  className="text-xs font-semibold text-[#73786F] hover:text-red-500 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Date & Time</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Pack Size</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">SKU</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Type</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Prev</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Change</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">New</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--brand-background)] transition-colors">
                  <td className="px-4 py-3 text-xs text-[#73786F] whitespace-nowrap">
                    {new Date(m.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <br />
                    <span className="text-[10px]">{new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="font-medium text-[#292D28] truncate">{m.productName}</p>
                  </td>
                  <td className="px-4 py-3 text-[#292D28] whitespace-nowrap">{m.variantLabel}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#73786F] whitespace-nowrap">{m.sku}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={typeBadge[m.adjustmentType]} size="small">{typeLabel[m.adjustmentType]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap">{m.previousStock}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={[
                      'font-semibold',
                      m.newStock > m.previousStock ? 'text-emerald-600'
                      : m.newStock < m.previousStock ? 'text-red-600'
                      : 'text-[#73786F]',
                    ].join(' ')}>
                      {m.newStock > m.previousStock ? '+' : m.newStock < m.previousStock ? '−' : '±'}
                      {Math.abs(m.newStock - m.previousStock)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#292D28] whitespace-nowrap">{m.newStock}</td>
                  <td className="px-4 py-3 text-xs text-[#73786F] max-w-[140px]">
                    <p className="truncate">{m.reason}</p>
                    {m.notes && <p className="truncate text-[#73786F]/60">{m.notes}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <History size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No history records</p>
            <p className="text-xs text-[#73786F]">
              {history.length === 0 ? 'Stock adjustments will appear here after your first update.' : 'Try adjusting your filters.'}
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-[#73786F]">
        {filtered.length} record{filtered.length !== 1 ? 's' : ''} shown · up to 500 records stored
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Inventory() {
  useLocalDataRevision();
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sizeFilter,setSizeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey,   setSortKey]   = useState<SortKey>('name');
  const [adjusting, setAdjusting] = useState<VariantRow | null>(null);

  // Load threshold from settings
  const settings = useAdminSettings();
  const threshold = settings.inventory.lowStockThreshold;

  // Build flat variant list from merged products
  const allVariants = useMemo((): VariantRow[] => {
    void refreshKey;
    const list: VariantRow[] = [];
    getAllProducts()
      .filter((p) => p.isActive)
      .forEach((p) => {
        p.variants.forEach((v) => {
          list.push({
            productId:    p.id,
            productName:  p.name,
            thumbnail:    p.thumbnail,
            category:     p.category,
            variantId:    v.id,
            variantLabel: v.label,
            sku:          v.sku,
            stock:        v.stock,
            price:        v.price,
          });
        });
      });
    return list;
  }, [refreshKey]);

  // Summary stats
  const totalProducts  = useMemo(() => new Set(allVariants.map((v) => v.productId)).size, [allVariants]);
  const totalUnits     = useMemo(() => allVariants.reduce((s, v) => s + v.stock, 0), [allVariants]);
  const inStockCount   = useMemo(() => allVariants.filter((v) => v.stock > threshold).length, [allVariants, threshold]);
  const lowStockCount  = useMemo(() => allVariants.filter((v) => v.stock > 0 && v.stock <= threshold).length, [allVariants, threshold]);
  const outStockCount  = useMemo(() => allVariants.filter((v) => v.stock === 0).length, [allVariants]);
  const lowStockItems  = useMemo(() => allVariants.filter((v) => v.stock > 0 && v.stock <= threshold).slice(0, 5), [allVariants, threshold]);

  // Available pack sizes for filter
  const packSizes = useMemo(() => {
    const sizes = new Set<string>();
    allVariants.forEach((v) => sizes.add(v.variantLabel));
    return [...sizes].sort();
  }, [allVariants]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...allVariants];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((v) => v.productName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
    if (catFilter !== 'all')  list = list.filter((v) => v.category === catFilter);
    if (sizeFilter !== 'all') list = list.filter((v) => v.variantLabel === sizeFilter);
    if (stockFilter === 'in-stock')    list = list.filter((v) => v.stock > threshold);
    if (stockFilter === 'low-stock')   list = list.filter((v) => v.stock > 0 && v.stock <= threshold);
    if (stockFilter === 'out-of-stock') list = list.filter((v) => v.stock === 0);
    list.sort((a, b) => {
      if (sortKey === 'name')       return a.productName.localeCompare(b.productName);
      if (sortKey === 'stock-asc')  return a.stock - b.stock;
      if (sortKey === 'stock-desc') return b.stock - a.stock;
      if (sortKey === 'sku')        return a.sku.localeCompare(b.sku);
      return 0;
    });
    return list;
  }, [allVariants, search, catFilter, sizeFilter, stockFilter, sortKey, threshold]);

  const clearFilters = () => {
    setSearch(''); setCatFilter('all'); setSizeFilter('all');
    setStockFilter('all'); setSortKey('name');
  };

  const hasFilters = search || catFilter !== 'all' || sizeFilter !== 'all' || stockFilter !== 'all';

  const getStockStatus = (stock: number) => {
    if (stock === 0)          return { variant: 'danger'  as const, label: 'Out of Stock' };
    if (stock <= threshold)   return { variant: 'warning' as const, label: `Low (${stock})` };
    return                           { variant: 'success' as const, label: 'In Stock' };
  };

  const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}>
          Inventory Management
        </h1>
        <p className="text-sm text-[#73786F] mt-0.5">
          Manage per-variant stock levels. Low-stock threshold: <strong>{threshold} units</strong>.
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Products',       value: totalProducts,           color: 'text-[#292D28]',  bg: 'bg-white' },
          { label: 'Variants',       value: allVariants.length,      color: 'text-[#292D28]',  bg: 'bg-white' },
          { label: 'Total Units',    value: totalUnits.toLocaleString('en-IN'), color: 'text-[var(--brand-primary)]', bg: 'bg-white' },
          { label: 'In Stock',       value: inStockCount,            color: 'text-emerald-600', bg: 'bg-white' },
          { label: 'Low Stock',      value: lowStockCount,           color: 'text-amber-600',   bg: 'bg-white' },
          { label: 'Out of Stock',   value: outStockCount,           color: 'text-red-600',     bg: 'bg-white' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-[#E8E4D9] p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[#73786F] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Low-stock alert strip ─────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {lowStockCount} variant{lowStockCount !== 1 ? 's' : ''} running low on stock
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {lowStockItems.map((v) => (
              <div key={v.variantId} className="flex items-center justify-between text-xs">
                <span className="text-amber-800 truncate max-w-[200px] sm:max-w-xs">
                  {v.productName} ({v.variantLabel})
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-amber-700">{v.stock} left</span>
                  <button
                    type="button"
                    onClick={() => setAdjusting(v)}
                    className="text-[var(--brand-primary)] font-semibold hover:underline"
                  >
                    Adjust →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[#E8E4D9]">
        {[
          { id: 'inventory' as Tab, label: 'Inventory', icon: <Layers   size={15} /> },
          { id: 'history'   as Tab, label: 'History',   icon: <History  size={15} /> },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px',
              'transition-colors focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--brand-accent)]',
              activeTab === id
                ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                : 'border-transparent text-[#73786F] hover:text-[#292D28]',
            ].join(' ')}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Inventory tab ────────────────────────────── */}
      {activeTab === 'inventory' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
              <input type="search" value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search product or SKU…"
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm
                                text-[#292D28] focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
            </div>

            <select value={catFilter}    onChange={(e) => setCatFilter(e.target.value)}    className={selectCls}>
              <option value="all">All Categories</option>
              <option value="tea">Tea Powders</option>
              <option value="coffee">Coffee Powders</option>
              <option value="green-tea">Green Tea</option>
            </select>

            <select value={sizeFilter}   onChange={(e) => setSizeFilter(e.target.value)}   className={selectCls}>
              <option value="all">All Sizes</option>
              {packSizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={stockFilter}  onChange={(e) => setStockFilter(e.target.value as StockFilter)} className={selectCls}>
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <select value={sortKey}      onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
              <option value="name">Sort: Name</option>
              <option value="stock-asc">Sort: Stock ↑</option>
              <option value="stock-desc">Sort: Stock ↓</option>
              <option value="sku">Sort: SKU</option>
            </select>

            {hasFilters && (
              <button type="button" onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#73786F] hover:text-red-500 transition-colors px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl">
                <X size={13} />Clear
              </button>
            )}
          </div>

          <p className="text-xs text-[#73786F]">
            Showing <strong className="text-[#292D28]">{filtered.length}</strong> of{' '}
            <strong className="text-[#292D28]">{allVariants.length}</strong> variants
          </p>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 min-w-[200px]">Product</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Category</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Pack Size</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">SKU</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Price</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Stock</th>
                    <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4D9]">
                  {filtered.map((v) => {
                    const status   = getStockStatus(v.stock);
                    const isLow    = v.stock > 0 && v.stock <= threshold;
                    const isOut    = v.stock === 0;
                    return (
                      <tr key={v.variantId}
                          className={[
                            'transition-colors',
                            isOut  ? 'bg-red-50/40 hover:bg-red-50'
                            : isLow ? 'bg-amber-50/40 hover:bg-amber-50'
                            :         'hover:bg-[var(--brand-background)]',
                          ].join(' ')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
                              <img src={v.thumbnail} alt="" loading="lazy"
                                   className="w-full h-full object-cover"
                                   onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                            </div>
                            <p className="font-medium text-[#292D28] truncate max-w-[160px]">{v.productName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#73786F] capitalize whitespace-nowrap">
                          {v.category.replace('-', ' ')}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#292D28] whitespace-nowrap">{v.variantLabel}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#73786F] whitespace-nowrap">{v.sku}</td>
                        <td className="px-4 py-3 text-[#292D28] whitespace-nowrap">{formatINR(v.price)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#292D28]'}`}>
                            {v.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={status.variant} size="small">{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => setAdjusting(v)}
                                  className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors
                                             px-3 py-1.5 border border-[var(--brand-primary)]/30 rounded-lg hover:bg-[var(--brand-primary)]/5">
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
                <p className="text-sm font-medium text-[#292D28]">No variants found</p>
                <p className="text-xs text-[#73786F]">Try adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((v) => {
              const status = getStockStatus(v.stock);
              const isLow  = v.stock > 0 && v.stock <= threshold;
              const isOut  = v.stock === 0;
              return (
                <div key={v.variantId}
                     className={[
                       'rounded-2xl border p-4',
                       isOut  ? 'bg-red-50 border-red-200'
                       : isLow ? 'bg-amber-50 border-amber-200'
                       :         'bg-white border-[#E8E4D9]',
                     ].join(' ')}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
                      <img src={v.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#292D28] text-sm truncate">{v.productName}</p>
                      <p className="text-xs text-[#73786F] capitalize">{v.category.replace('-',' ')}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium text-[#292D28] bg-white border border-[#E8E4D9] px-2 py-0.5 rounded-full">{v.variantLabel}</span>
                        <span className="text-xs font-mono text-[#73786F]">{v.sku}</span>
                        <Badge variant={status.variant} size="small">{status.label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E4D9]">
                    <div>
                      <span className={`text-lg font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#292D28]'}`}>{v.stock}</span>
                      <span className="text-xs text-[#73786F] ml-1">units</span>
                    </div>
                    <button type="button" onClick={() => setAdjusting(v)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 px-3 py-2 rounded-lg hover:bg-[var(--brand-primary)] hover:text-white transition-all">
                      <SlidersHorizontal size={13} />Adjust
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-2xl border border-[#E8E4D9] text-center">
                <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
                <p className="text-sm font-medium text-[#292D28]">No variants found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── History tab ───────────────────────────────── */}
      {activeTab === 'history' && <HistoryTab />}

      {/* ── Adjustment modal ─────────────────────────── */}
      {adjusting && (
        <AdjustModal
          variant={adjusting}
          threshold={threshold}
          onSave={() => setRefreshKey((k) => k + 1)}
          onClose={() => setAdjusting(null)}
        />
      )}
    </div>
  );
}
