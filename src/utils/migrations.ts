import { STORAGE_KEYS, exportLocalData, readJson, writeJson } from './storage';
import { migrateLegacyPassword } from './passwords';
import { cleanupUnusedProductImages, exportLocalDataWithImages, saveMigrationBackup } from './imageDb';

const CURRENT_VERSION = 1;
const SEED_ORDER_IDS = new Set(['DTC-SEED-001', 'DTC-SEED-002', 'DTC-SEED-003', 'DTC-SEED-004', 'DTC-SEED-005']);
const SEED_PRODUCT_IDS = new Set([...Array.from({ length: 5 }, (_, index) => `tea-00${index + 1}`), ...Array.from({ length: 5 }, (_, index) => `coffee-00${index + 1}`), ...Array.from({ length: 4 }, (_, index) => `gt-00${index + 1}`)]);
const SEED_CATEGORY_IDS = new Set(['cat-001', 'cat-002', 'cat-003']);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function migrateLocalData(): Promise<void> {
  const version = Number(localStorage.getItem(STORAGE_KEYS.DATA_VERSION) ?? 0);
  if (version >= CURRENT_VERSION) return;

  const backupId = `migration-v${CURRENT_VERSION}-${new Date().toISOString()}`;
  const backup = await exportLocalDataWithImages(exportLocalData());
  await saveMigrationBackup(backupId, backup);

  // Move legacy override maps to the single canonical stores; preserve all saved overrides.
  const oldProducts = asRecord(readJson<unknown>('dtc_product_overrides', {}));
  const savedProducts = readJson<unknown[]>(STORAGE_KEYS.PRODUCTS, []);
  const productMap = new Map(savedProducts.filter((item) => item && typeof item === 'object' && 'id' in item)
    .map((item) => [(item as { id: string }).id, item]));
  for (const [id, product] of Object.entries(oldProducts)) {
    // Merge old overrides before removing only the audited sample SKU identifiers.
    if (product && typeof product === 'object') productMap.set(id, product);
  }
  const cleanProducts = [...productMap.entries()].filter(([id]) => !SEED_PRODUCT_IDS.has(id)).map(([, product]) => product);
  if (Object.keys(oldProducts).length || savedProducts.length) writeJson(STORAGE_KEYS.PRODUCTS, cleanProducts);

  const oldCategories = asRecord(readJson<unknown>('dtc_category_overrides', {}));
  const savedCategories = readJson<unknown[]>(STORAGE_KEYS.CATEGORIES, []);
  const categoryMap = new Map(savedCategories.filter((item) => item && typeof item === 'object' && 'id' in item)
    .map((item) => [(item as { id: string }).id, item]));
  for (const [id, category] of Object.entries(oldCategories)) {
    if (category && typeof category === 'object') categoryMap.set(id, category);
  }
  const cleanCategories = [...categoryMap.entries()].filter(([id]) => !SEED_CATEGORY_IDS.has(id)).map(([, category]) => category);
  if (Object.keys(oldCategories).length || savedCategories.length) writeJson(STORAGE_KEYS.CATEGORIES, cleanCategories);

  const orders = readJson<unknown[]>(STORAGE_KEYS.ORDERS, []);
  if (orders.length) writeJson(STORAGE_KEYS.ORDERS, orders.filter((order) =>
    !order || typeof order !== 'object' || !('id' in order) || !SEED_ORDER_IDS.has(String((order as { id: unknown }).id))));

  const users = asRecord(readJson<unknown>(STORAGE_KEYS.USERS, {}));
  let usersChanged = false;
  for (const [email, value] of Object.entries(users)) {
    const entry = asRecord(value);
    const user = asRecord(entry.user);
    if (user.id === 'demo-customer-001') {
      delete users[email];
      usersChanged = true;
      continue;
    }
    if (typeof entry.passwordHash === 'string' && !entry.passwordSalt) {
      const secure = await migrateLegacyPassword(entry.passwordHash);
      if (!secure) throw new Error(`Could not securely migrate the saved password for ${email}. Existing browser data is backed up and has been left intact.`);
      users[email] = { ...entry, passwordSalt: secure.salt, passwordHash: secure.hash };
      usersChanged = true;
    }
  }
  if (usersChanged) writeJson(STORAGE_KEYS.USERS, users);

  const deliveryBoys = readJson<unknown[]>('dtc_delivery_boys', []);
  const migratedBoys: unknown[] = [];
  let boysChanged = false;
  for (const value of deliveryBoys) {
    const boy = asRecord(value);
    if (boy.id === 'del-demo-001') { boysChanged = true; continue; }
    if (typeof boy.password === 'string' && typeof boy.passwordSalt !== 'string') {
      const secure = await migrateLegacyPassword(boy.password);
      if (!secure) throw new Error('Could not securely migrate a saved Delivery Boy password. Existing browser data is backed up and has been left intact.');
      const profile = { ...boy };
      delete profile.password;
      migratedBoys.push({ ...profile, passwordSalt: secure.salt, passwordHash: secure.hash });
      boysChanged = true;
      continue;
    }
    migratedBoys.push(boy);
  }
  if (boysChanged) writeJson(STORAGE_KEYS.DELIVERY_BOYS, migratedBoys);

  for (const [key, id] of [[STORAGE_KEYS.AUTH, 'demo-customer-001'], [STORAGE_KEYS.ADMIN_AUTH, 'admin-001'], [STORAGE_KEYS.DELIVERY_AUTH, 'del-demo-001']] as const) {
    const session = asRecord(readJson<unknown>(key, null));
    if (session.id === id) localStorage.removeItem(key);
  }
  const retainedImageIds = new Set<string>();
  for (const product of cleanProducts) {
    const record = asRecord(product);
    if (Array.isArray(record.images)) for (const image of record.images) if (typeof image === 'string' && !/^(https?:|data:|blob:|\/)/i.test(image)) retainedImageIds.add(image);
  }
  await cleanupUnusedProductImages(retainedImageIds);
  const customerStatuses = asRecord(readJson<unknown>('dtc_admin_customer_status', {}));
  if ('demo-customer-001' in customerStatuses) {
    delete customerStatuses['demo-customer-001'];
    writeJson(STORAGE_KEYS.CUSTOMER_STATUS, customerStatuses);
  }

  // Only discard verified legacy aliases after the backup and canonical copies exist.
  localStorage.removeItem('dtc_product_overrides');
  localStorage.removeItem('dtc_category_overrides');
  localStorage.setItem(STORAGE_KEYS.DATA_VERSION, String(CURRENT_VERSION));
  localStorage.setItem(STORAGE_KEYS.BACKUP_META, JSON.stringify({ id: backupId, createdAt: new Date().toISOString() }));
}
