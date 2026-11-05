import type { Product } from '../types';
import { createId, readJson, STORAGE_KEYS, writeJson } from './storage';
import { migrateProductSkus } from './skuGenerator';

// ─── Product localStorage persistence ─────────────────────────────────────────
// Product records and stock now use one canonical localStorage collection.

function loadProducts(): Product[] {
  const raw = readJson<Product[]>(STORAGE_KEYS.PRODUCTS, [], (value): value is Product[] =>
    Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string')
  );
  // Auto-migrate: assign product-level SKUs to existing products that don't have one
  const migrated = migrateProductSkus(raw);
  if (migrated !== raw) writeJson(STORAGE_KEYS.PRODUCTS, migrated);
  return migrated;
}

/** All customer and admin views use this single saved product collection. */
export function getAllProducts(): Product[] {
  return loadProducts();
}

export function getProductById(id: string): Product | undefined {
  return loadProducts().find((product) => product.id === id);
}

export function saveProduct(product: Product): void {
  const products = loadProducts();
  const existing = products.find((entry) => entry.id === product.id);
  const now = new Date().toISOString();
  const saved = { ...product, createdAt: existing?.createdAt ?? product.createdAt ?? now, updatedAt: now };
  writeJson(STORAGE_KEYS.PRODUCTS, [saved, ...products.filter((entry) => entry.id !== product.id)]);
}

/** Soft-delete: mark product as inactive. */
export function deleteProduct(id: string): void {
  const product = getProductById(id);
  if (product) saveProduct({ ...product, isActive: false });
}

/** Hard-delete: remove product entirely from overrides. */
export function removeProduct(id: string): void {
  writeJson(STORAGE_KEYS.PRODUCTS, loadProducts().filter((product) => product.id !== id));
}

/** Toggle product active status. */
export function toggleProductActive(id: string): void {
  const product = getProductById(id);
  if (!product) return;
  saveProduct({ ...product, isActive: !product.isActive });
}

/** Update stock for a specific variant. */
export function updateVariantStock(
  productId: string,
  variantId: string,
  newStock: number,
): void {
  const product = getProductById(productId);
  if (!product) return;
  if (!Number.isSafeInteger(newStock) || newStock < 0) return;
  const updated: Product = {
    ...product,
    variants: product.variants.map((v) =>
      v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v
    ),
  };
  saveProduct(updated);
}

// ─── Stock movement history ────────────────────────────────────────────────────

const STOCK_HISTORY_KEY = STORAGE_KEYS.STOCK_HISTORY;

export type AdjustmentType = 'stock-in' | 'stock-out' | 'correction';

export interface StockMovement {
  id:             string;
  timestamp:      string;          // ISO date string
  productId:      string;
  productName:    string;
  variantId:      string;
  variantLabel:   string;
  sku:            string;
  adjustmentType: AdjustmentType;
  previousStock:  number;
  changeQuantity: number;          // always positive; direction given by adjustmentType
  newStock:       number;
  reason:         string;
  notes:          string;
}

export function loadStockHistory(): StockMovement[] {
  return readJson<StockMovement[]>(STOCK_HISTORY_KEY, [], (value): value is StockMovement[] => Array.isArray(value));
}

export function appendStockMovement(movement: Omit<StockMovement, 'id'>): StockMovement {
  const history = loadStockHistory();
  const entry: StockMovement = { ...movement, id: createId('sm') };
  // Keep newest first, cap at 500 records
  history.unshift(entry);
  if (history.length > 500) history.splice(500);
  writeJson(STOCK_HISTORY_KEY, history);
  return entry;
}

/**
 * Adjust variant stock and record the movement in history.
 * Returns the new stock level or -1 if the adjustment is invalid.
 */
export function adjustVariantStock(params: {
  productId:      string;
  variantId:      string;
  productName:    string;
  variantLabel:   string;
  sku:            string;
  adjustmentType: AdjustmentType;
  quantity:       number;          // always a positive integer
  reason:         string;
  notes:          string;
}): number {
  const {
    productId, variantId, productName, variantLabel, sku,
    adjustmentType, quantity, reason, notes,
  } = params;

  const product = getProductById(productId);
  if (!product) return -1;

  const minimumQuantity = adjustmentType === 'correction' ? 0 : 1;
  if (!Number.isSafeInteger(quantity) || quantity < minimumQuantity) return -1;

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return -1;

  const prev = variant.stock;
  if (adjustmentType === 'stock-out' && quantity > prev) return -1;
  let next: number;

  switch (adjustmentType) {
    case 'stock-in':
      next = prev + quantity;
      break;
    case 'stock-out':
      next = Math.max(0, prev - quantity);
      break;
    case 'correction':
      next = Math.max(0, quantity);
      break;
  }

  // Save updated variant stock
  const updatedProduct: Product = {
    ...product,
    variants: product.variants.map((v) =>
      v.id === variantId ? { ...v, stock: next } : v
    ),
  };
  saveProduct(updatedProduct);

  // Record movement
  appendStockMovement({
    timestamp:      new Date().toISOString(),
    productId,
    productName,
    variantId,
    variantLabel,
    sku,
    adjustmentType,
    previousStock:  prev,
    changeQuantity: adjustmentType === 'correction' ? Math.abs(next - prev) : quantity,
    newStock:       next,
    reason,
    notes,
  });

  return next;
}

