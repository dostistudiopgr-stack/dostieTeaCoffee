export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;       // path relative to /public
  icon?: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}
