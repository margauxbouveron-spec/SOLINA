import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter mx-auto flex min-h-[80svh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="eyebrow text-ink/55">404</div>
      <h1 className="headline mt-6 text-[14vw] leading-[0.95] md:text-[120px]">
        Égarés, comme un rayon.
      </h1>
      <p className="mt-6 text-base text-ink/65">
        La page que vous cherchez n’existe plus ou n’a jamais existé.
      </p>
      <div className="mt-10">
        <Link href="/" className="cta">
          Retour à la lumière
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
