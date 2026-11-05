import { useContext } from 'react';
import { CartContext } from '../context/cartContextInstance';

/**
 * Convenience hook to consume CartContext.
 * Throws if used outside <CartProvider>.
 */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return ctx;
}
