import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../utils/productStore';
import type { Product } from '../types';

export interface SearchResult {
  id:        string;
  slug:      string;
  name:      string;
  category:  string;
  thumbnail: string;
  price:     number;
}

const toResult = (p: Product): SearchResult => {
  const defaultVariant = p.variants.find((v) => v.id === p.defaultVariantId) ?? p.variants[0];
  return {
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    category:  p.category,
    thumbnail: p.thumbnail,
    price:     defaultVariant?.price ?? 0,
  };
};

export function useSearchOverlay() {
  const navigate                    = useNavigate();
  const [isOpen, setIsOpen]         = useState(false);
  const [query,  setQuery]          = useState('');
  const inputRef                    = useRef<HTMLInputElement>(null);

  const results: SearchResult[] = query.trim().length >= 1
      ? getAllProducts()
        .filter(
          (p) =>
            p.isActive &&
            (p.name.toLowerCase().includes(query.toLowerCase()) ||
             p.category.toLowerCase().includes(query.toLowerCase()) ||
             p.flavorNotes?.some((n) => n.toLowerCase().includes(query.toLowerCase())))
        )
        .slice(0, 6)
        .map(toResult)
    : [];

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const selectResult = useCallback(
    (slug: string) => {
      navigate(`/product/${slug}`);
      close();
    },
    [navigate, close]
  );

  return { isOpen, query, setQuery, results, open, close, selectResult, inputRef };
}
