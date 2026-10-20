import { useState } from 'react';
import { JERSEYS, SIZES, COUNTRIES } from '../data/jerseys';

export interface CartItem {
  jerseyId: string;
  size: string;
  country: string;
  quantity: number;
}

export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^public\//, '').replace(/^\//, '')}`;
}

export function useDemoCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('jerserio-demo-cart') ?? '[]');
      return Array.isArray(stored) ? stored.filter((item): item is CartItem =>
        item && JERSEYS.some((jersey) => jersey.id === item.jerseyId) &&
        SIZES.includes(item.size) && COUNTRIES.includes(item.country) &&
        Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99
      ) : [];
    } catch { return []; }
  });
  const [storageWarning, setStorageWarning] = useState(false);

  function save(next: CartItem[]) {
    setItems(next);
    try { localStorage.setItem('jerserio-demo-cart', JSON.stringify(next)); }
    catch { setStorageWarning(true); }
  }

  return {
    items, storageWarning,
    add(item: Omit<CartItem, 'quantity'>) {
      const index = items.findIndex((entry) => entry.jerseyId === item.jerseyId && entry.size === item.size && entry.country === item.country);
      save(index < 0 ? [...items, { ...item, quantity: 1 }] : items.map((entry, i) => i === index ? { ...entry, quantity: Math.min(99, entry.quantity + 1) } : entry));
    },
    update(index: number, quantity: number) {
      save(items.flatMap((item, i) => i !== index ? [item] : quantity <= 0 ? [] : [{ ...item, quantity: Math.min(99, quantity) }]));
    },
    clear() { save([]); },
  };
}
