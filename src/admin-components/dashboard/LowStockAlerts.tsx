import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

// ─── Config ───────────────────────────────────────────────────────────────────

const LOW_THRESHOLD = 15;

interface LowStockItem {
  productId:   string;
  productName: string;
  variantId:   string;
  variantLabel:string;
  stock:       number;
}

function getLowStockItems(): LowStockItem[] {
  const items: LowStockItem[] = [];
  for (const p of getAllProducts()) {
    if (!p.isActive) continue;
    for (const v of p.variants) {
      if (v.stock > 0 && v.stock <= LOW_THRESHOLD) {
        items.push({
          productId:    p.id,
          productName:  p.name,
          variantId:    v.id,
          variantLabel: v.label,
          stock:        v.stock,
        });
      }
      if (v.stock === 0) {
        items.push({
          productId:    p.id,
          productName:  p.name,
          variantId:    v.id,
          variantLabel: v.label,
          stock:        0,
        });
      }
    }
  }
  return items.sort((a, b) => a.stock - b.stock).slice(0, 8);
}

// ─── Component ────────────────────────────────────────────────────────────────

const LowStockAlerts = () => {
  useLocalDataRevision();
  const items = getLowStockItems();

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4D9]">
        <h3 className="text-base font-semibold text-[#292D28] flex items-center gap-2"
            style={{ fontFamily: 'var(--font-heading)' }}>
          <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
          Low Stock Alerts
        </h3>
        <Link to="/admin/inventory"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]
                         hover:text-[var(--brand-dark)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)] rounded">
          Inventory <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[#73786F] text-center py-8">All products are well stocked.</p>
      ) : (
        <div className="divide-y divide-[#E8E4D9]">
          {items.map((item) => {
            const oos = item.stock === 0;
            return (
              <div key={`${item.productId}-${item.variantId}`}
                   className="flex items-center justify-between gap-3 px-5 py-3
                              hover:bg-[var(--brand-background)] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#292D28] truncate">{item.productName}</p>
                  <p className="text-xs text-[#73786F]">{item.variantLabel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-[#292D28]">{item.stock}</span>
                  <span className={[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    oos
                      ? 'bg-red-100 text-red-700'
                      : item.stock <= 5
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-700',
                  ].join(' ')}>
                    {oos ? 'Out of Stock' : item.stock <= 5 ? 'Critical' : 'Low'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LowStockAlerts;
