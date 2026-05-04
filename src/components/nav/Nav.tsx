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
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-700 ease-silk ${
        scrolled
          ? "backdrop-blur-md bg-cream/65 border-b border-ink/5"
          : "bg-transparent"
      }`}
    >
      <nav className="gutter mx-auto flex h-16 max-w-[1600px] items-center justify-between">
        <Link
          href="/"
          aria-label="SOLINA — accueil"
          className="text-[13px] tracking-[0.42em] uppercase font-medium text-ink"
        >
          SOLINA
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`relative text-[11px] tracking-[0.34em] uppercase transition-colors duration-500 ${
                    active ? "text-ink" : "text-ink/60 hover:text-ink"
                  }`}
                >
                  {l.label}
                  {l.href === "/cart" && count > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] tracking-normal text-cream">
                      {count}
                    </span>
                  )}
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-px origin-left bg-ink transition-transform duration-700 ease-silk ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile cart shortcut */}
        <Link
          href="/cart"
          className="text-[11px] tracking-[0.34em] uppercase md:hidden"
        >
          Panier {count > 0 ? `(${count})` : ""}
        </Link>
      </nav>
    </header>
  );
}
