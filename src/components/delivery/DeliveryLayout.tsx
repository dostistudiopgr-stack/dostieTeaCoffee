import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Package, History, LogOut, Leaf,
  Menu, X,
} from 'lucide-react';
import { getCurrentDeliveryBoy, deliveryLogout } from '../../utils/deliveryStore';

const NAV_ITEMS = [
  { to: '/delivery/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/delivery/orders',        icon: <Package size={18} />,        label: 'My Orders' },
  { to: '/delivery/history',      icon: <History size={18} />,         label: 'History' },
];

export default function DeliveryLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const boy = getCurrentDeliveryBoy();


  const handleLogout = () => {
    deliveryLogout();
    navigate('/delivery/login');
  };

  if (!boy) return null;

  const initials = boy.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <div className="min-h-screen bg-[var(--brand-background)] flex" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex flex-col w-16 lg:w-56 bg-[var(--brand-dark)] shrink-0 h-screen sticky top-0">
        <div className="h-[60px] flex items-center justify-center lg:justify-between px-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center shrink-0">
            <Leaf size={18} className="text-[var(--brand-dark)]" />
          </div>
          <div className="hidden lg:block ml-2 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Dosti Delivery</p>
            <p className="text-[10px] text-white/45 uppercase tracking-widest">Portal</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 lg:px-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link key={to} to={to}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                    isActive(to) ? 'bg-[var(--brand-primary)] text-white font-semibold' : 'text-[#D4DDCF] hover:bg-white/8 hover:text-white',
                    'justify-center lg:justify-start',
                  ].join(' ')}>
              {icon}<span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 p-2 lg:p-3">
          <div className="hidden lg:flex items-center gap-2.5 px-2 py-2 mb-1.5">
            <div className="w-9 h-9 rounded-full bg-[var(--brand-accent)]/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[var(--brand-accent)]">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{boy.name}</p>
              <p className="text-[10px] text-[#D4DDCF] truncate">{boy.phone}</p>
            </div>
          </div>
          <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#D4DDCF]
                             hover:bg-white/10 hover:text-white transition-colors text-sm justify-center lg:justify-start
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <LogOut size={18} /><span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sm:hidden h-14 bg-[var(--brand-dark)] flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center">
              <Leaf size={16} className="text-[var(--brand-dark)]" />
            </div>
            <span className="text-sm font-semibold text-white">Delivery</span>
          </div>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu"
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
            <Menu size={20} />
          </button>
        </header>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute top-0 left-0 w-64 h-full bg-[var(--brand-dark)] flex flex-col">
              <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
                {NAV_ITEMS.map(({ to, icon, label }) => (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${isActive(to) ? 'bg-[var(--brand-primary)] text-white font-semibold' : 'text-[#D4DDCF] hover:bg-white/8'}`}>
                    {icon}{label}
                  </Link>
                ))}
                <button onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-[#D4DDCF] hover:bg-white/10 text-sm mt-2">
                  <LogOut size={18} />Sign Out
                </button>
              </nav>
              <div className="border-t border-white/10 p-3">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <div className="w-9 h-9 rounded-full bg-[var(--brand-accent)]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--brand-accent)]">{initials}</span>
                  </div>
                  <div><p className="text-xs font-semibold text-white truncate">{boy.name}</p><p className="text-[10px] text-[#D4DDCF]">{boy.phone}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
