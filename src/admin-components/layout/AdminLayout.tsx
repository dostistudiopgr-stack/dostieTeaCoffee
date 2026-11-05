import { useState, useEffect } from 'react';
import { Outlet }   from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader  from './AdminHeader';

/**
 * AdminLayout — wraps all protected admin pages.
 * Sidebar is fixed 100vh, header + content scroll independently.
 */
const AdminLayout = () => {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div
      className="flex h-screen bg-[var(--brand-background)] overflow-hidden"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main column — scrolls independently */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />

        {/* Page content — consistent 24px padding */}
        <main
          id="admin-main"
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
