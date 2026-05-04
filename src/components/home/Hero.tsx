"use client";

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Cta } from "@/components/ui/Cta";

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 3.5, defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { autoAlpha: 0, y: 10, duration: 0.9 })
        .from(".hero-line", { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.12 }, "<0.1")
        .from(".hero-cta", { autoAlpha: 0, y: 14, duration: 0.9 }, "<0.4")
        .from(".hero-scroll", { autoAlpha: 0, y: 8, duration: 0.8 }, "<0.2");
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden gutter pb-20 pt-32"
    >
      {/* Subtle horizon — hand-drawn line of light at golden hour */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(246,241,232,0) 40%, rgba(232,217,197,0.45) 78%, rgba(232,217,197,0.85) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px]">
        <div className="hero-eyebrow eyebrow text-ink/55">Édition d’été — MMXXVI</div>
        <h1 className="headline mt-8 text-[18vw] leading-[0.85] text-ink sm:text-[14vw] md:text-[12vw] lg:text-[180px]">
          <span className="hero-line block">SOLINA</span>
        </h1>
        <p className="mt-10 max-w-md text-base leading-relaxed text-ink/75 md:text-lg">
          <span className="hero-line block">
            Une maison de bijoux née du soleil,
          </span>
          <span className="hero-line block">de la mer et de la pierre.</span>
        </p>

        <div className="hero-cta mt-12 flex items-center gap-6">
          <Cta href="/collection">Découvrir la collection</Cta>
          <Link
            href="/about"
            className="text-[11px] uppercase tracking-[0.34em] text-ink/65 transition-colors duration-500 hover:text-ink"
          >
            La maison
          </Link>
        </div>
      </div>

      <div className="hero-scroll absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.42em] text-ink/45">
        <div className="flex flex-col items-center gap-2">
          <span>défilez</span>
          <span className="block h-10 w-px animate-breathe bg-ink/30" />
        </div>
      </div>
    </section>
  );
}
