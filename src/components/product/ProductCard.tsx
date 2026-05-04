"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";

type Props = { product: Product; index?: number };

/**
 * Editorial product card.
 * - Double-bezel: outer warm shell (sand/30) + inner image core, with
 *   nested border radii (outer 24px → inner 18px) and a 1px hairline ring.
 * - Cursor parallax tilt computed locally (no global state) for cheap grids.
 * - Golden sweep on hover via the .sweep utility.
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
    img.style.transform = `translate3d(${-x * 8}px, ${-y * 8}px, 0) scale(1.04) rotateX(${-y * 3.5}deg) rotateY(${x * 3.5}deg)`;
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
      {/* Outer shell — warm bezel */}
      <div
        className="relative rounded-[24px] bg-sand/35 p-1.5 ring-1 ring-inset ring-ink/[0.06] transition-shadow duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-ink/[0.12]"
        style={{
          boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 24px 50px -28px rgba(31,24,20,0.18)",
        }}
      >
        {/* Inner core — image */}
        <div
          className="sweep relative aspect-[4/5] overflow-hidden rounded-[18px] bg-cream"
          style={{ perspective: 1200 }}
        >
          <div
            ref={imgRef}
            className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
          >
            <img
              src={product.images[0]?.src}
              alt={product.images[0]?.alt ?? product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Soft inner light + bottom vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -90px 90px -50px rgba(26,24,20,0.18)",
            }}
          />

          {/* Category eyebrow */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-cream/80 px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-ink/65 backdrop-blur-sm">
              {product.category}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4 px-1">
        <div className="min-w-0">
          <h3 className="font-editorial text-2xl tracking-tight text-ink">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] text-ink/60">
            {product.poem}
          </p>
        </div>
        <div className="shrink-0 text-[13px] tracking-[0.18em] text-ink/80">
          {formatPrice(product.price, product.currency)}
        </div>
      </div>
    </Link>
  );
}
