import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Edit2, Trash2, Eye, Package,
  ChevronLeft, ChevronRight, Star,
} from 'lucide-react';
import { saveProduct, deleteProduct, getAllProducts } from '../../utils/productStore';
import { formatINR } from '../../utils/formatPrice';
import ProductImage from '../../components/product/ProductImage';
import type { Product, ProductCategory } from '../../types';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

const ITEMS_PER_PAGE = 10;

type SortKey       = 'name' | 'price' | 'stock' | 'date';
type FilterCat     = 'all' | ProductCategory;
type FilterStatus  = 'all' | 'active' | 'inactive';
type FilterStock   = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export default function Products() {
  useLocalDataRevision();
  const [refreshKey, setRefreshKey] = useState(0);
  const allProducts = useMemo(() => { void refreshKey; return getAllProducts(); }, [refreshKey]);

  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState<FilterCat>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [stockFilter,  setStockFilter]  = useState<FilterStock>('all');
  const [sortKey,      setSortKey]      = useState<SortKey>('date');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc');
  const [page,         setPage]         = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const totalStock = (p: Product) => p.variants.reduce((s, v) => s + v.stock, 0);
  const minPrice   = (p: Product) => Math.min(...p.variants.map((v) => v.price));
  const maxPrice   = (p: Product) => Math.max(...p.variants.map((v) => v.price));

  const filtered = useMemo(() => {
    let list = [...allProducts];

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q) || p.category.includes(q) || (p.sku ?? '').toLowerCase().includes(q));

    if (catFilter !== 'all')        list = list.filter((p) => p.category === catFilter);
    if (statusFilter === 'active')  list = list.filter((p) => p.isActive);
    if (statusFilter === 'inactive') list = list.filter((p) => !p.isActive);

    if (stockFilter === 'in-stock')    list = list.filter((p) => totalStock(p) > 15);
    if (stockFilter === 'low-stock')   list = list.filter((p) => totalStock(p) > 0 && totalStock(p) <= 15);
    if (stockFilter === 'out-of-stock') list = list.filter((p) => totalStock(p) === 0);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')  cmp = a.name.localeCompare(b.name);
      if (sortKey === 'price') cmp = minPrice(a) - minPrice(b);
      if (sortKey === 'stock') cmp = totalStock(a) - totalStock(b);
      if (sortKey === 'date')  cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allProducts, search, catFilter, statusFilter, stockFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteProduct(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleActive = (product: Product) => {
    saveProduct({ ...product, isActive: !product.isActive });
    setRefreshKey((k) => k + 1);
  };

  const handleToggleFeatured = (product: Product) => {
    saveProduct({ ...product, isFeatured: !product.isFeatured });
    setRefreshKey((k) => k + 1);
  };

  const selectCls = 'px-3 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#292D28] cursor-pointer focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            Products
          </h1>
          <p className="text-sm text-[#73786F] mt-0.5">
            Manage your tea, coffee and green tea powder products.
          </p>
        </div>
        <Link
          to="/admin/products/add"
          className="flex items-center gap-2 bg-[var(--brand-primary)] text-white text-sm font-semibold
                     px-4 py-2.5 rounded-lg hover:bg-[var(--brand-dark)] transition-colors shrink-0
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        >
          <Plus size={16} aria-hidden="true" />
          Add Product
        </Link>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, SKU or category…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl
                       text-sm text-[#292D28] placeholder:text-[#73786F]/60
                       focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
          />
        </div>

        <select value={catFilter}    onChange={(e) => { setCatFilter(e.target.value as FilterCat); setPage(1); }}    className={selectCls}>
          <option value="all">All Categories</option>
          <option value="tea">Tea Powders</option>
          <option value="coffee">Coffee Powders</option>
          <option value="green-tea">Green Tea</option>
        </select>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setPage(1); }} className={selectCls}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select value={stockFilter}  onChange={(e) => { setStockFilter(e.target.value as FilterStock); setPage(1); }}  className={selectCls}>
          <option value="all">All Stock</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        <div className="flex items-center gap-1">
          <select value={sortKey} onChange={(e) => { setSortKey(e.target.value as SortKey); setPage(1); }} className={selectCls}>
            <option value="date">Date Added</option>
            <option value="name">Name A–Z</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
          <button type="button" onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm text-[#73786F] hover:text-[#292D28]">
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-[#73786F]">
        Showing <strong className="text-[#292D28]">{filtered.length}</strong> of <strong className="text-[#292D28]">{allProducts.length}</strong> products
      </p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 min-w-[220px]">Product</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Category</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Variants</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Price Range</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Stock</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Featured</th>
                <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--brand-background)] transition-colors">
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
                        <ProductImage src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#292D28] truncate max-w-[180px] text-sm">{product.name}</p>
                        <p className="text-xs text-[#73786F] truncate font-mono">{product.sku ?? product.id}</p>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-4 py-3 text-[#73786F] capitalize whitespace-nowrap text-xs">
                    {product.category.replace('-', ' ')}
                  </td>
                  {/* Variants */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {product.variants.slice(0, 3).map((v) => (
                        <span key={v.id} className="text-[10px] bg-[var(--brand-background)] border border-[#E8E4D9] text-[#73786F] px-1.5 py-0.5 rounded">{v.label}</span>
                      ))}
                      {product.variants.length > 3 && <span className="text-[10px] text-[#73786F]">+{product.variants.length - 3}</span>}
                    </div>
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="font-medium text-[#292D28]">{formatINR(minPrice(product))}</span>
                    {minPrice(product) !== maxPrice(product) && (
                      <span className="text-[#73786F] text-xs"> – {formatINR(maxPrice(product))}</span>
                    )}
                  </td>
                  {/* Stock */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`font-medium ${totalStock(product) === 0 ? 'text-red-600' : totalStock(product) <= 15 ? 'text-amber-600' : 'text-[#292D28]'}`}>
                      {totalStock(product)}
                    </span>
                  </td>
                  {/* Status toggle */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button type="button" onClick={() => handleToggleActive(product)}
                            title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                      {product.isActive
                        ? <Badge variant="success" size="small" dot>Active</Badge>
                        : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
                    </button>
                  </td>
                  {/* Featured toggle */}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button type="button" onClick={() => handleToggleFeatured(product)}
                            title={product.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded p-1">
                      <Star size={16} className={product.isFeatured ? 'fill-[var(--brand-accent)] text-[var(--brand-accent)]' : 'text-[#E8E4D9]'} />
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/product/${product.slug}`} target="_blank"
                            className="p-1.5 rounded-lg text-[#73786F] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors" title="View on store">
                        <Eye size={15} />
                      </Link>
                      <Link to={`/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg text-[#73786F] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors" title="Edit">
                        <Edit2 size={15} />
                      </Link>
                      <button type="button" onClick={() => setDeleteTarget(product)}
                              className="p-1.5 rounded-lg text-[#73786F] hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No products found</p>
            <p className="text-xs text-[#73786F]">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginated.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl border border-[#E8E4D9] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--brand-background)] shrink-0 border border-[#E8E4D9]">
                <ProductImage src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#292D28] text-sm truncate">{product.name}</p>
                <p className="text-xs text-[#73786F] font-mono">{product.sku ?? product.id}</p>
                <p className="text-xs text-[#73786F] capitalize">{product.category.replace('-',' ')} powder</p>
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={() => handleToggleActive(product)}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                    {product.isActive ? <Badge variant="success" size="small" dot>Active</Badge> : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
                  </button>
                  {product.isFeatured && <Badge variant="brand" size="small">Featured</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><span className="text-[#73786F]">Price: </span><span className="font-medium text-[#292D28]">{formatINR(minPrice(product))}{minPrice(product) !== maxPrice(product) ? ` – ${formatINR(maxPrice(product))}` : ''}</span></div>
              <div><span className="text-[#73786F]">Stock: </span><span className={`font-medium ${totalStock(product) === 0 ? 'text-red-600' : totalStock(product) <= 15 ? 'text-amber-600' : 'text-[#292D28]'}`}>{totalStock(product)} units</span></div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#E8E4D9]">
              <Link to={`/admin/products/${product.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)] py-2 rounded-lg hover:bg-[var(--brand-primary)] hover:text-white transition-all">
                <Edit2 size={13} />Edit
              </Link>
              <Link to={`/product/${product.slug}`} target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#73786F] border border-[#E8E4D9] py-2 rounded-lg hover:bg-[var(--brand-background)] transition-colors">
                <Eye size={13} />View
              </Link>
              <button type="button" onClick={() => setDeleteTarget(product)}
                      className="px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {paginated.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center bg-white rounded-2xl border border-[#E8E4D9]">
            <Package size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No products found</p>
          </div>
        )}

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Product?"
        description={`"${deleteTarget?.name}" will be hidden from the customer store. Historical orders referencing this product will remain unchanged. You can reactivate it later.`}
        confirmLabel="Yes, Deactivate"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
