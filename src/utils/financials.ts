/**
 * financials.ts — Admin-only financial calculation helpers.
 *
 * NEVER import this file in customer-facing pages, delivery-boy screens,
 * invoices, or any component visible outside the /admin route tree.
 * purchaseCost and profit information must remain internal to the admin panel.
 */

import type { Order, OrderStatus } from '../types/Order';

// ─── Eligibility rules ────────────────────────────────────────────────────────

/**
 * Statuses whose orders count as completed sales (revenue-eligible).
 * Cancelled and returned orders are excluded.
 *
 * Rule: an order is a sale the moment the business has committed to fulfilling
 * it. We include everything from confirmed onwards, except cancelled/returned.
 * This is independent of whether payment has been collected yet.
 */
const SALE_STATUSES: Set<OrderStatus> = new Set([
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out-for-delivery',
  'delivered',
]);

/** True when the order counts as a completed / committed sale. */
export function isSaleEligible(order: Order): boolean {
  return SALE_STATUSES.has(order.status);
}

/** True when the order has genuinely received payment. */
export function isPaymentCollected(order: Order): boolean {
  return order.paymentStatus === 'paid';
}

/**
 * True when this is a COD order that has been delivered but not yet verified
 * by admin. The cash is "outstanding" — collected by the delivery boy but not
 * confirmed in the system.
 */
export function isCodOutstanding(order: Order): boolean {
  return (
    order.paymentMethod === 'Cash on Delivery' &&
    order.paymentStatus === 'pending' &&
    order.status === 'delivered'
  );
}

// ─── Per-order financial breakdown ───────────────────────────────────────────

export interface OrderFinancials {
  orderId:           string;
  sellingRevenue:    number;  // sum of item.price * item.quantity (before discount)
  discountAmount:    number;  // coupon/discount applied
  netRevenue:        number;  // sellingRevenue - discountAmount (= order.subtotal - discount portion)
  shippingRevenue:   number;  // shipping charge collected (separate from product margin)
  tax:               number;
  /** Grand total = netRevenue + shipping + tax */
  total:             number;
  purchaseCost:      number;  // sum of purchaseCostSnapshot * quantity (only known lines)
  grossProfit:       number;  // netRevenue - purchaseCost (only where cost is known)
  grossMarginPct:    number | null; // null when no cost data available
  knownCostLines:    number;  // count of items WITH a purchaseCostSnapshot
  unknownCostLines:  number;  // count of items WITHOUT a purchaseCostSnapshot
  hasMixedCostData:  boolean; // true when some items have cost and some don't
}

export function calcOrderFinancials(order: Order): OrderFinancials {
  let sellingRevenue  = 0;
  let purchaseCost    = 0;
  let knownCostLines  = 0;
  let unknownCostLines = 0;

  for (const item of order.items) {
    const lineRevenue = item.price * item.quantity;
    sellingRevenue   += lineRevenue;

    if (typeof item.purchaseCostSnapshot === 'number') {
      purchaseCost  += item.purchaseCostSnapshot * item.quantity;
      knownCostLines++;
    } else {
      unknownCostLines++;
    }
  }

  const discountAmount  = order.discount ?? 0;
  // netRevenue is the revenue attributable to products after discount,
  // excluding shipping and tax (those are collected separately).
  const netRevenue      = Math.max(0, sellingRevenue - discountAmount);
  const shippingRevenue = order.shippingCharge ?? 0;
  const tax             = order.tax ?? 0;
  const total           = order.total;

  // Gross profit is only meaningful when we have complete cost data.
  // If SOME lines have cost and some don't, we compute partial and flag it.
  const grossProfit     = knownCostLines > 0 ? netRevenue - purchaseCost : 0;
  const grossMarginPct  = knownCostLines > 0 && netRevenue > 0
    ? (grossProfit / netRevenue) * 100
    : null;

  return {
    orderId: order.id,
    sellingRevenue,
    discountAmount,
    netRevenue,
    shippingRevenue,
    tax,
    total,
    purchaseCost,
    grossProfit,
    grossMarginPct,
    knownCostLines,
    unknownCostLines,
    hasMixedCostData: knownCostLines > 0 && unknownCostLines > 0,
  };
}

// ─── Aggregate across a set of orders ────────────────────────────────────────

export interface AggregateFinancials {
  /** Total of order.total for all sale-eligible orders (independent of payment) */
  salesRevenue:       number;
  /** Total of order.total for genuinely paid orders only */
  paymentCollected:   number;
  /** Total of order.total for COD orders delivered but not yet admin-verified */
  outstandingCod:     number;
  /** Sum of purchaseCostSnapshot lines for sale-eligible orders */
  totalPurchaseCost:  number;
  /** grossProfit across orders with known cost data */
  grossProfit:        number;
  /** grossMarginPct across known-cost orders (null if no cost data at all) */
  grossMarginPct:     number | null;
  /** Count of orders with at least one unknown cost line */
  ordersWithUnknownCost: number;
  /** Count of all item lines missing purchaseCostSnapshot */
  totalUnknownCostLines: number;
  /** Count of sale-eligible orders */
  saleOrderCount:     number;
  /** Total units sold across sale-eligible orders */
  unitsSold:          number;
  /** Average order value (salesRevenue / saleOrderCount) */
  avgOrderValue:      number;
}

