import {
  DELIVERY_CONFIG,
  TAX_CONFIG,
  CUSTOMER_COUPONS,
  STORAGE_KEYS,
  ORDER_ID_PREFIX,
  type CouponDefinition,
} from './constants';
import type { CartItem, CartSummary } from '../types/Cart';
import type { Order, OrderStatus, ShippingAddress, PaymentMethodChange, CashCollectionRecord } from '../types/Order';
import { adjustVariantStock, getAllProducts } from './productStore';
import { createId, readJson, writeJson } from './storage';

// ─── Cart calculation ─────────────────────────────────────────────────────────

export function calcCartSummary(
  items: CartItem[],
  discountAmount: number,
  freeThreshold?: number,
  deliveryCharge?: number,
): CartSummary {
  const threshold = freeThreshold ?? DELIVERY_CONFIG.FREE_DELIVERY_THRESHOLD;
  const charge    = deliveryCharge ?? DELIVERY_CONFIG.STANDARD_DELIVERY_CHARGE;
  const subtotal  = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discount  = Math.min(discountAmount, subtotal);
  const taxable   = subtotal - discount;
  const shipping  = threshold > 0 && taxable >= threshold ? 0 : charge;
  const tax       = Math.round(taxable * TAX_CONFIG.RATE);
  const total     = taxable + shipping + tax;
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  return { subtotal, discount, shipping, tax, total, itemCount };
}

// ─── Coupon validation ────────────────────────────────────────────────────────

export interface CouponResult {
  valid:    boolean;
  coupon?:  CouponDefinition;
  discount: number;
  message:  string;
}

export function validateCoupon(code: string, subtotal: number): CouponResult {
  const upper = code.trim().toUpperCase();
  const found = CUSTOMER_COUPONS.find((c) => c.code === upper);
  if (!found) return { valid: false, discount: 0, message: `Coupon "${upper}" is not valid.` };
  if (subtotal < found.minOrderAmount)
    return { valid: false, discount: 0, message: `Minimum order of ₹${found.minOrderAmount} required for ${found.code}.` };
  const discount = found.type === 'percentage'
    ? Math.round((found.value / 100) * subtotal) : found.value;
  return { valid: true, coupon: found, discount, message: `${found.description} — ₹${discount} saved!` };
}

// ─── Order ID generation ──────────────────────────────────────────────────────

export function generateOrderId(): string {
  const year = new Date().getFullYear();
  return `${ORDER_ID_PREFIX}-${year}-${createId('order').replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`;
}

// ─── localStorage order persistence ──────────────────────────────────────────

export function loadOrdersFromStorage(): Order[] {
  return readJson<Order[]>(STORAGE_KEYS.ORDERS, [], (value): value is Order[] =>
    Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof item.id === 'string')
  );
}

export function saveOrderToStorage(order: Order): void {
  const existing = loadOrdersFromStorage();
  const updated  = [order, ...existing.filter((o) => o.id !== order.id)];
  writeJson(STORAGE_KEYS.ORDERS, updated);
  notifyOrderChange();
}

const ORDER_CHANGE_EVENT = 'dtc:orders-changed';

function notifyOrderChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ORDER_CHANGE_EVENT));
}

/**
 * Update an existing order in localStorage (e.g. status change, cancellation).
 * If the order was from seed data it gets written to localStorage so the
 * change persists without touching the seed array.
 */
export function updateOrderInStorage(updatedOrder: Order): void {
  const existing  = loadOrdersFromStorage();
  const inStorage = existing.some((o) => o.id === updatedOrder.id);
  if (inStorage) {
    const next = existing.map((o) => o.id === updatedOrder.id ? updatedOrder : o);
    writeJson(STORAGE_KEYS.ORDERS, next);
  } else {
    // Order came from seed data — add it to localStorage with the change
    saveOrderToStorage(updatedOrder);
  }
  if (updatedOrder.status === 'cancelled') applyOrderInventory(updatedOrder, 'restore');
  notifyOrderChange();
}

const INVENTORY_EFFECTS_KEY = STORAGE_KEYS.ORDER_INVENTORY_EFFECTS;

