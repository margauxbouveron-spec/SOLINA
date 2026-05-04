import { Cta } from "@/components/ui/Cta";

export const metadata = {
  title: "Maison — SOLINA",
  description:
    "SOLINA est née du soleil, de la mer et de la pierre. Une maison de bijoux méditerranéenne.",
};

const moments = [
  {
    label: "Pierre",
    image: "https://picsum.photos/seed/solina-mood-pierre-chaude/1200/1500",
    span: "md:col-span-7 md:row-span-2",
    aspect: "aspect-[4/5]",
  },
  {
    label: "Citron",
    image: "https://picsum.photos/seed/solina-mood-citron-amalfi/900/700",
    span: "md:col-span-5 md:row-span-1",
    aspect: "aspect-[4/3]",
  },
  {
    label: "Peau",
    image: "https://picsum.photos/seed/solina-mood-peau-soleil/900/1200",
    span: "md:col-span-5 md:row-span-1",
    aspect: "aspect-[3/4]",
  },
  {
    label: "Mer",
    image: "https://picsum.photos/seed/solina-mood-mer-large/1600/900",
    span: "md:col-span-12 md:row-span-1",
    aspect: "aspect-[16/8]",
  },
];

export default function AboutPage() {
  return (
    <article className="pt-32">
      <header className="gutter mx-auto max-w-[1600px]">
        <div className="eyebrow text-ink/55">La Maison</div>
        <h1 className="headline mt-8 max-w-5xl text-[14vw] leading-[0.92] md:text-[10vw] lg:text-[160px]">
          Née du soleil,<br />
          <em className="font-editorial italic text-ink/65">de la mer et de la pierre.</em>
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
        <div className="md:col-span-7 md:col-start-7 md:pl-12">
          <p className="max-w-[60ch] text-base leading-relaxed text-ink/70">
            Nous dessinons et fabriquons nos pièces depuis un atelier baigné de
            lumière, à quelques kilomètres de la côte. Nous travaillons l’or 18
            carats à la main, en petites séries, pour qu’aucune pièce ne soit
            tout à fait identique. Nos pierres sont choisies une à une — citrines,
            lapis, nacres, perles baroques. Notre signature est une lumière, plus
            qu’une forme.
          </p>
          <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-ink/70">
            Chaque collection est pensée comme un souvenir d’été : un instant
            précis où la chaleur, la matière et la peau s’accordent. Nous croyons
            au luxe silencieux, à la lenteur, à la nuance. Nous croyons surtout
            qu’un bijou bien porté est un peu de soleil que l’on garde.
          </p>
        </div>
      </section>

      {/* Asymmetric editorial moodboard — gapless bento (Pierre tall + Citron + Peau + Mer wide) */}
      <section className="gutter mx-auto mt-32 grid max-w-[1600px] grid-flow-dense auto-rows-[minmax(180px,_auto)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
        {moments.map((m, i) => (
          <figure
            key={m.label}
            className={`group relative overflow-hidden bg-sand/30 ${m.aspect} ${m.span}`}
            style={{ animation: `rise 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}
          >
            <img
              src={m.image}
              alt={`Inspiration éditoriale — ${m.label}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-100 object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(26,24,20,0) 55%, rgba(26,24,20,0.35) 100%)",
              }}
            />
            <figcaption className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.42em] text-cream/90">
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
              src="https://picsum.photos/seed/solina-atelier-orfevre-mains/1800/1100"
              alt="L’atelier SOLINA — un orfèvre travaille l’or à la main"
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
          <p className="mt-8 max-w-[55ch] text-base leading-relaxed text-ink/70">
            Chaque pièce passe par les mains de trois artisans. La fonte, la
            mise en forme, le polissage. Une journée, parfois trois.
          </p>
          <div className="mt-10">
            <Cta href="/collection">Explorer la collection</Cta>
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
