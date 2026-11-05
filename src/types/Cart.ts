export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  thumbnail: string;
  /** Admin reporting snapshot; customer-facing components must never render this. */
  purchaseCostSnapshot?: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  discountAmount: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}
