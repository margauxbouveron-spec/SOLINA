import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-ink/10 bg-cream/40 backdrop-blur-sm">
      <div className="gutter mx-auto grid max-w-[1600px] gap-12 py-16 md:grid-cols-4">
        <div>
          <div className="text-[13px] tracking-[0.42em] uppercase">SOLINA</div>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink/65">
            Née du soleil, de la mer et de la pierre. Une maison de bijoux
            méditerranéens.
          </p>
        </div>

        <div>
          <div className="eyebrow text-ink/55">Maison</div>
          <ul className="mt-5 space-y-2 text-sm text-ink/75">
            <li><Link href="/about" className="hover:text-ink">Notre histoire</Link></li>
            <li><Link href="/collection" className="hover:text-ink">Collection</Link></li>
            <li><Link href="/about#atelier" className="hover:text-ink">Atelier</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-ink/55">Service</div>
          <ul className="mt-5 space-y-2 text-sm text-ink/75">
            <li><a className="hover:text-ink" href="#">Livraison</a></li>
            <li><a className="hover:text-ink" href="#">Entretien</a></li>
            <li><a className="hover:text-ink" href="#">Sur-mesure</a></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-ink/55">Lettres</div>
          <p className="mt-5 text-sm text-ink/65">
            Recevez nos saisons, sans fréquence.
          </p>
          <form className="mt-4 flex border-b border-ink/30">
            <input
              type="email"
              placeholder="votre adresse"
              className="w-full bg-transparent py-2 text-sm placeholder:text-ink/40 focus:outline-none"
              aria-label="Adresse e-mail"
            />
            <button
              type="submit"
              className="text-[10px] tracking-[0.32em] uppercase text-ink/70 hover:text-ink"
            >
              ↗
            </button>
          </form>
        </div>
      </div>

      <div className="gutter mx-auto flex max-w-[1600px] items-center justify-between border-t border-ink/10 py-6 text-[10px] uppercase tracking-[0.32em] text-ink/45">
        <span>© Solina Bijoux — {new Date().getFullYear()}</span>
        <span>Méditerranée</span>
      </div>
    </footer>
  );
}
