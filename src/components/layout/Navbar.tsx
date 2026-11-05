import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
} from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Menu, X,
  Leaf, ChevronDown, LogOut, MapPin, Package,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useSearchOverlay } from '../../hooks/useSearchOverlay';
import { formatINR } from '../../utils/formatPrice';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home',      to: '/'                    },
  { label: 'Shop',      to: '/shop'                },
  { label: 'Tea',       to: '/category/tea'        },
  { label: 'Coffee',    to: '/category/coffee'     },
  { label: 'Green Tea', to: '/category/green-tea'  },
  { label: 'About',     to: '/about'               },
  { label: 'Contact',   to: '/contact'             },
];

// ─── NavLink class helper ─────────────────────────────────────────────────────

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative text-sm font-medium transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded px-0.5',
    'after:absolute after:bottom-[-3px] after:left-0 after:right-0',
    'after:h-[2px] after:rounded-full after:bg-[var(--brand-accent)]',
    'after:transition-transform after:duration-200 after:origin-left',
    isActive
      ? 'text-[var(--brand-primary)] after:scale-x-100'
      : 'text-[#292D28] hover:text-[var(--brand-primary)] after:scale-x-0 hover:after:scale-x-100',
  ].join(' ');

// ─── Search Overlay ───────────────────────────────────────────────────────────

interface SearchOverlayProps {
  query:        string;
  setQuery:     (v: string) => void;
  results:      ReturnType<typeof useSearchOverlay>['results'];
  onClose:      () => void;
  onSelect:     (slug: string) => void;
  inputRef:     React.RefObject<HTMLInputElement | null>;
}

