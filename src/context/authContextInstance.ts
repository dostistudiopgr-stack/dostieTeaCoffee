import { createContext } from 'react';
import type { AuthState, LoginCredentials, RegisterPayload, UpdateProfilePayload, UserAddress } from '../types';

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ success: boolean }>;
  addAddress: (addr: Omit<UserAddress, 'id'>) => void;
  updateAddress: (addr: UserAddress) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
