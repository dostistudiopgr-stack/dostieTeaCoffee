import { useReducer, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { AdminUser, AdminAuthState, AdminLoginCredentials } from '../types/Admin';
import {
  authenticateAdmin,
  clearAdminSession,
  loadAdminSession,
  saveAdminSession,
} from '../utils/adminAccounts';
import { AdminAuthContext, type AdminAuthContextValue } from './adminAuthContextInstance';

// ─── Action types ─────────────────────────────────────────────────────────────
// LOGOUT is the ONLY action that should clear the persisted session.
// INIT is dispatched after we read localStorage on mount (async-safe).
// LOGIN_SUCCESS saves the session.
// SET_LOADING is used only while the login network call is in-flight.

type Action =
  | { type: 'INIT'; payload: AdminUser | null }
  | { type: 'LOGIN_SUCCESS'; payload: AdminUser }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING' };

function reducer(state: AdminAuthState, action: Action): AdminAuthState {
  switch (action.type) {
    case 'INIT':
      return { admin: action.payload, isAuthenticated: Boolean(action.payload), isLoading: false };
    case 'LOGIN_SUCCESS':
      return { admin: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { admin: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: true };
  }
}

// Start with isLoading:true — routes will show a spinner until INIT fires.
// Do NOT read localStorage here synchronously; React StrictMode double-invokes
// the reducer initialiser which can cause side-effects and races.
const INITIAL_STATE: AdminAuthState = { admin: null, isAuthenticated: false, isLoading: true };

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // ── Mount: read the persisted session ONCE, then dispatch INIT ───────────
  // This replaces the old `buildInitialState` eager-read pattern which, when
  // combined with a useEffect([state.admin]) dependency, would call
  // clearAdminSession() on every render where admin was null — including the
  // very first render after a successful login on a fresh page load.
  useEffect(() => {
    const admin = loadAdminSession();
    dispatch({ type: 'INIT', payload: admin });
  }, []); // empty dep array → runs exactly once after first mount

  // ── Persist session changes ───────────────────────────────────────────────
  // Only write/clear when auth state actually settles (isLoading is false).
  // This prevents writing during transient loading states and, critically,
  // never calls clearAdminSession() unless LOGOUT was explicitly dispatched.
  useEffect(() => {
    if (state.isLoading) return; // still initialising — do nothing
    if (state.admin) {
      saveAdminSession(state.admin);
    }
    // NOTE: clearAdminSession() is NOT called here when admin is null.
    //       It is called explicitly in the logout handler below.
    //       This was the root cause: clearing the session on every mount
    //       where no one had logged in yet, racing with the INIT effect.
  }, [state.admin, state.isLoading]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: AdminLoginCredentials): Promise<{ success: boolean; error?: string }> => {
      dispatch({ type: 'SET_LOADING' });
      const admin = await authenticateAdmin(credentials.email, credentials.password);
      if (admin) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: admin });
        return { success: true };
      }
      dispatch({ type: 'INIT', payload: null }); // reset loading without wiping anything
      return { success: false, error: 'Invalid admin credentials. Please try again.' };
    },
    [],
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAdminSession(); // explicit — only place we call this
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