const SearchOverlay = ({
  query, setQuery, results, onClose, onSelect, inputRef,
}: SearchOverlayProps) => {
  const navigate = useNavigate();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onKeyDown={handleKeyDown}
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 bg-white shadow-xl border-b border-[#E8E4D9]
                      animate-[slideUp_200ms_ease]">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          {/* Input row */}
          <form onSubmit={handleSubmit} role="search">
            <div className="flex items-center gap-3 bg-[var(--brand-background)] rounded-xl
                            border border-[#E8E4D9] px-4 py-3
                            focus-within:border-[var(--brand-primary)] focus-within:ring-2
                            focus-within:ring-[var(--brand-primary)]/10 transition-all">
              <Search size={18} className="text-[#73786F] shrink-0" aria-hidden="true" />
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teas, coffees, flavours…"
                aria-label="Search products"
                className="flex-1 bg-transparent text-sm text-[#292D28]
                           placeholder:text-[#73786F]/70 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="text-[#73786F] hover:text-[#292D28] transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Results */}
          {query.trim().length >= 1 && (
            <div className="mt-3 pb-2">
              {results.length > 0 ? (
                <ul role="listbox" aria-label="Search results">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        onClick={() => onSelect(r.slug)}
                        className="w-full flex items-center gap-3 px-3 py-2.5
                                   rounded-lg hover:bg-[var(--brand-background)] transition-colors
                                   text-left group focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden
                                        bg-[#E8E4D9] shrink-0 flex items-center justify-center">
                          <img
                            src={r.thumbnail}
                            alt={r.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#292D28] truncate
                                        group-hover:text-[var(--brand-primary)]">
                            {r.name}
                          </p>
                          <p className="text-xs text-[#73786F] capitalize">
                            {r.category.replace('-', ' ')}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-[var(--brand-primary)] shrink-0">
                          {formatINR(r.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-[#73786F] py-6">
                  No products found for &ldquo;<strong>{query}</strong>&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

interface MobileDrawerProps {
  isOpen:    boolean;
  onClose:   () => void;
  cartCount: number;
  isAuth:    boolean;
  userName?: string;
  onLogout:  () => void;
}

const MobileDrawer = ({
  isOpen, onClose, cartCount, isAuth, userName, onLogout,
}: MobileDrawerProps) => {
  const location = useLocation();
  const { store } = usePublicSettings();

  // Close drawer on route change
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <nav
        aria-label="Mobile navigation"
        aria-hidden={!isOpen}
        onKeyDown={handleKeyDown}
        className={[
          'fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw]',
          'bg-white flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-[#E8E4D9] shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <Leaf size={16} className="text-white" aria-hidden="true" />
            </div>
            <span
              className="text-sm font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {store.name}
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                       hover:text-[#292D28] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {NAV_LINKS.map(({ label, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    [
                      'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                      isActive
                        ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                        : 'text-[#292D28] hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)]',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-[#E8E4D9]" />

          {/* Cart */}
          <Link
            to="/cart"
            className="flex items-center justify-between px-4 py-2.5 rounded-lg
                       text-sm font-medium text-[#292D28] hover:bg-[var(--brand-background)]
                       hover:text-[var(--brand-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)]"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingCart size={17} aria-hidden="true" />
              Cart
            </span>
            {cartCount > 0 && (
              <span className="bg-[var(--brand-primary)] text-white text-xs font-semibold
                               px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {isAuth ? (
            <div className="mt-1 px-4 py-2.5">
              <p className="text-xs text-[#73786F] mb-2">Signed in as <strong>{userName}</strong></p>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 text-sm font-medium
                           text-[#292D28] hover:text-[var(--brand-primary)] transition-colors py-1
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)] rounded"
              >
                <User size={17} aria-hidden="true" />
                My Profile
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="mt-1 flex items-center gap-2.5 text-sm font-medium
                           text-red-600 hover:text-red-700 transition-colors py-1
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)] rounded w-full"
              >
                <LogOut size={17} aria-hidden="true" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg mt-1
                         text-sm font-medium text-[#292D28] hover:bg-[var(--brand-background)]
                         hover:text-[var(--brand-primary)] transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              <User size={17} aria-hidden="true" />
              Sign In / Register
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

// ─── Account Dropdown ─────────────────────────────────────────────────────────

interface AccountDropdownProps {
  isAuth:    boolean;
  userName?: string;
  onLogout:  () => void;
}

const AccountDropdown = ({ isAuth, userName, onLogout }: AccountDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  // Close on route change

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  // ── Logged out: show Login + Sign Up buttons ──────────────────────────────
  if (!isAuth) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm font-medium text-[#292D28]
                     px-3.5 py-2 rounded-lg hover:bg-[var(--brand-primary)]/8 hover:text-[var(--brand-primary)]
                     transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          <User size={16} aria-hidden="true" />
          Login
        </Link>
        <Link
          to="/register"
          className="text-sm font-semibold text-white bg-[var(--brand-primary)]
                     px-4 py-2 rounded-lg hover:bg-[var(--brand-dark)] transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)]"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // ── Logged in: avatar + dropdown ─────────────────────────────────────────
  const initials = (userName ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-1.5 p-1 rounded-lg
                   hover:bg-[var(--brand-primary)]/8 transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-[var(--brand-accent)]"
      >
        {/* Avatar circle with initials */}
        <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center
                        justify-center shrink-0">
          <span className="text-[11px] font-bold text-white">{initials}</span>
        </div>
        <ChevronDown
          size={13}
          className={`text-[#73786F] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl
                        shadow-lg border border-[#E8E4D9] py-1.5 z-50
                        animate-[slideUp_150ms_ease]">
          {/* User info header */}
          <div className="px-4 py-2.5 border-b border-[#E8E4D9]">
            <p className="text-xs text-[#73786F]">Signed in as</p>
            <p className="text-sm font-medium text-[#292D28] truncate">{userName}</p>
          </div>

          {/* Menu items */}
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#292D28]
                       hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
          >
            <User size={15} aria-hidden="true" />
            My Profile
          </Link>
          <Link
            to="/my-orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#292D28]
                       hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
          >
            <Package size={15} aria-hidden="true" />
            My Orders
          </Link>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#292D28]
                       hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
          >
            <MapPin size={15} aria-hidden="true" />
            My Addresses
          </Link>

          <div className="border-t border-[#E8E4D9] mt-1 pt-1">
            <button
              type="button"
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                         text-red-600 hover:bg-red-50 transition-colors
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
            >
              <LogOut size={15} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────

const Navbar = () => {
  const { store } = usePublicSettings();
  const { summary }                                 = useCart();
  const { isAuthenticated, user, logout }           = useAuth();
  const {
    isOpen: searchOpen, query, setQuery, results,
    open: openSearch, close: closeSearch,
    selectResult, inputRef,
  }                                                 = useSearchOverlay();
  const [mobileOpen, setMobileOpen]                 = useState(false);
  const [scrolled,   setScrolled]                   = useState(false);

  // Scrolled shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const cartCount = summary.itemCount;

  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-30 bg-white border-b border-[#E8E4D9]',
          'transition-shadow duration-200',
          scrolled ? 'shadow-md' : 'shadow-none',
        ].join(' ')}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ── Left: Logo ─────────────────────────────────── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)] rounded"
              aria-label={`${store.name} home`}
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)] flex items-center
                              justify-center shrink-0">
                <Leaf size={20} className="text-white" aria-hidden="true" />
              </div>
              <div className="hidden sm:block">
                <p
                  className="text-sm font-semibold text-[#292D28] leading-tight"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {store.name}
                </p>
                <p className="text-[10px] text-[#73786F] tracking-wide leading-none mt-0.5">
                  {store.tagline}
                </p>
              </div>
            </Link>

            {/* ── Center: Desktop nav ────────────────────────── */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-6 xl:gap-8"
            >
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={navLinkClass}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* ── Right: Actions ─────────────────────────────── */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Search */}
              <button
                type="button"
                onClick={openSearch}
                aria-label="Open search"
                className="p-2 rounded-lg text-[#292D28] hover:text-[var(--brand-primary)]
                           hover:bg-[var(--brand-primary)]/8 transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <Search size={20} aria-hidden="true" />
              </button>

              {/* Account — desktop only */}
              <div className="hidden sm:block">
                <AccountDropdown
                  isAuth={isAuthenticated}
                  userName={user?.name}
                  onLogout={logout}
                />
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                aria-label={`Shopping cart — ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
                className="relative p-2 rounded-lg text-[#292D28] hover:text-[var(--brand-primary)]
                           hover:bg-[var(--brand-primary)]/8 transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <ShoppingCart size={20} aria-hidden="true" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                               bg-[var(--brand-accent)] text-white text-[10px] font-bold
                               rounded-full flex items-center justify-center px-1
                               leading-none"
                    aria-hidden="true"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                className="lg:hidden p-2 rounded-lg text-[#292D28]
                           hover:bg-[var(--brand-primary)]/8 hover:text-[var(--brand-primary)]
                           transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Search Overlay ───────────────────────────────────── */}
      {searchOpen && (
        <SearchOverlay
          query={query}
          setQuery={setQuery}
          results={results}
          onClose={closeSearch}
          onSelect={selectResult}
          inputRef={inputRef}
        />
      )}

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        cartCount={cartCount}
        isAuth={isAuthenticated}
        userName={user?.name}
        onLogout={logout}
      />
    </>
  );
};

export default Navbar;
