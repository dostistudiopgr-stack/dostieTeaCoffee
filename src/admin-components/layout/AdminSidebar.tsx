import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, BarChart2,
  ShoppingCart, Users, Settings, CircleDollarSign,
  LogOut, Leaf, X, ChevronLeft, ChevronRight,
  Layers, Bike,
} from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

// ─── Navigation data ──────────────────────────────────────────────────────────

interface NavItem {
  label:  string;
  to:     string;
  icon:   React.ReactNode;
  exact?: boolean;
}

interface NavGroup {
  heading: string;
  items:   NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Main',
    items: [
      { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, exact: true },
    ],
  },
  {
    heading: 'Catalogue',
    items: [
      { label: 'Products',   to: '/admin/products',   icon: <Package  size={18} /> },
      { label: 'Categories', to: '/admin/categories', icon: <Tag      size={18} /> },
      { label: 'Inventory',  to: '/admin/inventory',  icon: <Layers   size={18} /> },
    ],
  },
  {
    heading: 'Sales',
    items: [
      { label: 'Orders',        to: '/admin/orders',      icon: <ShoppingCart size={18} /> },
      { label: 'Create Sale',   to: '/admin/sales/new',   icon: <CircleDollarSign size={18} /> },
      { label: 'Customers',     to: '/admin/customers',   icon: <Users        size={18} /> },
      { label: 'Delivery Boys', to: '/admin/delivery-boys', icon: <Bike       size={18} /> },
    ],
  },
  {
    heading: 'Analytics',
    items: [
      { label: 'Reports', to: '/admin/reports', icon: <BarChart2 size={18} /> },
    ],
  },
  {
    heading: 'Configuration',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: <Settings size={18} /> },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  collapsed:      boolean;
  mobileOpen:     boolean;
  onToggleCollapse: () => void;
  onMobileClose:  () => void;
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

const SidebarContent = ({
  collapsed,
  onMobileClose,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}) => {
  const { logout, admin } = useAdminAuth();
  const navigate           = useNavigate();
  const location           = useLocation();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="flex flex-col h-full bg-[var(--brand-dark)]">

      {/* ── Header: logo + brand ─────────────────────────── */}
      <div className={[
        'shrink-0 border-b border-white/10 flex items-center',
        collapsed ? 'justify-center h-[60px] px-3' : 'justify-between h-[60px] px-4',
      ].join(' ')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center
                            justify-center shrink-0">
              <Leaf size={20} className="text-[var(--brand-dark)]" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-white truncate"
                 style={{ fontFamily: 'var(--font-heading)' }}>
                Dosti Tea &amp; Coffee
              </p>
              <p className="text-[10px] text-white/45 uppercase tracking-[0.15em]">
                Admin Panel
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center">
            <Leaf size={20} className="text-[var(--brand-dark)]" />
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex p-1.5 rounded-lg text-white/50 hover:text-white
                     hover:bg-white/10 transition-colors shrink-0
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white
                     hover:bg-white/10 transition-colors
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation (scrollable, fills space) ─────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1"
           aria-label="Admin navigation">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.heading} className={gIdx > 0 ? 'mt-3' : ''}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B9B85]
                            px-3 pb-2">
                {group.heading}
              </p>
            )}
            {collapsed && <div className="h-2" />}

            <div className="flex flex-col gap-0.5">
              {group.items.map(({ label, to, icon, exact }) => {
                const active = isActive(to, exact);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    onClick={onMobileClose}
                    title={collapsed ? label : undefined}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-all duration-150 text-sm whitespace-nowrap',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-[var(--brand-accent)]',
                      collapsed ? 'justify-center' : '',
                      active
                        ? 'bg-[var(--brand-primary)] text-white font-semibold'
                        : 'text-[#D4DDCF] hover:bg-white/8 hover:text-white',
                    ].join(' ')}
                  >
                    <span className="shrink-0">{icon}</span>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer: admin user + logout (pinned bottom) ─── */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed && admin && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5">
            <div className="w-9 h-9 rounded-full bg-[var(--brand-accent)]/20 flex items-center
                            justify-center shrink-0">
              <span className="text-sm font-bold text-[var(--brand-accent)]">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{admin.name}</p>
              <p className="text-[10px] text-[#D4DDCF] truncate">{admin.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
            'text-[#D4DDCF] hover:bg-white/10 hover:text-white transition-colors text-sm',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--brand-accent)]',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

const AdminSidebar = ({
  collapsed, mobileOpen, onToggleCollapse, onMobileClose,
}: AdminSidebarProps) => {
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => { onMobileClose(); }, [location.pathname]); // eslint-disable-line

  return (
    <>
      {/* Desktop sidebar — fixed height 100vh */}
      <aside
        className={[
          'hidden lg:flex flex-col shrink-0 h-screen',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        ].join(' ')}
        aria-label="Admin sidebar"
      >
        <SidebarContent
          collapsed={collapsed}
          onMobileClose={onMobileClose}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile backdrop */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <div
        className={[
          'fixed top-0 left-0 z-50 h-screen w-60 lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        role="navigation"
        aria-label="Admin mobile navigation"
      >
        <SidebarContent
          collapsed={false}
          onMobileClose={onMobileClose}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </>
  );
};

export default AdminSidebar;
