"use client";

import { useMemo, useState } from "react";
import type { Product, ProductCategory } from "@/lib/products";
import { ProductCard } from "./ProductCard";

type Filter = "all" | ProductCategory;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "bague", label: "Bagues" },
  { id: "collier", label: "Colliers" },
  { id: "boucles", label: "Boucles" },
  { id: "bracelet", label: "Bracelets" },
];

export function CollectionGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.category === filter)),
    [filter, products]
  );

  return (
    <>
      <div className="gutter mx-auto mb-12 flex max-w-[1600px] flex-wrap items-center gap-3">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className="chip"
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] uppercase tracking-[0.32em] text-cream/45">
          {items.length} pièces
        </span>
      </div>

      <div className="gutter mx-auto grid max-w-[1600px] grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </>
  );
}
