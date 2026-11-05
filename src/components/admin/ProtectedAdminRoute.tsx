import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Spinner }      from '../common/Loader';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location                       = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-background)]">
        <Spinner size="lg" label="Verifying admin session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/admin/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
