import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Where to redirect unauthenticated users (default: /login) */
  redirectTo?: string;
}

/**
 * Wraps routes that require authentication.
 * Preserves the intended destination via `?from=` so Login can redirect back.
 */
const ProtectedRoute = ({ children, redirectTo = '/login' }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location                       = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Checking authentication…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${redirectTo}?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user?.role !== 'customer') return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
