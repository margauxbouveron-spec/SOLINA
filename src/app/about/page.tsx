import Link from "next/link";

export const metadata = {
  title: "Maison — SOLINA",
  description:
    "SOLINA est née du soleil, de la mer et de la pierre. Une maison de bijoux méditerranéenne.",
};

const moments = [
  {
    label: "Pierre",
    image:
      "https://images.unsplash.com/photo-1504387828636-abeb50778c0c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Citron",
    image:
      "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Peau",
    image:
      "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?auto=format&fit=crop&w=1400&q=80",
  },
  {
    label: "Mer",
    image:
      "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function AboutPage() {
  return (
    <article className="pt-32">
      <header className="gutter mx-auto max-w-[1600px]">
        <div className="eyebrow text-ink/55">La Maison</div>
        <h1 className="headline mt-8 max-w-5xl text-[14vw] leading-[0.92] md:text-[10vw] lg:text-[160px]">
          Née du soleil,<br />
          <em className="not-italic text-ink/65">de la mer et de la pierre.</em>
        </h1>
      </header>

      <section className="gutter mx-auto mt-32 grid max-w-[1600px] gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="eyebrow text-ink/55">Origine</div>
          <p className="mt-8 font-editorial text-3xl leading-snug text-ink/85 md:text-4xl">
            Solina est un prénom — celui d’une grand-mère qui marchait pieds nus
            sur les pierres chaudes, chaque été, en Méditerranée.
          </p>
        </div>
        <div className="md:col-span-7 md:col-start-7">
          <p className="text-base leading-relaxed text-ink/70">
            Nous dessinons et fabriquons nos pièces depuis un atelier baigné de
            lumière, à quelques kilomètres de la côte. Nous travaillons l’or 18
            carats à la main, en petites séries, pour qu’aucune pièce ne soit
            tout à fait identique. Nos pierres sont choisies une à une — citrines,
            lapis, nacres, perles baroques. Notre signature est une lumière, plus
            qu’une forme.
          </p>
          <p className="mt-6 text-base leading-relaxed text-ink/70">
            Chaque collection est pensée comme un souvenir d’été : un instant
            précis où la chaleur, la matière et la peau s’accordent. Nous croyons
            au luxe silencieux, à la lenteur, à la nuance. Nous croyons surtout
            qu’un bijou bien porté est un peu de soleil que l’on garde.
          </p>
        </div>
      </section>

      {/* Editorial 4-up moodboard */}
      <section className="gutter mx-auto mt-32 grid max-w-[1600px] grid-cols-2 gap-4 md:grid-cols-4">
        {moments.map((m, i) => (
          <figure
            key={m.label}
            className="relative aspect-[3/4] overflow-hidden bg-sand/30"
            style={{ animation: `rise 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s both` }}
          >
            <img
              src={m.image}
              alt={m.label}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <figcaption className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.42em] text-cream/85 mix-blend-difference">
              {m.label}
            </figcaption>
          </figure>
        ))}
      </section>

      {/* Atelier */}
      <section
        id="atelier"
        className="gutter mx-auto mt-32 grid max-w-[1600px] gap-16 md:grid-cols-12 md:items-end"
      >
        <div className="md:col-span-7">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1800&q=80"
              alt="L’atelier SOLINA"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="eyebrow text-ink/55">L’atelier</div>
          <h2 className="headline mt-6 text-[10vw] leading-[0.95] md:text-[64px]">
            Patience.
          </h2>
          <p className="mt-8 text-base leading-relaxed text-ink/70">
            Chaque pièce passe par les mains de trois artisans. La fonte, la
            mise en forme, le polissage. Une journée, parfois trois.
          </p>
          <div className="mt-10">
            <Link href="/collection" className="cta">
              Explorer la collection
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="gutter mx-auto mt-40 max-w-3xl text-center">
        <p className="font-editorial text-3xl leading-snug text-ink/85 md:text-4xl">
          “Capturer la lumière, ce n’est pas la posséder.<br />
          C’est la rendre, plus belle.”
        </p>
        <div className="mt-6 text-[10px] uppercase tracking-[0.42em] text-ink/45">
          — SOLINA
        </div>
      </section>
    </article>
  );
}
