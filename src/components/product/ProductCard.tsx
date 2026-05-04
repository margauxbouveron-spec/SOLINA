"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

type Props = { product: Product; index?: number };

/**
 * Editorial product card with cursor-tracked tilt + golden sweep on hover.
 * Tilt is computed locally (no global state) for cheapness on long grids.
 */
export function ProductCard({ product, index = 0 }: Props) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    const img = imgRef.current;
    if (!el || !img) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    img.style.transform = `translate3d(${-x * 8}px, ${-y * 8}px, 0) scale(1.04) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
  };

  const onLeave = () => {
    if (imgRef.current)
      imgRef.current.style.transform = "translate3d(0,0,0) scale(1) rotateX(0) rotateY(0)";
  };

  return (
    <Link
      href={`/product/${product.handle}`}
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group block"
      style={{
        animation: `rise 1.2s cubic-bezier(0.16,1,0.3,1) ${0.05 * index}s both`,
      }}
    >
      <div
        className="sweep relative aspect-[4/5] overflow-hidden bg-sand/40"
        style={{ perspective: 1200 }}
      >
        <div
          ref={imgRef}
          className="absolute inset-0 transition-transform duration-700 ease-silk will-change-transform"
        >
          <img
            src={product.images[0]?.src}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        {/* soft inner shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 -80px 100px -40px rgba(26,24,20,0.18)",
          }}
        />

        {/* category chip */}
        <div className="absolute left-4 top-4 text-[9px] uppercase tracking-[0.42em] text-ink/70 mix-blend-multiply">
          {product.category}
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="font-editorial text-xl tracking-tight text-ink">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] text-ink/60">
            {product.poem}
          </p>
        </div>
        <div className="text-[13px] tracking-[0.18em] text-ink/80">
          {formatPrice(product.price, product.currency)}
        </div>
      </div>
    </Link>
  );
}
