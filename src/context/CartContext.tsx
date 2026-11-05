import { useReducer, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { CartItem } from '../types';
import { calcCartSummary } from '../utils/orderUtils';
import { STORAGE_KEYS }   from '../utils/constants';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { CartContext, type CartContextValue } from './cartContextInstance';
import { readJson, writeJson } from '../utils/storage';

// ─── State ────────────────────────────────────────────────────────────────────

interface CartState {
  items:          CartItem[];
  couponCode:     string;
  discountAmount: number;
}

const EMPTY_STATE: CartState = { items: [], couponCode: '', discountAmount: 0 };

function loadFromStorage(): CartState {
  return readJson<CartState>(STORAGE_KEYS.CART, EMPTY_STATE, (value): value is CartState => !!value && typeof value === 'object' && 'items' in value && Array.isArray(value.items));
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type CartAction =
  | { type: 'ADD_ITEM';        payload: CartItem }
  | { type: 'REMOVE_ITEM';     payload: { productId: string; variantId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; variantId: string; quantity: number } }
  | { type: 'APPLY_COUPON';    payload: { code: string; discount: number } }
  | { type: 'REMOVE_COUPON' }
  | { type: 'CLEAR_CART' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key = (i: CartItem) =>
        i.productId === action.payload.productId && i.variantId === action.payload.variantId;

      const existing = state.items.find(key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            key(i) ? { ...i, quantity: i.quantity + action.payload.quantity } : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
        ),
      };

    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId && i.variantId === action.payload.variantId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }

    case 'APPLY_COUPON':
      return { ...state, couponCode: action.payload.code, discountAmount: action.payload.discount };

    case 'REMOVE_COUPON':
      return { ...state, couponCode: '', discountAmount: 0 };

    case 'CLEAR_CART':
      return EMPTY_STATE;

    default:
      return state;
  }
}

// ─── Context value ────────────────────────────────────────────────────────────

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadFromStorage);
  const adminSettings = usePublicSettings();

  // Persist to localStorage on every state change
  useEffect(() => {
    writeJson(STORAGE_KEYS.CART, state);
  }, [state]);

  const addItem        = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }), []);
  const removeItem     = useCallback((productId: string, variantId: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantId } }), []);
  const updateQuantity = useCallback((productId: string, variantId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, variantId, quantity } }), []);
  const applyCoupon    = useCallback((code: string, discount: number) =>
    dispatch({ type: 'APPLY_COUPON', payload: { code, discount } }), []);
  const removeCoupon   = useCallback(() => dispatch({ type: 'REMOVE_COUPON' }), []);
  const clearCart      = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const isInCart       = useCallback(
    (productId: string, variantId: string) =>
      state.items.some((i) => i.productId === productId && i.variantId === variantId),
    [state.items]
  );

  const summary = useMemo(() => {
    // Read delivery config from admin settings so changes in Settings take effect immediately
    return calcCartSummary(
      state.items,
      state.discountAmount,
      adminSettings.delivery.freeThreshold,
      adminSettings.delivery.charge,
    );
  }, [state.items, state.discountAmount, adminSettings.delivery.freeThreshold, adminSettings.delivery.charge]);

  const value = useMemo<CartContextValue>(
    () => ({ items: state.items, couponCode: state.couponCode, discountAmount: state.discountAmount,
             summary, addItem, removeItem, updateQuantity, applyCoupon, removeCoupon, clearCart, isInCart }),
    [state, summary, addItem, removeItem, updateQuantity, applyCoupon, removeCoupon, clearCart, isInCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
