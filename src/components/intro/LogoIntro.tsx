"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useSunStore } from "../sun/useSunStore";

const STORAGE_KEY = "solina:intro-seen";

/**
 * Cinematic logo sequence — runs once per session.
 *
 * Steps (≈ 3.2s):
 *  1. cream void
 *  2. golden point appears (centered)
 *  3. expands into a luminous orb with rays
 *  4. wordmark fades in, the orb slides into the "O" of SOLINA
 *  5. veil lifts, orb is released to the global Sun
 */
export function LogoIntro() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const oRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const [skip, setSkip] = useState(false);
  const setReady = useSunStore((s) => s.setReady);
  const setPhase = useSunStore((s) => s.setPhase);
  const setScale = useSunStore((s) => s.setScale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setSkip(true);
  }, []);

  useGSAP(
    () => {
      if (skip) {
        // Skip path — show site immediately, mark sun ready
        gsap.set(overlayRef.current, { autoAlpha: 0 });
        setReady(true);
        setPhase("hero");
        setScale(1);
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          setReady(true);
          setPhase("hero");
          sessionStorage.setItem(STORAGE_KEY, "1");
        },
      });

      gsap.set(overlayRef.current, { autoAlpha: 1 });
      gsap.set(orbRef.current, { scale: 0, opacity: 0 });
      gsap.set(raysRef.current, { scale: 0.4, opacity: 0, rotate: 0 });
      gsap.set(wordRef.current, { autoAlpha: 0, y: 18 });
      gsap.set(taglineRef.current, { autoAlpha: 0, y: 10 });

      // 1 — point of light
      tl.to(orbRef.current, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0.2)
        .to(orbRef.current, { scale: 1, duration: 1.0, ease: "expo.out" }, 0.2)

        // 2 — rays bloom
        .to(
          raysRef.current,
          { opacity: 1, scale: 1, rotate: 35, duration: 1.4, ease: "power3.out" },
          0.5
        )

        // 3 — wordmark rises
        .to(wordRef.current, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.2)

        // 4 — orb migrates to the "O"
        .to(
          orbRef.current,
          {
            duration: 1.0,
            ease: "expo.inOut",
            onUpdate: () => {
              if (!oRef.current || !orbRef.current) return;
              const oRect = oRef.current.getBoundingClientRect();
              const ox = oRect.left + oRect.width / 2;
              const oy = oRect.top + oRect.height / 2;
              const cx = window.innerWidth / 2;
              const cy = window.innerHeight / 2;
              gsap.set(orbRef.current, { x: ox - cx, y: oy - cy, scale: 0.42 });
            },
          },
          1.6
        )

        // 5 — tagline
        .to(taglineRef.current, { autoAlpha: 1, y: 0, duration: 0.9 }, 2.2)

        // 6 — veil dissolves; sun is released
        .to(overlayRef.current, { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" }, 2.7);
    },
    { dependencies: [skip] }
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-cream"
      aria-hidden={skip}
    >
      {/* Rays — pure CSS conic gradient, masked by orb */}
      <div
        ref={raysRef}
        className="pointer-events-none absolute h-[140vmin] w-[140vmin] mix-blend-screen opacity-0"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(212,175,55,0.0) 0deg, rgba(255,225,150,0.55) 6deg, rgba(212,175,55,0.0) 14deg, rgba(255,225,150,0.4) 22deg, rgba(212,175,55,0.0) 30deg, rgba(255,225,150,0.5) 42deg, rgba(212,175,55,0.0) 56deg, rgba(255,225,150,0.35) 70deg, rgba(212,175,55,0.0) 82deg, rgba(255,225,150,0.55) 94deg, rgba(212,175,55,0.0) 110deg, rgba(255,225,150,0.4) 128deg, rgba(212,175,55,0.0) 146deg, rgba(255,225,150,0.5) 168deg, rgba(212,175,55,0.0) 184deg, rgba(255,225,150,0.45) 210deg, rgba(212,175,55,0.0) 226deg, rgba(255,225,150,0.4) 250deg, rgba(212,175,55,0.0) 266deg, rgba(255,225,150,0.5) 290deg, rgba(212,175,55,0.0) 308deg, rgba(255,225,150,0.4) 330deg, rgba(212,175,55,0.0) 360deg)",
          maskImage:
            "radial-gradient(circle at center, black 14%, rgba(0,0,0,0.6) 30%, transparent 65%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 14%, rgba(0,0,0,0.6) 30%, transparent 65%)",
        }}
      />

      {/* Orb */}
      <div
        ref={orbRef}
        className="pointer-events-none absolute h-[22vmin] w-[22vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, #FFF6D0 0%, #FFE39A 30%, #D4AF37 65%, rgba(212,175,55,0) 80%)",
          boxShadow:
            "0 0 60px 12px rgba(255,225,150,0.55), 0 0 180px 40px rgba(212,175,55,0.25)",
        }}
      />

      {/* Wordmark — the "O" is targeted by the orb migration */}
      <div
        ref={wordRef}
        className="relative z-10 flex flex-col items-center text-ink"
      >
        <h1 className="headline text-[12vmin] leading-none tracking-[-0.02em]">
          S
          <span ref={oRef} className="relative inline-block">
            O
          </span>
          LINA
        </h1>
        <div
          ref={taglineRef}
          className="mt-6 text-[11px] tracking-[0.42em] uppercase text-ink/70"
        >
          Capturer la lumière
        </div>
      </div>
    </div>
  );
}
