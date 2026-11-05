import type { Product } from '../types';
import { getAllProducts } from '../utils/productStore';

/** Compatibility exports are empty until real products are saved by an Admin. */
export const products: Product[] = [];
export const featuredProducts: Product[] = [];

export const getProductBySlug = (slug: string) => getAllProducts().find((product) => product.slug === slug);
export const getProductsByCategory = (category: string) => getAllProducts().filter((product) => product.isActive && product.category === category);
export const getMinPrice = (product: { variants: { price: number }[] }) =>
  product.variants.length ? Math.min(...product.variants.map((variant) => variant.price)) : 0;
export const getRelatedProducts = (product: { id: string; category: string }, limit = 4) =>
  getAllProducts().filter((entry) => entry.isActive && entry.id !== product.id && entry.category === product.category).slice(0, limit);
