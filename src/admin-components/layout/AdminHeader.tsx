import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, ChevronRight, Settings } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { getAllOrders }  from '../../data/orders';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

// ─── Breadcrumb config ────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  '/admin/dashboard':  'Dashboard',
  '/admin/products':   'Products',
  '/admin/products/add': 'Add Product',
  '/admin/categories': 'Categories',
  '/admin/inventory':  'Inventory',
  '/admin/orders':     'Orders',
  '/admin/customers':  'Customers',
  '/admin/reports':    'Reports',
  '/admin/settings':   'Settings',
};

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to: string }[] = [];
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = ROUTE_LABELS[path] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, to: path });
  }
  return crumbs;
}

// ─── Mock notifications ───────────────────────────────────────────────────────

function useNotifications() {
  useLocalDataRevision();
  const orders        = getAllOrders();
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStock      = getAllProducts().filter((p) =>
    p.isActive && p.variants.some((v) => v.stock > 0 && v.stock <= 10)
  ).length;

  const items = [
    ...(pendingOrders > 0 ? [{
      id: 'notif-pending',
      type: 'order' as const,
      message: `${pendingOrders} pending order${pendingOrders !== 1 ? 's' : ''} awaiting confirmation`,
      to: '/admin/orders',
    }] : []),
    ...(lowStock > 0 ? [{
      id: 'notif-stock',
      type: 'stock' as const,
      message: `${lowStock} product${lowStock !== 1 ? 's' : ''} running low on stock`,
      to: '/admin/inventory',
    }] : []),
  ];

  return { items, count: Math.min(pendingOrders + lowStock, 9) };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminHeaderProps {
  onMenuClick: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const { admin, logout }        = useAdminAuth();
  const navigate                 = useNavigate();
  const location                 = useLocation();
  const crumbs                   = useBreadcrumbs(location.pathname);
  const { items: notifs, count } = useNotifications();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const initials = admin?.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() ?? 'A';

  return (
    <header
      className="shrink-0 bg-white border-b border-[#E8E4D9]
                 flex items-center gap-3 px-4 sm:px-6 h-[60px]
                 sticky top-0 z-30"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="lg:hidden p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                   hover:text-[#292D28] transition-colors shrink-0
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[var(--brand-accent)]"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Breadcrumb / page title */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((crumb, idx) => (
          <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
            {idx < crumbs.length - 1 ? (
              <>
                <Link
                  to={crumb.to}
                  className="text-xs text-[#73786F] hover:text-[var(--brand-primary)] transition-colors
                             truncate focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)] rounded"
                >
                  {crumb.label}
                </Link>
                <ChevronRight size={12} className="text-[#E8E4D9] shrink-0" aria-hidden="true" />
              </>
            ) : (
              <span className="text-sm font-semibold text-[#292D28] truncate">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            aria-label={`${count} notifications`}
            aria-expanded={notifOpen}
            className="relative p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                       hover:text-[#292D28] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <Bell size={19} aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                               bg-red-500 text-white text-[9px] font-bold
                               flex items-center justify-center" aria-hidden="true">
                {count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl
                            border border-[#E8E4D9] shadow-lg py-2 z-50
                            animate-[slideUp_150ms_ease]">
              <p className="text-xs font-bold uppercase tracking-wide text-[#73786F]
                             px-4 py-2 border-b border-[#E8E4D9]">
                Notifications
              </p>
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  to={n.to}
                  onClick={() => setNotifOpen(false)}
                  className="flex items-start gap-2.5 px-4 py-3 hover:bg-[var(--brand-background)]
                             transition-colors text-sm text-[#292D28]
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
                >
                  <span className={[
                    'w-2 h-2 rounded-full shrink-0 mt-1.5',
                    n.type === 'order' ? 'bg-amber-400'
                    : n.type === 'stock' ? 'bg-red-400'
                    : 'bg-blue-400',
                  ].join(' ')} aria-hidden="true" />
                  {n.message}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            aria-expanded={profileOpen}
            aria-label="Admin profile menu"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                       hover:bg-[var(--brand-background)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-[#292D28] max-w-[120px] truncate">
              {admin?.name ?? 'Admin'}
            </span>
            <ChevronDown
              size={14}
              className={`text-[#73786F] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl
                            border border-[#E8E4D9] shadow-lg py-1.5 z-50
                            animate-[slideUp_150ms_ease]">
              <div className="px-4 py-2.5 border-b border-[#E8E4D9]">
                <p className="text-sm font-medium text-[#292D28] truncate">{admin?.name}</p>
                <p className="text-xs text-[#73786F] truncate">{admin?.email}</p>
              </div>
              <Link
                to="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#292D28]
                           hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
              >
                <User size={16} aria-hidden="true" />
                Admin Profile
              </Link>
              <Link
                to="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#292D28]
                           hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
              >
                <Settings size={16} aria-hidden="true" />
                Settings
              </Link>
              <div className="border-t border-[#E8E4D9] my-1" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                           text-red-600 hover:bg-red-50 transition-colors
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
