import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ShoppingBag, ArrowUpDown } from 'lucide-react';
import { useAuth }          from '../../hooks/useAuth';
import { getOrdersByUserId } from '../../data/orders';
import type { Order, OrderStatus } from '../../types';
import { formatINR }        from '../../utils/formatPrice';
import OrderStatusBadge     from '../../components/orders/OrderStatusBadge';
import OrderItemCard        from '../../components/orders/OrderItemCard';
import EmptyState           from '../../components/common/EmptyState';
import { useOrderSync } from '../../hooks/useOrderSync';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'all' | OrderStatus;

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',              label: 'All'            },
  { id: 'pending',          label: 'Pending'        },
  { id: 'confirmed',        label: 'Confirmed'      },
  { id: 'processing',       label: 'Processing'     },
  { id: 'shipped',          label: 'Shipped'        },
  { id: 'out-for-delivery', label: 'Out for Delivery'},
  { id: 'delivered',        label: 'Delivered'      },
  { id: 'cancelled',        label: 'Cancelled'      },
  { id: 'returned',         label: 'Returned'       },
];

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',  label: 'Newest First'    },
  { value: 'oldest',  label: 'Oldest First'    },
  { value: 'highest', label: 'Highest Amount'  },
  { value: 'lowest',  label: 'Lowest Amount'   },
];

// ─── Order card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order }: { order: Order }) => {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <article className="bg-white rounded-2xl border border-[#E8E4D9]
                        hover:border-[var(--brand-primary)]/25 hover:shadow-md
                        transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3
                      px-5 py-4 border-b border-[#E8E4D9] bg-[var(--brand-background)]">
        <div>
          <p className="text-xs text-[#73786F]">Order ID</p>
          <p className="text-sm font-bold text-[#292D28] font-mono">{order.orderNumber}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-[#73786F]">Placed on</p>
          <p className="text-sm font-medium text-[#292D28]">{date}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-[#73786F]">Total</p>
          <p className="text-sm font-bold text-[#292D28]">{formatINR(order.total)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Items (compact) */}
      <div className="px-5 py-4">
        <div className="flex flex-col gap-2.5">
          {order.items.slice(0, 2).map((item) => (
            <OrderItemCard
              key={`${item.productId}-${item.variantId}`}
              item={item}
              compact
            />
          ))}
          {order.items.length > 2 && (
            <p className="text-xs text-[#73786F] pl-12">
              +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Mobile amount */}
        <div className="flex items-center justify-between mt-3 sm:hidden">
          <span className="text-xs text-[#73786F]">{date}</span>
          <span className="text-sm font-bold text-[#292D28]">{formatINR(order.total)}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3
                      border-t border-[#E8E4D9]">
        <Link
          to={`/order-details/${order.id}`}
          className="flex-1 sm:flex-none text-center sm:text-left
                     text-sm font-semibold text-[var(--brand-primary)]
                     border border-[var(--brand-primary)] px-4 py-2 rounded-xl
                     hover:bg-[var(--brand-primary)] hover:text-white transition-all duration-150
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          View Details
        </Link>
        {!['cancelled', 'returned'].includes(order.status) && (
          <Link
            to={`/track-order/${order.id}`}
            className="flex-1 sm:flex-none text-center sm:text-left
                       text-sm font-semibold text-white bg-[var(--brand-primary)]
                       px-4 py-2 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            Track Order
          </Link>
        )}
      </div>
    </article>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const MyOrders = () => {
  const { user } = useAuth();
  const syncKey = useOrderSync();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search,    setSearch]    = useState('');
  const [sort,      setSort]      = useState<SortOption>('newest');
  const allOrders = useMemo(() => { void syncKey; return user ? getOrdersByUserId(user.id) : []; }, [user, syncKey]);

  const filtered = useMemo(() => {
    let list = [...allOrders];

    // Status filter
    if (activeTab !== 'all') {
      list = list.filter((o) => o.status === activeTab);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest': return b.total - a.total;
        case 'lowest':  return a.total - b.total;
        default:        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [allOrders, activeTab, search, sort]);

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] py-8 sm:py-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="container max-w-4xl mx-auto px-6">
        {/* Heading */}
        <div className="mb-7">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-[#292D28]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            My Orders
          </h1>
          <p className="text-sm text-[#73786F] mt-1">
            Track your purchases and stay updated on your Dosti deliveries.
          </p>
        </div>

        {allOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E4D9] py-4">
            <EmptyState
              icon={<ShoppingBag size={40} strokeWidth={1.5} />}
              title="No orders yet"
              description="You haven't placed any orders. Start shopping to see your orders here."
              action={
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                             text-sm font-semibold px-6 py-3 rounded-xl
                             hover:bg-[var(--brand-dark)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]"
                >
                  Browse Products
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Status filter tabs */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 mb-5 -mx-1 px-1"
                 role="tablist">
              {TABS.map(({ id, label }) => {
                const count = id === 'all'
                  ? allOrders.length
                  : allOrders.filter((o) => o.status === id).length;
                if (id !== 'all' && count === 0) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                    className={[
                      'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm',
                      'font-medium transition-all duration-150 whitespace-nowrap',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                      activeTab === id
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-white border border-[#E8E4D9] text-[#73786F] hover:text-[#292D28]',
                    ].join(' ')}
                  >
                    {label}
                    <span className={[
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                      activeTab === id ? 'bg-white/20 text-white' : 'bg-[#E8E4D9] text-[#73786F]',
                    ].join(' ')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + sort row */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                              text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order ID or product name…"
                  aria-label="Search orders"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E8E4D9]
                             rounded-xl text-sm text-[#292D28] placeholder:text-[#73786F]/60
                             focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2
                             focus:ring-[var(--brand-primary)]/10 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F]
                               hover:text-[#292D28] transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative">
                <ArrowUpDown size={13} className="absolute left-3 top-1/2 -translate-y-1/2
                                                   text-[#73786F] pointer-events-none" aria-hidden="true" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="Sort orders"
                  className="pl-8 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl
                             text-sm text-[#292D28] appearance-none cursor-pointer
                             focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2
                             focus:ring-[var(--brand-primary)]/10 transition-all"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result count */}
            <p className="text-xs text-[#73786F] mb-4">
              Showing <strong className="text-[#292D28]">{filtered.length}</strong> of{' '}
              <strong className="text-[#292D28]">{allOrders.length}</strong> orders
            </p>

            {/* Order list */}
            {filtered.length === 0 ? (
              <EmptyState
                title="No orders match your filters"
                description="Try adjusting your search or filter to find your orders."
                action={
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setActiveTab('all'); }}
                    className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                               text-sm font-semibold px-5 py-2.5 rounded-xl
                               hover:bg-[var(--brand-dark)] transition-colors
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[var(--brand-accent)]"
                  >
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
