"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [pulse, setPulse] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        setPulse(true);
        setTimeout(() => setPulse(false), 700);
      }}
      className={`cta w-full justify-between sm:w-auto ${pulse ? "animate-breathe" : ""}`}
    >
      <span>Ajouter au panier</span>
      <span aria-hidden>↗</span>
    </button>
  );
}
