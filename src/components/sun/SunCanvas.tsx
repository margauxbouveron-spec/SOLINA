"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector2 } from "three";
import { Sun } from "./Sun";
import { useSunStore } from "./useSunStore";

/**
 * Persistent global Three canvas — the cinematic stage.
 * Pointer & scroll listeners feed the zustand store + CSS vars on <html>.
 *
 * Bloom + chromatic aberration + vignette are gated by a high-quality flag
 * (>=768px AND no reduced-motion).
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
        camera={{ position: [0, 0, 4.2], fov: 38, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <Sun />
        </Suspense>
        {highQuality && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={1.9}
              luminanceThreshold={0.22}
              luminanceSmoothing={0.7}
              kernelSize={KernelSize.HUGE}
              mipmapBlur
              blendFunction={BlendFunction.SCREEN}
            />
            <ChromaticAberration
              offset={new Vector2(0.0009, 0.0009)}
              radialModulation={true}
              modulationOffset={0.6}
              blendFunction={BlendFunction.NORMAL}
            />
            <Vignette eskil={false} offset={0.3} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
