"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Sun } from "./Sun";
import { useSunStore } from "./useSunStore";

/**
 * Persistent global Three canvas mounted in the root layout.
 * Sits above the cream background, below the page content (z-index controlled).
 *
 * - Pointer & scroll listeners feed the zustand store (single source of truth).
 * - The same store also writes CSS vars on <html> so DOM elements can react to the sun.
 */
export function SunCanvas() {
  const setPointer = useSunStore((s) => s.setPointer);
  const setScroll = useSunStore((s) => s.setScroll);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);

      // CSS var bridge — keeps DOM lighting in sync with the WebGL sun
      document.documentElement.style.setProperty("--sun-x", `${e.clientX}px`);
      document.documentElement.style.setProperty(
        "--sun-y",
        `${Math.max(80, e.clientY * 0.6 + window.innerHeight * 0.18)}px`
      );
    };

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const s = Math.min(1, Math.max(0, window.scrollY / max));
      setScroll(s);
      // Move CSS sun downward as user scrolls (sunset)
      const cssY = window.innerHeight * (0.18 + s * 0.7);
      document.documentElement.style.setProperty("--sun-y", `${cssY}px`);
      document.documentElement.style.setProperty(
        "--sun-intensity",
        `${(1 - s * 0.35).toFixed(3)}`
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [setPointer, setScroll]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[3]"
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 220, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.6} />
        <Sun />
      </Canvas>
    </div>
  );
}
