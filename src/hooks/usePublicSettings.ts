import { useAdminSettings } from './useAdminSettings';

/** Expose only business values needed by customer and delivery workflows. */
export function usePublicSettings() {
  const settings = useAdminSettings();
  return {
    store: settings.store,
    branding: settings.branding,
    delivery: settings.delivery,
    payment: settings.payment,
    business: {
      minimumOrderAmount: settings.business.minimumOrderAmount,
      allowCOD: settings.business.allowCOD,
      allowOnlinePayment: settings.business.allowOnlinePayment,
      allowUpiQr: settings.business.allowUpiQr,
      maintenanceMode: settings.business.maintenanceMode,
    },
  };
}
