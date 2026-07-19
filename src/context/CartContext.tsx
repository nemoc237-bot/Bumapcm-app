"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Product } from "@/types";

export interface CartLine {
  product: Product;
  qty: number;
}

interface CartContextValue {
  storeId: string | null;
  lines: CartLine[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue>({
  storeId: null,
  lines: [],
  addItem: () => {},
  removeItem: () => {},
  setQty: () => {},
  clearCart: () => {},
  total: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = (product: Product) => {
    setLines((prev) => {
      // Starting a cart from a different store clears the previous one:
      // BUMAP orders are single-store so payment goes to one seller's OM/MoMo.
      if (storeId && storeId !== product.storeId) {
        setStoreId(product.storeId);
        return [{ product, qty: 1 }];
      }
      if (!storeId) setStoreId(product.storeId);
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.product.id !== productId);
      if (next.length === 0) setStoreId(null);
      return next;
    });
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) return removeItem(productId);
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, qty } : l))
    );
  };

  const clearCart = () => {
    setLines([]);
    setStoreId(null);
  };

  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  return (
    <CartContext.Provider
      value={{ storeId, lines, addItem, removeItem, setQty, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
