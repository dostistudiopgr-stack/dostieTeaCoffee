import { createContext } from 'react';
import type { CartItem, CartSummary } from '../types';

export interface CartContextValue {
  items: CartItem[];
  couponCode: string;
  discountAmount: number;
  summary: CartSummary;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  isInCart: (productId: string, variantId: string) => boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);
