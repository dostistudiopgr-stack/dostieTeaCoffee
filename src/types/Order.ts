import type { CartItem } from './Cart';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderSource = 'website' | 'phone_order' | 'walk_in_sale';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface OrderTimeline {
  status:     OrderStatus;
  timestamp:  string;       // ISO date string
  note?:      string;
  updatedBy?: string;       // human-readable name
  actorId?:   string;       // delivery boy id or admin id
  actorRole?: 'admin' | 'delivery' | 'customer' | 'system';
}

export interface DeliveryAssignment {
  deliveryBoyId: string;
  deliveryBoyName: string;
  assignedAt: string;
  assignedBy: string;
  unassignedAt?: string;
}

export interface PaymentMethodChange {
  fromMethod:    string;
  toMethod:      string;
  changedBy:     string;
  changedById?:  string;
  changedAt:     string;  // ISO
  reason?:       string;
  actorRole:     'admin' | 'delivery';
}

export interface CashCollectionRecord {
  confirmedBy:       string;  // delivery boy name
  confirmedById:     string;  // delivery boy id
  confirmedAt:       string;  // ISO
  amount:           number;
  paymentMethodAtCollection: string;  // method at time of collection
  note?:            string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  tax: number;
  total: number;
  couponCode?: string;
  timeline: OrderTimeline[];
  trackingNumber?: string;
  estimatedDelivery?: string;  // ISO date string
  createdAt: string;
  updatedAt: string;
  // Delivery boy assignment (added by admin)
  deliveryBoyId?:   string;
  deliveryBoyName?: string;
  assignedAt?:      string;
  assignedBy?:      string;
  // COD payment collection
  codCollectedAt?:  string;  // ISO — when delivery boy physically collected cash
  codVerifiedBy?:   string;  // admin name who confirmed receipt
  codVerifiedAt?:   string;  // ISO — when admin marked COD as paid
  // Payment method change & cash collection workflow
  paymentMethodHistory?:    PaymentMethodChange[];
  cashCollection?:           CashCollectionRecord;
  cashCollectionVerifiedBy?: string;
  cashCollectionVerifiedAt?: string;
  // Order source
  orderSource?:     OrderSource;
  isWalkIn?:        boolean;
  // Admin-created phone/walk-in sale extras
  adminCustomerName?:  string;
  adminCustomerPhone?: string;
  adminCustomerEmail?: string;
  adminNotes?:         string;
  assignmentHistory?: DeliveryAssignment[];
}
