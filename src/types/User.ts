// ─── Address ──────────────────────────────────────────────────────────────────
// NOTE: ShippingAddress in Order.ts is the order-time snapshot.
// UserAddress below is the profile-managed saved address.

export type AddressType = 'Home' | 'Work' | 'Other';

export interface UserAddress {
  id:           string;
  label:        AddressType;
  fullName:     string;
  phone:        string;
  addressLine1: string;
  addressLine2?: string;
  landmark?:    string;
  city:         string;
  state:        string;
  pincode:      string;
  country:      string;
  lat?:         number;
  lng?:         number;
  isDefault:    boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin';

export interface User {
  id:               string;
  name:             string;
  email:            string;
  phone?:           string;
  role:             UserRole;
  avatar?:          string;
  addresses:        UserAddress[];
  defaultAddressId?: string;
  createdAt:        string;
  isActive:         boolean;
}

// ─── Auth state ───────────────────────────────────────────────────────────────

export interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterPayload {
  name:     string;
  email:    string;
  phone?:   string;
  password: string;
}

export interface UpdateProfilePayload {
  name?:  string;
  phone?: string;
}
