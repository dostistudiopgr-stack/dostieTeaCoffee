import type { AdminCategory } from '../utils/productStore';
import { getAllCategories } from '../utils/productStore';

export const categories: AdminCategory[] = [];
export const getSavedCategories = () => getAllCategories();