// ─── Category persistence ──────────────────────────────────────────────────────

const CATEGORY_OVERRIDES_KEY = STORAGE_KEYS.CATEGORIES;

export interface AdminCategory {
  id:              string;
  createdAt?:      string;
  updatedAt?:      string;
  name:            string;
  slug:            string;
  description:     string;
  image:           string;        // Optional category image URL
  icon?:           string;        // emoji icon
  productCount:    number;
  isActive:        boolean;
  sortOrder:       number;
  showOnHomepage?: boolean;       // show in customer homepage category section
}

function loadCategories(): AdminCategory[] {
  return readJson<AdminCategory[]>(CATEGORY_OVERRIDES_KEY, [], (value): value is AdminCategory[] =>
    Array.isArray(value) && value.every((item) => !!item && typeof item === 'object' && typeof item.id === 'string')
  );
}

export function getAllCategories(): AdminCategory[] {
  return loadCategories();
}

export function saveCategory(category: AdminCategory): void {
  const categories = loadCategories();
  const existing = categories.find((entry) => entry.id === category.id);
  const now = new Date().toISOString();
  const saved = { ...category, createdAt: existing?.createdAt ?? category.createdAt ?? now, updatedAt: now };
  writeJson(CATEGORY_OVERRIDES_KEY, [saved, ...categories.filter((entry) => entry.id !== category.id)]);
}

/** Check whether the category name or slug already exists (used for duplicate validation). */
export function isCategoryDuplicate(
  name: string,
  slug: string,
  excludeId: string,
): { name: boolean; slug: boolean } {
  const all = getAllCategories();
  return {
    name: all.some((c) => c.id !== excludeId && c.name.trim().toLowerCase() === name.trim().toLowerCase()),
    slug: all.some((c) => c.id !== excludeId && c.slug.trim().toLowerCase() === slug.trim().toLowerCase()),
  };
}

export function deleteCategory(id: string): void {
  const category = loadCategories().find((entry) => entry.id === id);
  if (category) saveCategory({ ...category, isActive: false });
}

export function removeCategory(id: string): void {
  writeJson(CATEGORY_OVERRIDES_KEY, loadCategories().filter((category) => category.id !== id));
}

// ─── Admin settings persistence ───────────────────────────────────────────────

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

export interface AdminSettings {
  store: {
    name:      string;
    tagline:   string;
    email:     string;
    phone:     string;
    address:   string;
    currency:  string;   // 'INR' — read-only in UI
    timezone:  string;   // 'Asia/Kolkata' — read-only in UI
  };
  branding: {
    primary: string;
    dark: string;
    background: string;
    accent: string;
  };
  delivery: {
    charge:          number;
    freeThreshold:   number;
    estimatedDays:   string;
  };
  business: {
    orderIdPrefix:       string;
    minimumOrderAmount:  number;
    allowCOD:            boolean;
    maintenanceMode:     boolean;
    // Payment methods
    allowOnlinePayment:  boolean;
    allowUpiQr:          boolean;
  };
  payment: {
    merchantUpiId:    string;   // e.g. merchant@upi
    merchantName:     string;   // display name in UPI apps
  };
  inventory: {
    lowStockThreshold:           number;
    hideOutOfStockProducts:      boolean;
    preventOrderOnZeroStock:     boolean;
  };
  orders: {
    allowCancellationBeforeShipment: boolean;
    allowReturnsAfterDelivery:       boolean;
    returnWindowDays:                number;
  };
  notifications: {
    newOrder:             boolean;
    lowStock:             boolean;
    customerRegistration: boolean;
  };
  admin: {
    name:  string;
    email: string;
  };
}

const DEFAULT_SETTINGS: AdminSettings = {
  store: {
    name:      'Dosti Tea & Coffee',
    tagline:   'Every Sip, A Little More Togetherness',
    email:     '',
    phone:     '',
    address:   '',
    currency:  'INR',
    timezone:  'Asia/Kolkata',
  },
  branding: { primary: '#244C36', dark: '#173B2B', background: '#FAF7EF', accent: '#C5A15A' },
  delivery: {
    charge:        0,
    freeThreshold: 0,
    estimatedDays: '3–5 business days',
  },
  business: {
    orderIdPrefix:       'DTC',
    minimumOrderAmount:  0,
    allowCOD:            true,
    maintenanceMode:     false,
    allowOnlinePayment:  true,
    allowUpiQr:          true,
  },
  payment: {
    merchantUpiId:  '',
    merchantName:   '',
  },
  inventory: {
    lowStockThreshold:           15,
    hideOutOfStockProducts:      false,
    preventOrderOnZeroStock:     true,
  },
  orders: {
    allowCancellationBeforeShipment: true,
    allowReturnsAfterDelivery:       true,
    returnWindowDays:                7,
  },
  notifications: {
    newOrder:             true,
    lowStock:             true,
    customerRegistration: false,
  },
  admin: {
    name:  '',
    email: '',
  },
};

