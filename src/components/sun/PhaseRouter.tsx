"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSunStore } from "./useSunStore";

/**
 * Watches the active route and pushes the matching narrative phase
 * to the global sun store. Light temperature & sun scale follow.
 */
export function PhaseRouter() {
  const pathname = usePathname();
  const setPhase = useSunStore((s) => s.setPhase);
  const setScale = useSunStore((s) => s.setScale);
  const setIntensity = useSunStore((s) => s.setIntensity);

  useEffect(() => {
    if (!pathname) return;
    if (pathname === "/") {
      setPhase("hero");
      setScale(1);
      setIntensity(1);
    } else if (pathname.startsWith("/collection")) {
      setPhase("collection");
      setScale(0.55);
      setIntensity(0.85);
    } else if (pathname.startsWith("/product")) {
      setPhase("product");
      setScale(0.4);
      setIntensity(0.7);
    } else if (pathname.startsWith("/about")) {
      setPhase("hero");
      setScale(0.7);
      setIntensity(0.9);
    } else if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) {
      setPhase("checkout");
      setScale(0.22);
      setIntensity(0.45);
    } else {
      setPhase("hero");
      setScale(0.8);
      setIntensity(0.9);
    }
  }, [pathname, setPhase, setScale, setIntensity]);

  return null;
}
