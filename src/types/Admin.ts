/**
 * Admin types — frontend mock only.
 * Production admin auth must be implemented with secure backend sessions.
 */

export interface AdminUser {
  id:        string;
  name:      string;
  email:     string;
  role:      'admin';
  avatar?:   string;
  createdAt: string;
}

export interface AdminAuthState {
  admin:           AdminUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
}

export interface AdminLoginCredentials {
  email:    string;
  password: string;
}
