export const STORAGE_KEYS = {
  CART: 'dtc_cart',
  ORDERS: 'dtc_orders',
  ADDRESS: 'dtc_saved_address',
  AUTH: 'dtc_auth_user',
  USERS: 'dtc_registered_users',
  ADMINS: 'dtc_admin_accounts',
  ADMIN_AUTH: 'dtc_admin_auth',
  DELIVERY_BOYS: 'dtc_delivery_boys',
  DELIVERY_AUTH: 'dtc_delivery_auth',
  PRODUCTS: 'dtc_products',
  CATEGORIES: 'dtc_categories',
  STOCK_HISTORY: 'dtc_stock_history',
  ORDER_INVENTORY_EFFECTS: 'dtc_order_inventory_effects',
  SETTINGS: 'dtc_admin_settings',
  CUSTOMER_STATUS: 'dtc_admin_customer_status',
  CONTACT_MESSAGES: 'dtc_contact_messages',
  DATA_VERSION: 'dtc_data_version',
  BACKUP_META: 'dtc_backup_meta',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export const LOCAL_DATA_EVENT = 'dtc:local-data-changed';

export class LocalStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LocalStorageError';
  }
}

export function readJson<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return !validate || validate(parsed) ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LOCAL_DATA_EVENT, { detail: { key } }));
  } catch (error) {
    const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    throw new LocalStorageError(quota
      ? 'Browser storage is full. Export a backup or remove unused images before saving.'
      : 'Browser storage could not save this data.', { cause: error });
  }
}

export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LOCAL_DATA_EVENT, { detail: { key } }));
  } catch (error) {
    throw new LocalStorageError('Browser storage could not remove this data.', { cause: error });
  }
}

export function createId(prefix: string): string {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

export function subscribeToLocalData(onChange: () => void): () => void {
  const storageHandler = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith('dtc_')) onChange();
  };
  window.addEventListener('storage', storageHandler);
  window.addEventListener(LOCAL_DATA_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', storageHandler);
    window.removeEventListener(LOCAL_DATA_EVENT, onChange);
  };
}

export function exportLocalData(): string {
  const data: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key) {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  }
  return JSON.stringify({ format: 'dosti-local-data', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function parseLocalDataBackup(raw: string): Record<string, string> {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || !('data' in parsed)) {
    throw new Error('This file is not a Dosti local data backup.');
  }
  const backup = parsed as { format: unknown; version: unknown; data: unknown };
  if (backup.format !== 'dosti-local-data' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    throw new Error('The backup format or version is not supported.');
  }
  const entries = Object.entries(backup.data);
  if (entries.some(([key, value]) => !key.startsWith('dtc_') || typeof value !== 'string')) {
    throw new Error('The backup contains invalid storage records.');
  }
  for (const [key, value] of entries) {
    try { JSON.parse(value); } catch { throw new Error(`The backup record “${key}” is not valid JSON.`); }
  }
  return Object.fromEntries(entries) as Record<string, string>;
}

export function restoreLocalData(data: Record<string, string>): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('dtc_') && key !== STORAGE_KEYS.BACKUP_META && !(key in data)) localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LOCAL_DATA_EVENT));
}

export function resetLocalData(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('dtc_') && key !== STORAGE_KEYS.DATA_VERSION && key !== STORAGE_KEYS.BACKUP_META) {
      localStorage.removeItem(key);
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(LOCAL_DATA_EVENT));
}
