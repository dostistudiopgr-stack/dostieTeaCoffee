import { Outlet, Link } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Navbar          from './Navbar';
import Footer          from './Footer';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { Leaf, Wrench } from 'lucide-react';

// ─── Maintenance page ─────────────────────────────────────────────────────────

const MaintenancePage = () => {
  const settings = usePublicSettings();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center
                 bg-[var(--brand-background)] px-6 text-center gap-6"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center">
        <Leaf size={32} className="text-white" aria-hidden="true" />
      </div>

      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[var(--brand-accent)]/15 flex items-center justify-center">
        <Wrench size={36} className="text-[var(--brand-accent)]" aria-hidden="true" />
      </div>

      <div>
        <h1
          className="text-3xl sm:text-4xl font-semibold text-[#292D28] mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {settings.store.name}
        </h1>
        <p
          className="text-2xl font-semibold text-[var(--brand-primary)] mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          We'll Be Right Back
        </p>
        <p className="text-[#73786F] text-base leading-relaxed max-w-md mx-auto">
          Our store is currently undergoing maintenance. We'll be back soon with
          something special. Thank you for your patience!
        </p>
        <p className="text-sm text-[var(--brand-accent)] mt-3 italic"
           style={{ fontFamily: 'var(--font-heading)' }}>
          "{settings.store.tagline}"
        </p>
      </div>

      {/* Admin access hint */}
      <div className="mt-4 text-xs text-[#73786F]">
        <Link
          to="/admin/login"
          className="text-[var(--brand-primary)] font-semibold hover:underline
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[var(--brand-accent)] rounded"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
};

// ─── Main layout ──────────────────────────────────────────────────────────────

/**
 * MainLayout — wraps all customer-facing pages.
 *
 * Structure:
 *   AnnouncementBar   (dismissible, top)
 *   Navbar            (sticky)
 *   <main>            (React Router Outlet — page content)
 *   Footer
 *
 * Maintenance mode: when admin enables maintenance mode in Settings,
 * the customer store shows a maintenance page. The admin panel (/admin/*)
 * is never blocked — admins access it directly via /admin/login.
 */
const MainLayout = () => {
  // Check maintenance mode from admin settings on every render
  const settings = usePublicSettings();

  if (settings.business?.maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--brand-background)]">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
