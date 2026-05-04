"use client";

import { useState } from "react";
import { Cta } from "@/components/ui/Cta";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [pulse, setPulse] = useState(false);

  return (
    <Cta
      arrow="ne"
      fullWidth
      onClick={() => {
        add(product);
        setPulse(true);
        setTimeout(() => setPulse(false), 700);
      }}
      className={pulse ? "ring-2 ring-gold/40" : ""}
    >
      Ajouter au panier
    </Cta>
  );
}