export function calcAggregateFinancials(orders: Order[]): AggregateFinancials {
  let salesRevenue       = 0;
  let paymentCollected   = 0;
  let outstandingCod     = 0;
  let totalPurchaseCost  = 0;
  let knownCostRevenue   = 0; // revenue portion where cost is known (for margin calc)
  let grossProfit        = 0;
  let ordersWithUnknownCost  = 0;
  let totalUnknownCostLines  = 0;
  let saleOrderCount     = 0;
  let unitsSold          = 0;

  for (const order of orders) {
    if (isSaleEligible(order)) {
      salesRevenue    += order.total;
      saleOrderCount  ++;
      unitsSold       += order.items.reduce((s, i) => s + i.quantity, 0);

      const fin = calcOrderFinancials(order);
      totalPurchaseCost += fin.purchaseCost;

      if (fin.knownCostLines > 0) {
        // Only include revenue from lines where we have cost data in the margin calc
        knownCostRevenue += fin.netRevenue;
        grossProfit      += fin.grossProfit;
      }

      if (fin.unknownCostLines > 0) {
        ordersWithUnknownCost++;
        totalUnknownCostLines += fin.unknownCostLines;
      }
    }

    if (isPaymentCollected(order)) {
      paymentCollected += order.total;
    }

    if (isCodOutstanding(order)) {
      outstandingCod += order.total;
    }
  }

  const grossMarginPct = knownCostRevenue > 0
    ? (grossProfit / knownCostRevenue) * 100
    : null;

  const avgOrderValue = saleOrderCount > 0
    ? Math.round(salesRevenue / saleOrderCount)
    : 0;

  return {
    salesRevenue,
    paymentCollected,
    outstandingCod,
    totalPurchaseCost,
    grossProfit,
    grossMarginPct,
    ordersWithUnknownCost,
    totalUnknownCostLines,
    saleOrderCount,
    unitsSold,
    avgOrderValue,
  };
}

// ─── Per-product financial roll-up ────────────────────────────────────────────

export interface ProductFinancials {
  productId:       string;
  productName:     string;
  variantLabel:    string;
  category:        string;
  thumbnail:       string;
  unitsSold:       number;
  sellingRevenue:  number;
  purchaseCost:    number;
  grossProfit:     number;
  grossMarginPct:  number | null; // null = no cost data for this product+variant
  unknownCostQty:  number;        // units sold without a cost snapshot
}

export function calcProductFinancials(orders: Order[]): ProductFinancials[] {
  // key: `productId::variantId`
  const map = new Map<string, ProductFinancials>();

  for (const order of orders) {
    if (!isSaleEligible(order)) continue;

    for (const item of order.items) {
      const key = `${item.productId}::${item.variantId}`;
      let entry = map.get(key);
      if (!entry) {
        entry = {
          productId:      item.productId,
          productName:    item.name,
          variantLabel:   item.variantLabel,
          category:       '',          // filled below from product store if needed
          thumbnail:      item.thumbnail,
          unitsSold:      0,
          sellingRevenue: 0,
          purchaseCost:   0,
          grossProfit:    0,
          grossMarginPct: null,
          unknownCostQty: 0,
        };
        map.set(key, entry);
      }

      const lineRevenue = item.price * item.quantity;
      entry.unitsSold      += item.quantity;
      entry.sellingRevenue += lineRevenue;

      if (typeof item.purchaseCostSnapshot === 'number') {
        const lineCost   = item.purchaseCostSnapshot * item.quantity;
        entry.purchaseCost  += lineCost;
        entry.grossProfit   += lineRevenue - lineCost;
      } else {
        entry.unknownCostQty += item.quantity;
      }
    }
  }

  // Compute margin after accumulation
  for (const entry of map.values()) {
    const knownRevenue = entry.sellingRevenue
      - (entry.unknownCostQty > 0
          // approximate: unknown-cost revenue = unknownQty * avg price per unit
          ? (entry.sellingRevenue / entry.unitsSold) * entry.unknownCostQty
          : 0);
    entry.grossMarginPct = knownRevenue > 0 && entry.purchaseCost > 0
      ? (entry.grossProfit / knownRevenue) * 100
      : null;
  }

  return [...map.values()].sort((a, b) => b.sellingRevenue - a.sellingRevenue);
}
