"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

const links = [
  { href: "/", label: "Index" },
  { href: "/collection", label: "Collection" },
  { href: "/about", label: "Maison" },
  { href: "/cart", label: "Panier" },
];

/**
 * Hamburger top-left + center wordmark + cart shortcut top-right.
 * Click the hamburger → full-screen glass overlay with staggered links.
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));

  // Lock body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gutter pt-5">
        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="group relative h-12 w-12 rounded-2xl bg-cream/[0.06] ring-1 ring-inset ring-cream/15 backdrop-blur-md transition-all duration-500 hover:bg-cream/[0.10] hover:ring-cream/30"
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 top-0 block h-px w-5 bg-cream transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 bottom-0 block h-px w-5 bg-cream transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </span>
        </button>

        {/* Wordmark — center */}
        <Link
          href="/"
          aria-label="SOLINA — accueil"
          className="font-editorial text-2xl italic tracking-tight text-cream md:text-[28px]"
        >
          solina
        </Link>

        {/* Cart shortcut */}
        <Link
          href="/cart"
          className="flex h-12 items-center gap-2 rounded-full bg-cream/[0.06] px-4 text-[10.5px] uppercase tracking-[0.32em] text-cream ring-1 ring-inset ring-cream/15 backdrop-blur-md transition-all duration-500 hover:bg-cream/[0.10] hover:ring-cream/30"
        >
          <span className="hidden sm:inline">Panier</span>
          <span aria-hidden className="sm:hidden">⌥</span>
          {count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[9px] tracking-normal text-night">
              {count}
            </span>
          )}
        </Link>
      </header>

      {/* Slide-down full overlay */}
      <div
        className={`fixed inset-0 z-[45] flex items-center justify-center transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-night/85 backdrop-blur-2xl" />
        <nav className="relative z-10 flex flex-col items-center gap-6 text-center">
          {links.map((l, i) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  transitionDelay: open ? `${120 + i * 70}ms` : "0ms",
                }}
                className={`headline text-[14vw] leading-[0.95] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-[96px] ${
                  open ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-md"
                } ${active ? "text-cream" : "text-cream/55 hover:text-cream"}`}
              >
                {l.label}
                {l.href === "/cart" && count > 0 && (
                  <span className="ml-3 align-middle text-[14px] tracking-[0.3em] text-gold">
                    · {count}
                  </span>
                )}
              </Link>
            );
          })}
          <div
            style={{
              transitionDelay: open ? `${120 + links.length * 70 + 80}ms` : "0ms",
            }}
            className={`mt-10 text-[10px] uppercase tracking-[0.42em] text-cream/45 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            Capturer la lumière — édition MMXXVI
          </div>
        </nav>
      </div>
    </>
  );
}
