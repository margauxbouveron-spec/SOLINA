"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./products";

export type CartItem = {
  id: string;
  /** Shopify variant GID — used at checkout to create the Shopify cart */
  variantId?: string;
  handle: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === p.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === p.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: p.id,
                variantId: p.variantId,
                handle: p.handle,
                name: p.name,
                price: p.price,
                currency: p.currency,
                image: p.images[0]?.src ?? "",
                qty,
              },
            ],
          };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: "solina-cart" }
  )
);
