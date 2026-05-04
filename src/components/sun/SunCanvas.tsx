"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { useEffect, useRef, useState } from "react";
import { DustParticles } from "./DustParticles";
import { Sun } from "./Sun";
import { useSunStore } from "./useSunStore";

/**
 * Persistent global Three canvas mounted in the root layout.
 * Pointer & scroll listeners feed the zustand store + CSS vars on <html>.
 *
 * Bloom + dust particles are gated by a "high quality" flag — disabled
 * on small viewports / low DPR / reduced-motion preference for budget.
 */
export function SunCanvas() {
  const setPointer = useSunStore((s) => s.setPointer);
  const setScroll = useSunStore((s) => s.setScroll);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highQuality, setHighQuality] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const wide = window.innerWidth >= 768;
    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setHighQuality(wide && motion && dpr >= 1);

    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);

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
        {highQuality && <DustParticles />}
        {highQuality && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={1.6}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.7}
              kernelSize={KernelSize.LARGE}
              mipmapBlur
              blendFunction={BlendFunction.SCREEN}
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
