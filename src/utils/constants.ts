export { STORAGE_KEYS } from './storage';

// ─── Delivery configuration ───────────────────────────────────────────────────
// Runtime delivery calculations read the shared saved Admin Settings.

export const DELIVERY_CONFIG = {
  /** Orders at or above this amount qualify for free delivery (INR) */
  FREE_DELIVERY_THRESHOLD: 0,
  /** Standard delivery charge when below threshold (INR) */
  STANDARD_DELIVERY_CHARGE: 0,
  /** Express delivery charge (future use) */
  EXPRESS_DELIVERY_CHARGE: 0,
} as const;

// ─── Tax ─────────────────────────────────────────────────────────────────────

export const TAX_CONFIG = {
  /** GST rate applied on (subtotal − discount) */
  RATE: 0.05,
} as const;

// ─── Demo coupons ─────────────────────────────────────────────────────────────
// Coupons are configured only after real coupon records are added.

export type CouponType = 'percentage' | 'flat';

export interface CouponDefinition {
  code:             string;
  type:             CouponType;
  value:            number;    // percentage (0–100) or flat amount (INR)
  minOrderAmount:   number;    // minimum subtotal to be eligible
  description:      string;
}

export const CUSTOMER_COUPONS: CouponDefinition[] = [];


// ─── Order ID prefix ──────────────────────────────────────────────────────────

export const ORDER_ID_PREFIX = 'DTC';

// ─── Indian states list ───────────────────────────────────────────────────────

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;