export function loadSettings(): AdminSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    const stored = parsed as Partial<AdminSettings>;
    const merge = <T extends object>(defaults: T, candidate: unknown): T => {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return defaults;
      const result = { ...defaults } as Record<string, unknown>;
      for (const [key, fallback] of Object.entries(defaults)) {
        const value = (candidate as Record<string, unknown>)[key];
        if (typeof fallback === 'string' && typeof value === 'string') result[key] = value.slice(0, 500);
        else if (typeof fallback === 'number' && typeof value === 'number' && Number.isFinite(value) && value >= 0) result[key] = value;
        else if (typeof fallback === 'boolean' && typeof value === 'boolean') result[key] = value;
      }
      return result as T;
    };
    const settings: AdminSettings = {
      store: merge(DEFAULT_SETTINGS.store, stored.store),
      branding: merge(DEFAULT_SETTINGS.branding, stored.branding),
      delivery: merge(DEFAULT_SETTINGS.delivery, stored.delivery),
      business: merge(DEFAULT_SETTINGS.business, stored.business),
      payment: merge(DEFAULT_SETTINGS.payment, stored.payment),
      inventory: merge(DEFAULT_SETTINGS.inventory, stored.inventory),
      orders: merge(DEFAULT_SETTINGS.orders, stored.orders),
      notifications: merge(DEFAULT_SETTINGS.notifications, stored.notifications),
      admin: merge(DEFAULT_SETTINGS.admin, stored.admin),
    };
    for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS.branding)) {
      const color = settings.branding[key as keyof AdminSettings['branding']];
      if (!/^#[\da-f]{6}$/i.test(color)) settings.branding[key as keyof AdminSettings['branding']] = fallback;
    }
    if (!settings.store.name.trim()) settings.store.name = DEFAULT_SETTINGS.store.name;
    if (settings.store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.store.email)) settings.store.email = '';
    if (settings.store.phone && !/^[+\d\s().-]{7,20}$/.test(settings.store.phone)) settings.store.phone = '';
    if (settings.payment.merchantUpiId && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(settings.payment.merchantUpiId.trim())) settings.payment.merchantUpiId = '';
    if (settings.inventory.lowStockThreshold < 1) settings.inventory.lowStockThreshold = DEFAULT_SETTINGS.inventory.lowStockThreshold;
    if (settings.orders.returnWindowDays < 1 || settings.orders.returnWindowDays > 30) settings.orders.returnWindowDays = DEFAULT_SETTINGS.orders.returnWindowDays;
    return settings;
  } catch { return DEFAULT_SETTINGS; }
}

export function getDefaultSettings(): AdminSettings {
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AdminSettings): void {
  if (!settings || typeof settings !== 'object') throw new Error('Settings must be an object.');
  const sections = Object.keys(DEFAULT_SETTINGS) as (keyof AdminSettings)[];
  for (const section of sections) {
    const value = settings[section];
    if (!value || typeof value !== 'object') throw new Error(`Invalid settings section: ${section}`);
  }
  if (!/^#[\da-f]{6}$/i.test(settings.branding.primary) || !/^#[\da-f]{6}$/i.test(settings.branding.dark) || !/^#[\da-f]{6}$/i.test(settings.branding.background) || !/^#[\da-f]{6}$/i.test(settings.branding.accent)) throw new Error('Brand colors must be valid six-digit HEX values.');
  if ([settings.delivery.charge, settings.delivery.freeThreshold, settings.business.minimumOrderAmount].some((value) => !Number.isFinite(value) || value < 0)) throw new Error('Prices and delivery amounts must be non-negative numbers.');
  if (!settings.store.name.trim() || settings.store.name.length > 120) throw new Error('Store name is required and must be at most 120 characters.');
  if (settings.store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.store.email)) throw new Error('Store email must be valid.');
  if (settings.store.phone && !/^[+\d\s().-]{7,20}$/.test(settings.store.phone)) throw new Error('Store phone must be valid.');
  if (settings.business.allowUpiQr && settings.payment.merchantUpiId && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(settings.payment.merchantUpiId.trim())) throw new Error('Merchant UPI ID must be valid.');
  const merged = { ...loadSettings(), ...settings };
  writeJson(SETTINGS_KEY, merged);
}
