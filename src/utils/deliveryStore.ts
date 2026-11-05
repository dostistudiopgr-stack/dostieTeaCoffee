import { STORAGE_KEYS, createId, readJson, writeJson, removeStoredValue } from './storage';
import { hashPassword, verifyPassword } from './passwords';

export interface DeliveryBoy { id: string; name: string; email: string; phone: string; isActive: boolean; createdAt: string }
interface StoredDeliveryBoy extends DeliveryBoy { passwordHash: string; passwordSalt: string }
export interface DeliveryAuthState { deliveryBoy: DeliveryBoy | null; isAuthenticated: boolean; isLoading: boolean }
const loadStored = (): StoredDeliveryBoy[] => readJson<StoredDeliveryBoy[]>(STORAGE_KEYS.DELIVERY_BOYS, []);
const saveStored = (boys: StoredDeliveryBoy[]) => writeJson(STORAGE_KEYS.DELIVERY_BOYS, boys);
const safe = (record: StoredDeliveryBoy): DeliveryBoy => {
  return { id: record.id, name: record.name, email: record.email, phone: record.phone, isActive: record.isActive, createdAt: record.createdAt };
};

export function getAllDeliveryBoys(): DeliveryBoy[] {
  return loadStored().map(safe).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function getDeliveryBoyById(id: string): DeliveryBoy | undefined { return getAllDeliveryBoys().find((boy) => boy.id === id); }
export function getDeliveryBoyByEmail(email: string): DeliveryBoy | undefined { return getAllDeliveryBoys().find((boy) => boy.email.toLowerCase() === email.toLowerCase()); }
export function isDeliveryEmailDuplicate(email: string, excludeId?: string): boolean {
  return loadStored().some((boy) => boy.email.toLowerCase() === email.toLowerCase() && boy.id !== excludeId);
}
export async function addDeliveryBoy(name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string; boy?: DeliveryBoy }> {
  if (!name.trim() || !email.trim() || !phone.trim() || !password) return { success: false, error: 'All fields are required.' };
  if (password.length < 10) return { success: false, error: 'Password must be at least 10 characters.' };
  if (isDeliveryEmailDuplicate(email)) return { success: false, error: 'A delivery boy with this email already exists.' };
  try {
    const hashed = await hashPassword(password);
    const boy: StoredDeliveryBoy = { id: createId('delivery'), name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), passwordHash: hashed.hash, passwordSalt: hashed.salt, isActive: true, createdAt: new Date().toISOString() };
    saveStored([...loadStored(), boy]);
    return { success: true, boy: safe(boy) };
  } catch { return { success: false, error: 'Could not securely save this account.' }; }
}
export async function updateDeliveryBoy(id: string, updates: Partial<DeliveryBoy> & { password?: string }): Promise<void> {
  const boys = loadStored();
  const index = boys.findIndex((boy) => boy.id === id);
  if (index < 0) return;
  const { password, ...profile } = updates;
  const updated: StoredDeliveryBoy = { ...boys[index], ...profile };
  if (password) {
    if (password.length < 10) throw new Error('Password must be at least 10 characters.');
    const hashed = await hashPassword(password);
    updated.passwordHash = hashed.hash;
    updated.passwordSalt = hashed.salt;
  }
  boys[index] = updated;
  saveStored(boys);
}
export async function toggleDeliveryBoyActive(id: string): Promise<void> {
  const boy = loadStored().find((item) => item.id === id);
  if (boy) await updateDeliveryBoy(id, { isActive: !boy.isActive });
}
export async function deleteDeliveryBoy(id: string): Promise<void> { await toggleDeliveryBoyActive(id); }

export async function deliveryLogin(email: string, password: string): Promise<{ success: boolean; error?: string; boy?: DeliveryBoy }> {
  const record = loadStored().find((boy) => boy.email.toLowerCase() === email.toLowerCase());
  if (!record) return { success: false, error: 'Invalid credentials.' };
  if (!record.isActive) return { success: false, error: 'Account is inactive. Contact admin.' };
  if (!await verifyPassword(password, record.passwordSalt, record.passwordHash)) return { success: false, error: 'Invalid credentials.' };
  const boy = safe(record);
  writeJson(STORAGE_KEYS.DELIVERY_AUTH, boy);
  return { success: true, boy };
}
export function deliveryLogout(): void { removeStoredValue(STORAGE_KEYS.DELIVERY_AUTH); }
export function getCurrentDeliveryBoy(): DeliveryBoy | null {
  const session = readJson<DeliveryBoy | null>(STORAGE_KEYS.DELIVERY_AUTH, null);
  if (!session) return null;
  return getDeliveryBoyById(session.id) ?? (deliveryLogout(), null);
}
