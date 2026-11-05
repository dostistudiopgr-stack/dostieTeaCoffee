import { useEffect, useState } from 'react';

/**
 * useOrderSync — triggers a re-render whenever the dtc_orders
 * localStorage key changes in ANY tab/window.
 *
 * Usage:
 *   const refreshKey = useOrderSync();
 *   // Include refreshKey in useMemo/useEffect dependencies.
 */
export function useOrderSync(): number {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'dtc_orders') {
        setRefreshKey((k) => k + 1);
      }
    };
    window.addEventListener('storage', handler);
    const sameTabHandler = () => setRefreshKey((k) => k + 1);
    window.addEventListener('dtc:orders-changed', sameTabHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('dtc:orders-changed', sameTabHandler);
    };
  }, []);

  return refreshKey;
}
