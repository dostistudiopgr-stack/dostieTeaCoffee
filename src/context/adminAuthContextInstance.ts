import { createContext } from 'react';
import type { AdminAuthState, AdminLoginCredentials } from '../types/Admin';

export interface AdminAuthContextValue extends AdminAuthState {
  login: (credentials: AdminLoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);