function loadInventoryEffects(): string[] {
  return readJson<string[]>(INVENTORY_EFFECTS_KEY, [], (value): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

export function applyOrderInventory(order: Order, direction: 'deduct' | 'restore'): boolean {
  const effects = loadInventoryEffects();
  const effectId = `${order.id}:${direction}`;
  if (effects.includes(effectId)) return true;
  if (direction === 'restore' && !effects.includes(`${order.id}:deduct`)) return true;

  const quantities = new Map<string, number>();
  order.items.forEach((item) => {
    const key = `${item.productId}:${item.variantId}`;
    quantities.set(key, (quantities.get(key) ?? 0) + item.quantity);
  });
  const currentProducts = getAllProducts();
  const rows = [...quantities.entries()].map(([key, quantity]) => {
    const [productId, variantId] = key.split(':');
    const product = currentProducts.find((entry) => entry.id === productId);
    const variant = product?.variants.find((entry) => entry.id === variantId);
    return { product, variant, quantity };
  });
  if (rows.some(({ product, variant, quantity }) => !product || !variant || (direction === 'deduct' && variant.stock < quantity))) return false;

  for (const { product, variant, quantity } of rows) {
    if (!product || !variant) return false;
    adjustVariantStock({
      productId: product.id, variantId: variant.id, productName: product.name,
      variantLabel: variant.label, sku: variant.sku,
      adjustmentType: direction === 'deduct' ? 'stock-out' : 'stock-in', quantity,
      reason: direction === 'restore' ? 'Cancelled order' : order.orderSource === 'walk_in_sale'
        ? 'Walk-in sale' : order.orderSource === 'phone_order' ? 'Phone order' : 'Website order',
      notes: order.orderNumber,
    });
  }
  effects.push(effectId);
  writeJson(INVENTORY_EFFECTS_KEY, effects);
  return true;
}

/** Change the order status from the latest shared snapshot with transition validation. */
export function transitionOrderStatus(
  order: Order,
  nextStatus: OrderStatus,
  updatedBy: string,
  note?: string,
): Order | null {
  const latest = loadOrdersFromStorage().find((item) => item.id === order.id) ?? order;
  if (latest.orderSource === 'walk_in_sale') return null;
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['packed', 'shipped', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['out-for-delivery'],
    'out-for-delivery': ['delivered'],
    delivered: ['returned'],
    cancelled: [],
    returned: [],
  };
  if (!allowed[latest.status].includes(nextStatus)) return null;
  const now = new Date().toISOString();
  const updated: Order = {
    ...latest,
    status: nextStatus,
    updatedAt: now,
    timeline: [...latest.timeline, { status: nextStatus, timestamp: now, updatedBy, note }],
  };
  // Delivery completion never confirms COD collection.
  // Returned goods stay deducted until staff inspect them and record a manual stock adjustment.
  updateOrderInStorage(updated);
  return updated;
}

// ─── Delivery-boy-specific transition ────────────────────────────────────────

export interface DeliveryTransitionResult {
  ok:     boolean;
  order?:  Order;
  error?:  string;
}

/**
 * Ownership-checked status transition for delivery boys.
 *
 * Allowed transitions:
 *   packed          → out-for-delivery  (skip "shipped" — admin already packed & handed over)
 *   shipped         → out-for-delivery  (legacy / manual shipped state)
 *   out-for-delivery → delivered
 *
 * Returns { ok: true, order } on success, or { ok: false, error } on failure.
 * Never touches walk-in sales, never changes payment status.
 */
export function deliveryBoyTransitionOrder(
  orderId: string,
  deliveryBoyId: string,
  deliveryBoyName: string,
  nextStatus: 'out-for-delivery' | 'delivered',
  note?: string,
): DeliveryTransitionResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.orderSource === 'walk_in_sale') return { ok: false, error: 'Walk-in sales do not have a delivery workflow.' };

  // Ownership check — hard fail, not a soft warning
  if (latest.deliveryBoyId !== deliveryBoyId) {
    return { ok: false, error: 'This order is not assigned to you.' };
  }

  // Transition rules for delivery boys only
  const DELIVERY_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending:            [],
    confirmed:          [],
    processing:         [],
    packed:             ['out-for-delivery'],
    shipped:            ['out-for-delivery'],
    'out-for-delivery': ['delivered'],
    delivered:          [],
    cancelled:          [],
    returned:           [],
  };

  if (!DELIVERY_TRANSITIONS[latest.status].includes(nextStatus)) {
    return {
      ok:    false,
      error: `Cannot transition from "${latest.status}" to "${nextStatus}". Current status may have changed — please refresh.`,
    };
  }

  const now = new Date().toISOString();

  const timelineNote = note?.trim() ||
    (nextStatus === 'out-for-delivery'
      ? `Picked up and out for delivery by ${deliveryBoyName}.`
      : `Delivered by ${deliveryBoyName}.`);

  const updated: Order = {
    ...latest,
    status:    nextStatus,
    updatedAt: now,
    ...(nextStatus === 'delivered' && latest.paymentMethod === 'Cash on Delivery'
      ? { codCollectedAt: now }
      : {}),
    timeline: [
      ...latest.timeline,
      {
        status:    nextStatus,
        timestamp: now,
        updatedBy: deliveryBoyName,
        actorId:   deliveryBoyId,
        actorRole: 'delivery' as const,
        note:      timelineNote,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

// ─── Admin COD verification ───────────────────────────────────────────────────

export interface CodVerifyResult {
  ok:     boolean;
  order?:  Order;
  error?:  string;
}

/**
 * Admin explicitly confirms that COD cash has been received and handed over.
 * Sets paymentStatus → 'paid', records adminName and timestamp.
 * Cannot be called for non-COD orders or already-paid orders.
 */
export function adminVerifyCodPayment(
  orderId: string,
  adminName: string,
  adminId: string,
  note?: string,
): CodVerifyResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.paymentMethod !== 'Cash on Delivery') {
    return { ok: false, error: 'This order is not a Cash on Delivery order.' };
  }
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Payment is already marked as paid.' };
  }
  if (latest.status !== 'delivered') {
    return { ok: false, error: 'Order must be delivered before verifying COD payment.' };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...latest,
    paymentStatus:  'paid',
    codVerifiedBy:  adminName,
    codVerifiedAt:  now,
    updatedAt:      now,
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: adminName,
        actorId:   adminId,
        actorRole: 'admin' as const,
        note:      `COD payment of ₹${latest.total.toLocaleString('en-IN')} verified and collected.${note ? ' ' + note : ''}`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

// ─── Payment method change (admin) ──────────────────────────────────────────

export interface PaymentChangeResult {
  ok:     boolean;
  order?: Order;
  error?: string;
}

const CASH_METHODS = ['Cash on Delivery', 'Cash'];

/**
 * Admin changes the payment method on a pending order.
 * Records the full audit trail. Does NOT mark as paid.
 * Cannot change already-paid orders (use refund workflow instead).
 */
export function adminChangePaymentMethod(
  orderId: string,
  adminName: string,
  adminId: string,
  newMethod: string,
  reason?: string,
): PaymentChangeResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Cannot change payment method on an already-paid order. Process a refund first.' };
  }
  if (latest.paymentMethod === newMethod) {
    return { ok: false, error: 'New payment method is the same as the current one.' };
  }

  const now = new Date().toISOString();
  const change: PaymentMethodChange = {
    fromMethod: latest.paymentMethod,
    toMethod:   newMethod,
    changedBy:  adminName,
    changedById: adminId,
    changedAt:   now,
    reason:      reason?.trim() || undefined,
    actorRole:   'admin' as const,
  };

  const updated: Order = {
    ...latest,
    paymentMethod:  newMethod,
    updatedAt:      now,
    paymentMethodHistory: [...(latest.paymentMethodHistory ?? []), change],
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: adminName,
        actorId:   adminId,
        actorRole: 'admin' as const,
        note:      `Payment method changed from ${change.fromMethod} to ${newMethod}.${reason ? ' Reason: ' + reason.trim() : ''}`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

// ─── Delivery Boy cash collection request ────────────────────────────────────

/**
 * Delivery Boy requests changing payment method to Cash (fallback from UPI/Online).
 * Records the request with delivery boy details. Does NOT mark as paid.
 * Ownership-checked — delivery boy can only change their own assigned orders.
 */
export function deliveryBoyRequestCashCollection(
  orderId: string,
  deliveryBoyId: string,
  deliveryBoyName: string,
  reason: string,
): PaymentChangeResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.deliveryBoyId !== deliveryBoyId) {
    return { ok: false, error: 'This order is not assigned to you.' };
  }
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Payment is already marked as paid.' };
  }

  const now = new Date().toISOString();
  const newMethod = 'Cash on Delivery';
  const change: PaymentMethodChange = {
    fromMethod: latest.paymentMethod,
    toMethod:   newMethod,
    changedBy:   deliveryBoyName,
    changedById: deliveryBoyId,
    changedAt:   now,
    reason:      reason.trim() || `Customer could not complete ${latest.paymentMethod}. Cash collection requested by delivery boy.`,
    actorRole:   'delivery' as const,
  };

  const updated: Order = {
    ...latest,
    paymentMethod:  newMethod,
    updatedAt:       now,
    paymentMethodHistory: [...(latest.paymentMethodHistory ?? []), change],
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: deliveryBoyName,
        actorId:   deliveryBoyId,
        actorRole: 'delivery' as const,
        note:      `Payment method changed to Cash on Delivery. Reason: ${reason.trim()}`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

// ─── Delivery Boy confirms cash collected ────────────────────────────────────

/**
 * Delivery Boy confirms they physically collected cash from the customer.
 * Records the collection details but does NOT mark payment as paid.
 * Admin must verify separately. Prevents duplicate collection records.
 */
export function deliveryBoyConfirmCashCollected(
  orderId: string,
  deliveryBoyId: string,
  deliveryBoyName: string,
  note?: string,
): PaymentChangeResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.deliveryBoyId !== deliveryBoyId) {
    return { ok: false, error: 'This order is not assigned to you.' };
  }
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Payment is already marked as paid.' };
  }
  if (latest.cashCollection) {
    return { ok: false, error: 'Cash collection has already been confirmed for this order.' };
  }
  if (!CASH_METHODS.includes(latest.paymentMethod)) {
    return { ok: false, error: 'Cash collection can only be confirmed for cash/COD orders.' };
  }

  const now = new Date().toISOString();
  const collection: CashCollectionRecord = {
    confirmedBy:               deliveryBoyName,
    confirmedById:             deliveryBoyId,
    confirmedAt:               now,
    amount:                    latest.total,
    paymentMethodAtCollection: latest.paymentMethod,
    note:                      note?.trim() || undefined,
  };

  const updated: Order = {
    ...latest,
    codCollectedAt:  now,  // keep backward compat with existing COD flow
    cashCollection:   collection,
    updatedAt:        now,
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: deliveryBoyName,
        actorId:   deliveryBoyId,
        actorRole: 'delivery' as const,
        note:      `Cash collected: ₹${latest.total.toLocaleString('en-IN')}. Awaiting admin verification.${note ? ' ' + note.trim() : ''}`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

// ─── Admin verifies cash collection (generalized) ────────────────────────────

/**
 * Admin verifies that cash was collected and marks payment as paid.
 * Works for both COD and delivery-boy-requested cash collection.
 * Records who verified and when. Cannot be called on already-paid orders.
 */
export function adminVerifyCashPayment(
  orderId: string,
  adminName: string,
  adminId: string,
  note?: string,
): PaymentChangeResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Payment is already marked as paid.' };
  }
  if (!CASH_METHODS.includes(latest.paymentMethod)) {
    return { ok: false, error: 'Can only verify cash/COD payments.' };
  }
  // Allow verification for delivered orders, or walk-in sales (no delivery needed)
  if (latest.orderSource !== 'walk_in_sale' && latest.status !== 'delivered') {
    return { ok: false, error: 'Order must be delivered before verifying cash payment.' };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...latest,
    paymentStatus:            'paid',
    codVerifiedBy:            adminName,  // backward compat
    codVerifiedAt:            now,
    cashCollectionVerifiedBy: adminName,
    cashCollectionVerifiedAt: now,
    updatedAt:                now,
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: adminName,
        actorId:   adminId,
        actorRole: 'admin' as const,
        note:      `Cash payment of ₹${latest.total.toLocaleString('en-IN')} verified and marked as paid.${note ? ' ' + note : ''}`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

/**
 * Admin rejects a delivery boy's cash collection claim (e.g. amount mismatch).
 * Clears the collection record. Payment stays pending.
 */
export function adminRejectCashCollection(
  orderId: string,
  adminName: string,
  adminId: string,
  reason: string,
): PaymentChangeResult {
  const latest = loadOrdersFromStorage().find((o) => o.id === orderId);
  if (!latest) return { ok: false, error: 'Order not found.' };
  if (latest.paymentStatus === 'paid') {
    return { ok: false, error: 'Cannot reject collection on an already-paid order.' };
  }
  if (!latest.cashCollection) {
    return { ok: false, error: 'No cash collection to reject.' };
  }

  const now = new Date().toISOString();
  const updated: Order = {
    ...latest,
    cashCollection:  undefined,
    codCollectedAt:  undefined,  // clear backward compat too
    updatedAt:       now,
    timeline: [
      ...latest.timeline,
      {
        status:    latest.status,
        timestamp: now,
        updatedBy: adminName,
        actorId:   adminId,
        actorRole: 'admin' as const,
        note:      `Cash collection rejected by admin. Reason: ${reason}. Payment remains pending.`,
      },
    ],
  };

  updateOrderInStorage(updated);
  return { ok: true, order: updated };
}

export function cancelOrder(order: Order): Order | null {
  const latest = loadOrdersFromStorage().find((item) => item.id === order.id) ?? order;
  if (!['pending', 'confirmed'].includes(latest.status)) return null;
  const now = new Date().toISOString();
  const cancelled: Order = {
    ...latest,
    status:    'cancelled',
    updatedAt: now,
    timeline:  [
      ...order.timeline,
      { status: 'cancelled' as OrderStatus, timestamp: now, note: 'Order cancelled by customer.' },
    ],
  };
  updateOrderInStorage(cancelled);
  return cancelled;
}

// ─── Create a new order ───────────────────────────────────────────────────────

export interface CreateOrderPayload {
  userId:          string;
  items:           CartItem[];
  shippingAddress: ShippingAddress;
  subtotal:        number;
  discount:        number;
  shippingCharge:  number;
  tax:             number;
  total:           number;
  couponCode?:     string;
  paymentMethod:   string;
}

export function createOrder(payload: CreateOrderPayload): Order {
  const now = new Date().toISOString();
  const id  = generateOrderId();
  const products = getAllProducts();
  const requested = new Map<string, number>();
  payload.items.forEach((item) => {
    const key = `${item.productId}:${item.variantId}`;
    requested.set(key, (requested.get(key) ?? 0) + item.quantity);
  });
  for (const [key, quantity] of requested) {
    const [productId, variantId] = key.split(':');
    const product = products.find((entry) => entry.id === productId);
    const variant = product?.variants.find((entry) => entry.id === variantId);
    if (!variant || variant.stock < quantity) throw new Error(`Not enough stock for ${product?.name ?? 'a selected item'} (${variant?.label ?? 'variant'}).`);
  }
  const order: Order = {
    id, orderNumber: id,
    userId:         payload.userId,
    items: payload.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      return { ...item, purchaseCostSnapshot: variant?.purchaseCost };
    }),
    shippingAddress: payload.shippingAddress,
    status:         'pending',
    paymentStatus:  'pending',
    paymentMethod:  payload.paymentMethod,
    subtotal:       payload.subtotal,
    discount:       payload.discount,
    shippingCharge: payload.shippingCharge,
    tax:            payload.tax,
    total:          payload.total,
    couponCode:     payload.couponCode,
    timeline: [{ status: 'pending', timestamp: now, note: 'Order placed successfully.' }],
    createdAt: now, updatedAt: now,
  };
  if (!applyOrderInventory(order, 'deduct')) throw new Error('Stock changed before this order could be placed. Please review your cart.');
  saveOrderToStorage(order);
  return order;
}

// ─── Address helpers ──────────────────────────────────────────────────────────

export function loadSavedAddress(): ShippingAddress | null {
  return readJson<ShippingAddress | null>(STORAGE_KEYS.ADDRESS, null, (value): value is ShippingAddress =>
    !!value && typeof value === 'object' && 'fullName' in value && 'addressLine1' in value
  );
}

export function saveAddress(address: ShippingAddress): void {
  writeJson(STORAGE_KEYS.ADDRESS, address);
}

// ─── Eligibility helpers ──────────────────────────────────────────────────────

export const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed'];
export const isCancellable = (status: OrderStatus) => CANCELLABLE_STATUSES.includes(status);
