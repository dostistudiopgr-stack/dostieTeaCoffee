import { useState, useMemo, type FormEvent } from 'react';
import {
  Tag, Plus, Edit2, Trash2, X, Search,
  Check, AlertCircle, CheckCircle, ImageIcon, Eye,
} from 'lucide-react';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import {
  saveCategory, deleteCategory, getAllCategories,
  isCategoryDuplicate, type AdminCategory,
} from '../../utils/productStore';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10',
].join(' ');

const inputErrCls = [
  'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200',
].join(' ');

const labelCls = 'text-sm font-medium text-[#292D28] mb-1.5 block';
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle size={11} />{msg}
    </p>
  ) : null;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Default empty form ───────────────────────────────────────────────────────

const BLANK: AdminCategory & { isNew?: boolean } = {
  id:             '',
  name:           '',
  slug:           '',
  description:    '',
  image:          '',
  icon:           '',
  productCount:   0,
  isActive:       true,
  sortOrder:      99,
  showOnHomepage: true,
  isNew:          true,
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface CategoryFormProps {
  initial:       AdminCategory & { isNew?: boolean };
  onSave:        (cat: AdminCategory) => void;
  onCancel:      () => void;
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [form, setForm]       = useState({ ...initial });
  const [slugManual, setSlug] = useState(!initial.isNew);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [imgPreview, setImgPreview] = useState<string>(initial.image ?? '');

  const set = (field: keyof typeof form, val: string | boolean | number) =>
    setForm((f) => ({ ...f, [field]: val }));

  const handleNameChange = (v: string) => {
    set('name', v);
    if (!slugManual) set('slug', slugify(v));
    setErrors((e) => ({ ...e, name: '' }));
  };

  // ── Validate ────────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim())        e.name = 'Category name is required.';
    if (!form.slug.trim())        e.slug = 'Slug is required.';
    if (!form.description.trim()) e.desc = 'Description is required.';

    const dupes = isCategoryDuplicate(form.name, form.slug, form.id);
    if (dupes.name) e.name = 'A category with this name already exists.';
    if (dupes.slug) e.slug = 'A category with this slug already exists.';

    return e;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const toSave: AdminCategory = {
      id:             form.id || `cat-${Date.now()}`,
      name:           form.name.trim(),
      slug:           form.slug.trim(),
      description:    form.description.trim(),
      image:          imgPreview.trim(),
      icon:           form.icon?.trim() || undefined,
      productCount:   form.productCount,
      isActive:       form.isActive,
      sortOrder:      Number(form.sortOrder) || 99,
      showOnHomepage: form.showOnHomepage,
    };
    setSaving(false);
    setSaved(true);
    setTimeout(() => { onSave(toSave); }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                 p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={form.isNew ? 'Add Category' : 'Edit Category'}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-2xl overflow-hidden animate-[slideUp_200ms_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9] shrink-0">
          <h2 className="text-base font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            {initial.isNew ? 'Add New Category' : `Edit: ${initial.name}`}
          </h2>
          <button type="button" onClick={onCancel}
                  className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <X size={18} />
          </button>
        </div>

        {/* Success */}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} />Category saved successfully!
          </div>
        )}

        {/* Form body — scrollable */}
        <form onSubmit={handleSubmit} noValidate
              className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">

          {/* ── Basic info ───────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category Name <span className="text-red-500">*</span></label>
              <input
                className={errors.name ? inputErrCls : inputCls}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Tea Powders"
              />
              <FieldError msg={errors.name} />
            </div>

            <div>
              <label className={labelCls}>Slug <span className="text-red-500">*</span></label>
              <input
                className={errors.slug ? inputErrCls : inputCls}
                value={form.slug}
                onChange={(e) => { set('slug', e.target.value); setSlug(true); setErrors((er) => ({ ...er, slug: '' })); }}
                placeholder="tea"
              />
              <FieldError msg={errors.slug} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Description <span className="text-red-500">*</span></label>
              <textarea
                className={`${errors.desc ? inputErrCls : inputCls} resize-y`}
                rows={3}
                value={form.description}
                onChange={(e) => { set('description', e.target.value); setErrors((er) => ({ ...er, desc: '' })); }}
                placeholder="A brief description shown on category pages and filters."
              />
              <FieldError msg={errors.desc} />
            </div>

            <div>
              <label className={labelCls}>Icon (emoji)</label>
              <input
                className={inputCls}
                value={form.icon ?? ''}
                onChange={(e) => set('icon', e.target.value)}
                placeholder="🍵"
              />
            </div>

            <div>
              <label className={labelCls}>Display Order</label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value))}
                placeholder="1"
              />
            </div>
          </div>

          {/* ── Image ──────────────────────────────────────────── */}
          <div>
            <label className={labelCls}>Category Image
              <span className="text-[#73786F] font-normal ml-1">(enter an image URL)</span>
            </label>
            <div className="flex gap-3 items-start">
              {/* Preview */}
              <div className="w-20 h-20 rounded-xl border border-[#E8E4D9] bg-[var(--brand-background)] shrink-0
                              overflow-hidden flex items-center justify-center">
                {imgPreview.trim() ? (
                  <img
                    src={imgPreview}
                    alt="Category preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      (e.currentTarget.nextElementSibling as HTMLElement)?.removeAttribute('style');
                    }}
                  />
                ) : null}
                <ImageIcon
                  size={24}
                  className="text-[#E8E4D9]"
                  style={{ display: imgPreview.trim() ? 'none' : undefined }}
                />
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <input
                  className={inputCls}
                  value={imgPreview}
                  onChange={(e) => setImgPreview(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-…"
                />
                {imgPreview.trim() && (
                  <button
                    type="button"
                    onClick={() => setImgPreview('')}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 w-fit"
                  >
                    <X size={12} />Remove image
                  </button>
                )}
                <p className="text-[10px] text-[#73786F] leading-relaxed">
                  Paste a public image URL (Unsplash, CDN, etc.). Image preview is shown instantly.
                  The URL is saved to localStorage.
                </p>
              </div>
            </div>
          </div>

          {/* ── Display settings ───────────────────────────────── */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#E8E4D9]">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0"
              />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Active</span>
                <p className="text-xs text-[#73786F] mt-0.5">
                  Inactive categories are hidden from shop filters and navigation.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showOnHomepage ?? true}
                onChange={(e) => set('showOnHomepage', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0"
              />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Show on Homepage</span>
                <p className="text-xs text-[#73786F] mt-0.5">
                  Display in the Explore Our Collections section on the homepage.
                </p>
              </div>
            </label>
          </div>

          {/* ── Form actions ───────────────────────────────────── */}
          <div className="flex gap-3 pt-2 border-t border-[#E8E4D9]">
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
                : <><Check size={15} />Save Category</>}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-3
                         rounded-xl hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterStatus = 'all' | 'active' | 'inactive';
type SortKey      = 'name' | 'order' | 'products';

export default function Categories() {
  useLocalDataRevision();
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  const allCats = useMemo(() => { void refreshKey; return getAllCategories(); }, [refreshKey]);

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortKey,      setSortKey]      = useState<SortKey>('order');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('asc');

  const [editing,      setEditing]      = useState<(AdminCategory & { isNew?: boolean }) | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // Live product count per category slug (from merged product data)
  const getProductCount = (slug: string) =>
    getAllProducts().filter((p) => p.category === slug && p.isActive).length;

  // ── Filtered + sorted list ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...allCats];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q));
    if (statusFilter === 'active')   list = list.filter((c) => c.isActive);
    if (statusFilter === 'inactive') list = list.filter((c) => !c.isActive);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')     cmp = a.name.localeCompare(b.name);
      if (sortKey === 'order')    cmp = (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
      if (sortKey === 'products') cmp = getProductCount(a.slug) - getProductCount(b.slug);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [allCats, search, statusFilter, sortKey, sortDir]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleSave = (cat: AdminCategory) => {
    saveCategory({ ...cat, productCount: getProductCount(cat.slug) });
    setEditing(null);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleActive = (cat: AdminCategory) => {
    saveCategory({ ...cat, isActive: !cat.isActive });
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteCategory(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    setRefreshKey((k) => k + 1);
  };

  // Check products count before deleting
  const deleteProductCount = deleteTarget ? getProductCount(deleteTarget.slug) : 0;
  const deleteIsBlocked    = deleteProductCount > 0;

  const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Categories
          </h1>
          <p className="text-sm text-[#73786F] mt-0.5">
            Manage tea, coffee and green tea product categories.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...BLANK, id: '' })}
          className="flex items-center gap-2 bg-[var(--brand-primary)] text-white text-sm font-semibold
                     px-4 py-2.5 rounded-lg hover:bg-[var(--brand-dark)] transition-colors shrink-0
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        >
          <Plus size={16} />Add Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl
                       text-sm text-[#292D28] placeholder:text-[#73786F]/60
                       focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
          />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FilterStatus)} className={selectCls}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex items-center gap-1">
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={selectCls}>
            <option value="order">Display Order</option>
            <option value="name">Name A–Z</option>
            <option value="products">Product Count</option>
          </select>
          <button type="button" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#73786F] hover:text-[#292D28]">
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-[#73786F]">
        Showing <strong className="text-[#292D28]">{filtered.length}</strong> of{' '}
        <strong className="text-[#292D28]">{allCats.length}</strong> categories
      </p>

      {/* ── Desktop table ────────────────────────────────── */}
      <div className="hidden sm:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 min-w-[220px]">Category</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Slug</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Description</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Products</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Homepage</th>
                <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {filtered.map((cat) => {
                const count = getProductCount(cat.slug);
                return (
                  <tr key={cat.id} className="hover:bg-[var(--brand-background)] transition-colors">
                    {/* Category */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--brand-background)] border border-[#E8E4D9] shrink-0 flex items-center justify-center">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} loading="lazy"
                                 className="w-full h-full object-cover"
                                 onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                          ) : (
                            <span className="text-lg">{cat.icon ?? '📦'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#292D28] truncate max-w-[160px]">{cat.name}</p>
                          <p className="text-[10px] text-[var(--brand-accent)] font-semibold">Order {cat.sortOrder}</p>
                        </div>
                      </div>
                    </td>
                    {/* Slug */}
                    <td className="px-4 py-3 text-xs text-[#73786F] font-mono whitespace-nowrap">/{cat.slug}</td>
                    {/* Description */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-xs text-[#73786F] truncate">{cat.description}</p>
                    </td>
                    {/* Products */}
                    <td className="px-4 py-3 text-sm font-medium text-[#292D28] whitespace-nowrap">{count}</td>
                    {/* Status toggle */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button type="button" onClick={() => handleToggleActive(cat)}
                              title={cat.isActive ? 'Click to deactivate' : 'Click to activate'}
                              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                        {cat.isActive
                          ? <Badge variant="success" size="small" dot>Active</Badge>
                          : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
                      </button>
                    </td>
                    {/* Homepage */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {cat.showOnHomepage
                        ? <Check size={16} className="text-[var(--brand-primary)] mx-auto" />
                        : <span className="text-xs text-[#E8E4D9]">—</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/shop`} target="_blank" rel="noopener noreferrer"
                           className="p-1.5 rounded-lg text-[#73786F] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors" title="View in shop">
                          <Eye size={15} />
                        </a>
                        <button type="button" onClick={() => setEditing({ ...cat })}
                                className="p-1.5 rounded-lg text-[#73786F] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(cat)}
                                className="p-1.5 rounded-lg text-[#73786F] hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Tag size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No categories found</p>
            <p className="text-xs text-[#73786F]">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* ── Mobile card layout ───────────────────────────── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.map((cat) => {
          const count = getProductCount(cat.slug);
          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-[#E8E4D9] p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--brand-background)] border border-[#E8E4D9] shrink-0 flex items-center justify-center">
                  {cat.image
                    ? <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                    : <span className="text-xl">{cat.icon ?? '📦'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#292D28] text-sm">{cat.name}</p>
                  <p className="text-xs text-[#73786F] font-mono">/{cat.slug}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button type="button" onClick={() => handleToggleActive(cat)}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                      {cat.isActive ? <Badge variant="success" size="small" dot>Active</Badge> : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
                    </button>
                    <span className="text-xs text-[#73786F]">{count} products</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#73786F] line-clamp-2 mb-3">{cat.description}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8E4D9]">
                <button type="button" onClick={() => setEditing({ ...cat })}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)] py-2 rounded-lg hover:bg-[var(--brand-primary)] hover:text-white transition-all">
                  <Edit2 size={13} />Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(cat)}
                        className="px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 bg-white rounded-2xl border border-[#E8E4D9] text-center">
            <Tag size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No categories found</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit modal ───────────────────────────────── */}
      {editing && (
        <CategoryForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* ── Delete confirmation ──────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteIsBlocked ? () => setDeleteTarget(null) : handleDeleteConfirm}
        title={deleteIsBlocked ? 'Cannot Delete Category' : 'Deactivate Category?'}
        description={
          deleteIsBlocked
            ? `"${deleteTarget?.name}" has ${deleteProductCount} active product${deleteProductCount !== 1 ? 's' : ''}. Reassign or deactivate those products before removing this category. Historical orders will remain unchanged.`
            : `"${deleteTarget?.name}" will be marked inactive and hidden from shop navigation. This action can be reversed. Historical order data will not be affected.`
        }
        confirmLabel={deleteIsBlocked ? 'OK, Got It' : 'Yes, Deactivate'}
        cancelLabel={deleteIsBlocked ? undefined : 'Keep Category'}
        variant={deleteIsBlocked ? 'default' : 'danger'}
        loading={deleting}
      />
    </div>
  );
}
