"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";
import { Cta } from "@/components/ui/Cta";

/**
 * Enyo-style hero — massive serif typography wrapping behind the
 * iridescent sun, with a corner badge and sub-block at the bottom.
 * The sun itself is rendered by the global SunCanvas one layer above.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 3.4, defaults: { ease: "power3.out" } });
      tl.from(".hero-badge", { autoAlpha: 0, y: -12, duration: 0.9 }, 0)
        .from(".hero-word", {
          autoAlpha: 0,
          y: 36,
          filter: "blur(14px)",
          duration: 1.4,
          stagger: 0.12,
        }, 0.1)
        .from(".hero-meta", {
          autoAlpha: 0,
          y: 16,
          duration: 0.9,
          stagger: 0.1,
        }, 0.6)
        .from(".hero-scroll", { autoAlpha: 0, y: 8, duration: 0.8 }, 0.9);
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden gutter pb-16 pt-32"
    >
      {/* Top-right corner badge — awwwards-style square stamp */}
      <div className="hero-badge absolute right-4 top-24 z-20 md:right-8 md:top-28">
        <div className="flex h-32 w-12 flex-col items-center justify-between bg-cream py-4 text-night md:h-40 md:w-16 md:py-5">
          <span className="font-editorial text-xl italic md:text-2xl">w.</span>
          <span
            className="text-[9px] uppercase tracking-[0.42em] md:text-[10px]"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Édition MMXXVI
          </span>
        </div>
      </div>

      {/* Massive type — wraps behind the sphere; the sphere sits centered
          in the global SunCanvas (z-[3]) and the text is at z-[5] but
          mid-line is invisible thanks to mix-blend with night. */}
      <div className="relative z-[5] mx-auto w-full max-w-[1700px] flex-1 flex flex-col justify-center">
        <h1 className="headline text-cream">
          <span
            className="hero-word block text-[18vw] leading-[0.84] md:text-[16vw] lg:text-[15vw] xl:text-[14vw]"
          >
            capturer
          </span>
          <span
            className="hero-word block pl-[2vw] text-right font-editorial italic text-[18vw] leading-[0.84] md:text-[16vw] lg:text-[15vw] xl:text-[14vw]"
          >
            la&nbsp;lumière
          </span>
        </h1>
      </div>

      {/* Bottom-row meta — eyebrow, short copy, CTA */}
      <div className="relative z-20 mx-auto grid w-full max-w-[1700px] grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="hero-meta md:col-span-3">
          <div className="eyebrow text-cream/45">Maison · Méditerranée</div>
        </div>
        <p className="hero-meta max-w-md text-base leading-relaxed text-cream/70 md:col-span-5">
          Une orfèvrerie née du soleil, de la mer et de la pierre. Chaque pièce
          retient un peu d’été — un éclat, une chaleur, un silence.
        </p>
        <div className="hero-meta flex items-center gap-5 md:col-span-4 md:justify-end">
          <Cta href="/collection">Voir la collection</Cta>
          <Link
            href="/about"
            className="text-[11px] uppercase tracking-[0.34em] text-cream/55 transition-colors duration-500 hover:text-cream"
          >
            La maison
          </Link>
        </div>
      </div>

      {/* Subtle scroll cue */}
      <div className="hero-scroll absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-[9px] uppercase tracking-[0.5em] text-cream/35">
        défilez
      </div>
    </section>
  );
}
