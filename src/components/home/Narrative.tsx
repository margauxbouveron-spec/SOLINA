"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { Cta } from "@/components/ui/Cta";
import { Water } from "../water/Water";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const chapters = [
  {
    eyebrow: "I — La pierre",
    title: "Patience minérale",
    body: "Calcaire, sable, lin. Les matières du sud, polies par le temps. Chaque bijou retient un peu de leur silence.",
    image: "https://picsum.photos/seed/solina-pierre-calcaire-mediterranee/1800/2200",
  },
  {
    eyebrow: "II — La mer",
    title: "Lumière liquide",
    body: "L’or fond, la mer scintille. Nos pièces capturent ce point précis où la lumière devient eau.",
    image: "https://picsum.photos/seed/solina-mer-lumiere-or/1800/2200",
  },
  {
    eyebrow: "III — Le soleil",
    title: "Heure dorée",
    body: "Toute notre orfèvrerie vise un seul moment : celui où le soleil se penche, et où la peau s’embrase.",
    image: "https://picsum.photos/seed/solina-golden-hour-peau/1800/2200",
  },
];

export function Narrative() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const sections = gsap.utils.toArray<HTMLElement>(".chapter");
      sections.forEach((sec) => {
        const img = sec.querySelector(".chapter-img");
        const txt = sec.querySelectorAll(".chapter-fade");

        gsap.fromTo(
          img,
          { scale: 1.15, autoAlpha: 0.4 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sec,
              start: "top 90%",
              end: "bottom 20%",
              scrub: 0.6,
            },
          }
        );

        gsap.fromTo(
          txt,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 70%" },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      {/* Water transition strip */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <Water />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream via-transparent to-cream/80" />
        <div className="absolute inset-0 z-10 flex items-center justify-center gutter">
          <p className="headline max-w-3xl text-center text-[6vw] leading-[1.05] text-cream md:text-[44px]">
            “La lumière, je l’ai toujours portée comme un bijou.”
          </p>
        </div>
      </section>

      {chapters.map((c, i) => (
        <section
          key={c.eyebrow}
          className="chapter gutter relative mx-auto grid max-w-[1600px] items-center gap-16 py-32 md:grid-cols-12"
        >
          <div
            className={`relative aspect-[4/5] overflow-hidden md:col-span-7 ${
              i % 2 === 1 ? "md:order-2" : ""
            }`}
          >
            <img
              src={c.image}
              alt={c.title}
              loading="lazy"
              className="chapter-img absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(246,241,232,0.0) 60%, rgba(246,241,232,0.55) 100%)",
              }}
            />
          </div>

          <div className={`md:col-span-5 ${i % 2 === 1 ? "md:order-1" : ""}`}>
            <div className="chapter-fade eyebrow text-ink/55">{c.eyebrow}</div>
            <h2 className="chapter-fade headline mt-6 text-[10vw] leading-[0.95] md:text-[64px]">
              {c.title}
            </h2>
            <p className="chapter-fade mt-8 max-w-md text-base leading-relaxed text-ink/70">
              {c.body}
            </p>
          </div>
        </section>
      ))}

      {/* Closing CTA — minimal and confident */}
      <section className="gutter mx-auto max-w-[1600px] py-32 text-center">
        <div className="eyebrow text-ink/55">La collection</div>
        <h2 className="headline mx-auto mt-8 max-w-3xl text-[10vw] leading-[0.95] md:text-[88px]">
          Chaque bijou est un fragment du soleil.
        </h2>
        <div className="mt-12 flex justify-center">
          <Cta href="/collection">Voir toutes les pièces</Cta>
        </div>
      </section>
    </div>
  );
}
