import type { User, UserAddress } from '../types';
import { STORAGE_KEYS, createId, readJson, writeJson } from './storage';
import { hashPassword } from './passwords';

export interface AdminCustomer {
  id: string; name: string; email: string; phone: string; role: string;
  addresses: UserAddress[]; createdAt: string; isActive: boolean; hasAccount: boolean;
}
type RegisteredUser = { user: User; passwordHash: string; passwordSalt?: string };
const statusOverrides = () => readJson<Record<string, boolean>>(STORAGE_KEYS.CUSTOMER_STATUS, {});

export function setCustomerActive(customerId: string, active: boolean): void {
  writeJson(STORAGE_KEYS.CUSTOMER_STATUS, { ...statusOverrides(), [customerId]: active });
}
export function loadAllCustomers(): AdminCustomer[] {
  const users = readJson<Record<string, RegisteredUser>>(STORAGE_KEYS.USERS, {});
  const status = statusOverrides();
  return Object.values(users).filter(({ user }) => user?.role === 'customer').map(({ user }) => ({
    id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: 'customer',
    addresses: user.addresses ?? [], createdAt: user.createdAt, isActive: status[user.id] ?? user.isActive !== false, hasAccount: true,
  })).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export function getCustomerById(id: string): AdminCustomer | undefined { return loadAllCustomers().find((customer) => customer.id === id); }

export async function createCustomerAccount(name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readJson<Record<string, RegisteredUser>>(STORAGE_KEYS.USERS, {});
  if (users[normalizedEmail]) return { success: false, error: 'An account with this email already exists.' };
  if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || password.length < 10) return { success: false, error: 'Enter a name, valid email, and password with at least 10 characters.' };
  try {
    const credentials = await hashPassword(password);
    const user: User = { id: createId('customer'), name: name.trim(), email: normalizedEmail, phone: phone.trim(), role: 'customer', addresses: [], createdAt: new Date().toISOString(), isActive: true };
    writeJson(STORAGE_KEYS.USERS, { ...users, [normalizedEmail]: { user, passwordHash: credentials.hash, passwordSalt: credentials.salt } });
    return { success: true };
  } catch { return { success: false, error: 'Could not securely save the account.' }; }
}
