"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const links = [
  { href: "/collection", label: "Collection" },
  { href: "/about", label: "Maison" },
  { href: "/cart", label: "Panier" },
];

/**
 * Floating glass-pill navigation.
 * Detached from the top edge, centered, with hairline + ultra-soft shadow.
 * Becomes more opaque + tightens on scroll.
 */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled ? "top-3" : "top-5"
      }`}
    >
      <nav
        className={`pointer-events-auto flex items-center gap-2 rounded-full px-2 py-2 ring-1 ring-inset transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "bg-cream/75 ring-ink/10 backdrop-blur-xl"
            : "bg-cream/30 ring-ink/[0.06] backdrop-blur-md"
        }`}
        style={{
          boxShadow: scrolled
            ? "0 18px 40px -28px rgba(31,24,20,0.18), inset 0 1px 0 rgba(255,255,255,0.45)"
            : "0 14px 30px -28px rgba(31,24,20,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        <Link
          href="/"
          aria-label="SOLINA — accueil"
          className="rounded-full px-4 py-2 text-[12px] font-medium uppercase tracking-[0.42em] text-ink"
        >
          SOLINA
        </Link>

        <ul className="hidden items-center md:flex">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10.5px] uppercase tracking-[0.32em] transition-colors duration-500 ${
                    active ? "text-ink" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {l.label}
                  {l.href === "/cart" && count > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] tracking-normal text-cream">
                      {count}
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-full bg-ink/[0.06]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/cart"
          className="ml-1 rounded-full bg-ink/[0.06] px-3.5 py-2 text-[10.5px] uppercase tracking-[0.32em] text-ink md:hidden"
        >
          Panier{count > 0 ? ` · ${count}` : ""}
        </Link>
      </nav>
    </header>
  );
}
