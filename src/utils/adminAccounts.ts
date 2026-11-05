import type { AdminUser } from '../types/Admin';
import { STORAGE_KEYS, createId, readJson, removeStoredValue, writeJson } from './storage';
import { hashPassword, verifyPassword } from './passwords';

export interface StoredAdmin { user: AdminUser; passwordHash: string; passwordSalt: string }
export type AdminDatabase = Record<string, StoredAdmin>;
export function loadAdmins(): AdminDatabase {
  const stored = readJson<unknown>(STORAGE_KEYS.ADMINS, {});
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
  return Object.fromEntries(Object.entries(stored).filter(([email, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const record = value as Partial<StoredAdmin>;
    const user = record.user;
    return !!user && user.role === 'admin' && typeof user.id === 'string' &&
      typeof user.email === 'string' && user.email.toLowerCase() === email.toLowerCase() &&
      typeof user.name === 'string' && typeof user.createdAt === 'string' &&
      typeof record.passwordHash === 'string' && /^[\da-f]{64}$/i.test(record.passwordHash) &&
      typeof record.passwordSalt === 'string' && /^[\da-f]{32}$/i.test(record.passwordSalt);
  })) as AdminDatabase;
}
export function hasAdminAccount(): boolean { return Object.keys(loadAdmins()).length > 0; }
export function loadAdminSession(): AdminUser | null {
  const session = readJson<AdminUser | null>(STORAGE_KEYS.ADMIN_AUTH, null);
  if (!session || typeof session.email !== 'string' || session.role !== 'admin') return null;
  return loadAdmins()[session.email.trim().toLowerCase()]?.user?.id === session.id ? session : null;
}
export function saveAdminSession(admin: AdminUser): void { writeJson(STORAGE_KEYS.ADMIN_AUTH, admin); }
export function clearAdminSession(): void { removeStoredValue(STORAGE_KEYS.ADMIN_AUTH); }

export async function authenticateAdmin(emailInput: string, password: string): Promise<AdminUser | null> {
  const email = emailInput.trim().toLowerCase();
  const admins = loadAdmins();
  const record = admins[email];
  const roleValid = record?.user.role === 'admin';
  let passwordMatched = false;
  try {
    if (record && roleValid) passwordMatched = await verifyPassword(password, record.passwordSalt, record.passwordHash);
  } catch (error) {
    if (import.meta.env.DEV) console.debug('[Admin auth diagnostic]', {
      event: 'login-verification-error', errorName: error instanceof Error ? error.name : 'UnknownError',
    });
  }
  if (import.meta.env.DEV) console.debug('[Admin auth diagnostic]', {
    event: 'login-check', accountCount: Object.keys(admins).length,
    accountFound: Boolean(record), roleValid, passwordMatched,
  });
  return passwordMatched ? record.user : null;
}

export async function createInitialAdmin(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (hasAdminAccount()) return { success: false, error: 'An admin account is already configured.' };
  if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || password.length < 10) return { success: false, error: 'Enter a name, valid email, and password with at least 10 characters.' };
  try {
    const credentials = await hashPassword(password);
    const user: AdminUser = { id: createId('admin'), name: name.trim(), email: normalizedEmail, role: 'admin', createdAt: new Date().toISOString() };
    writeJson(STORAGE_KEYS.ADMINS, { [normalizedEmail]: { user, passwordHash: credentials.hash, passwordSalt: credentials.salt } } satisfies AdminDatabase);
    const saved = loadAdmins()[normalizedEmail];
    const persisted = saved?.user.id === user.id;
    if (import.meta.env.DEV) console.debug('[Admin auth diagnostic]', {
      event: 'first-admin-created', persisted, accountCount: Object.keys(loadAdmins()).length,
    });
    if (!persisted) return { success: false, error: 'Admin account was not found after saving. Check browser storage and try again.' };
    return { success: true };
  } catch { return { success: false, error: 'Could not securely save the admin account.' }; }
}

/** Dev-only recovery. Removes Admin account credentials and its session, preserving all business data. */
export function resetAdminAccessForLocalRecovery(): void {
  if (!import.meta.env.DEV) throw new Error('Admin account recovery is only available in local development.');
  removeStoredValue(STORAGE_KEYS.ADMIN_AUTH);
  removeStoredValue(STORAGE_KEYS.ADMINS);
}
