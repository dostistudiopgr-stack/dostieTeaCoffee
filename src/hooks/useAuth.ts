import { useContext } from 'react';
import { AuthContext } from '../context/authContextInstance';

/**
 * Convenience hook to consume AuthContext.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
