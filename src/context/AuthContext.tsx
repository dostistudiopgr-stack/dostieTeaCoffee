import { useReducer, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { User, AuthState, LoginCredentials, RegisterPayload, UpdateProfilePayload, UserAddress } from '../types';
import { STORAGE_KEYS } from '../utils/constants';
import { createId, readJson, writeJson, removeStoredValue } from '../utils/storage';
import { hashPassword, verifyPassword } from '../utils/passwords';
import { AuthContext, type AuthContextValue } from './authContextInstance';

interface StoredUser { user: User; passwordHash: string; passwordSalt: string }
type UserDatabase = Record<string, StoredUser>;
function loadUsers(): UserDatabase { return readJson<UserDatabase>(STORAGE_KEYS.USERS, {}); }
function saveUser(user: User): void {
  const users = loadUsers();
  const key = user.email.toLowerCase();
  if (users[key]) writeJson(STORAGE_KEYS.USERS, { ...users, [key]: { ...users[key], user } });
}
function loadSession(): User | null {
  const session = readJson<User | null>(STORAGE_KEYS.AUTH, null);
  if (!session || session.role !== 'customer') return null;
  const record = loadUsers()[session.email.toLowerCase()];
  return record?.user?.id === session.id && record.user.isActive !== false ? record.user : null;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User };
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS': return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'UPDATE_USER': return { ...state, user: action.payload };
    case 'LOGOUT': return { user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
  }
}
function buildInitialState(): AuthState {
  const user = loadSession();
  return { user, isAuthenticated: Boolean(user), isLoading: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, undefined, buildInitialState);
  useEffect(() => {
    if (state.user) writeJson(STORAGE_KEYS.AUTH, state.user);
    else removeStoredValue(STORAGE_KEYS.AUTH);
  }, [state.user]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const email = credentials.email.trim().toLowerCase();
    const record = loadUsers()[email];
    if (record?.user.role === 'customer' && record.user.isActive !== false &&
        await verifyPassword(credentials.password, record.passwordSalt, record.passwordHash)) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: record.user });
      return { success: true };
    }
    dispatch({ type: 'SET_LOADING', payload: false });
    return { success: false, error: 'Invalid email or password. Please try again.' };
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const email = payload.email.trim().toLowerCase();
    const db = loadUsers();
    if (db[email]) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'This email is already registered. Please log in.' };
    }
    try {
      const credentials = await hashPassword(payload.password);
      const user: User = {
        id: createId('customer'), name: payload.name.trim(), email,
        phone: payload.phone?.trim(), role: 'customer', addresses: [],
        createdAt: new Date().toISOString(), isActive: true,
      };
      writeJson(STORAGE_KEYS.USERS, { ...db, [email]: { user, ...credentials } });
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { success: true };
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: 'Could not securely save this account in browser storage.' };
    }
  }, []);
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    if (!state.user) return { success: false };
    const updated = { ...state.user, name: payload.name ?? state.user.name, phone: payload.phone ?? state.user.phone };
    dispatch({ type: 'UPDATE_USER', payload: updated }); saveUser(updated); return { success: true };
  }, [state.user]);
  const addAddress = useCallback((data: Omit<UserAddress, 'id'>) => {
    if (!state.user) return;
    const address = { ...data, id: createId('address') };
    const first = state.user.addresses.length === 0;
    const updated = { ...state.user, addresses: [...state.user.addresses, { ...address, isDefault: first || data.isDefault }], defaultAddressId: first || data.isDefault ? address.id : state.user.defaultAddressId };
    dispatch({ type: 'UPDATE_USER', payload: updated }); saveUser(updated);
  }, [state.user]);
  const updateAddress = useCallback((address: UserAddress) => {
    if (!state.user) return;
    const updated = { ...state.user, addresses: state.user.addresses.map((item) => item.id === address.id ? address : item) };
    dispatch({ type: 'UPDATE_USER', payload: updated }); saveUser(updated);
  }, [state.user]);
  const deleteAddress = useCallback((id: string) => {
    if (!state.user) return;
    const remaining = state.user.addresses.filter((address) => address.id !== id);
    const newDefault = state.user.defaultAddressId === id ? (remaining.find((address) => address.isDefault)?.id ?? remaining[0]?.id) : state.user.defaultAddressId;
    const updated = { ...state.user, addresses: remaining.map((address) => ({ ...address, isDefault: address.id === newDefault })), defaultAddressId: newDefault };
    dispatch({ type: 'UPDATE_USER', payload: updated }); saveUser(updated);
  }, [state.user]);
  const setDefaultAddress = useCallback((id: string) => {
    if (!state.user) return;
    const updated = { ...state.user, addresses: state.user.addresses.map((address) => ({ ...address, isDefault: address.id === id })), defaultAddressId: id };
    dispatch({ type: 'UPDATE_USER', payload: updated }); saveUser(updated);
  }, [state.user]);

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, register, logout, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress }),
    [state, login, register, logout, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
