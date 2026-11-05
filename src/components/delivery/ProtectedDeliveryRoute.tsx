import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentDeliveryBoy } from '../../utils/deliveryStore';

const ProtectedDeliveryRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const deliveryBoy = getCurrentDeliveryBoy();

  if (!deliveryBoy) {
    return (
      <Navigate
        to={`/delivery/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (!deliveryBoy.isActive) {
    return <Navigate to="/delivery/login?reason=inactive" replace />;
  }

  return <>{children}</>;
};

export default ProtectedDeliveryRoute;
