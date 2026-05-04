import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-cream/10 bg-night/40 backdrop-blur-sm">
      <div className="gutter mx-auto grid max-w-[1600px] gap-12 py-16 md:grid-cols-4">
        <div>
          <div className="text-[13px] tracking-[0.42em] uppercase">SOLINA</div>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/65">
            Née du soleil, de la mer et de la pierre. Une maison de bijoux
            méditerranéens.
          </p>
        </div>

        <div>
          <div className="eyebrow text-cream/55">Maison</div>
          <ul className="mt-5 space-y-2 text-sm text-cream/75">
            <li><Link href="/about" className="hover:text-cream">Notre histoire</Link></li>
            <li><Link href="/collection" className="hover:text-cream">Collection</Link></li>
            <li><Link href="/about#atelier" className="hover:text-cream">Atelier</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-cream/55">Service</div>
          <ul className="mt-5 space-y-2 text-sm text-cream/75">
            <li><a className="hover:text-cream" href="#">Livraison</a></li>
            <li><a className="hover:text-cream" href="#">Entretien</a></li>
            <li><a className="hover:text-cream" href="#">Sur-mesure</a></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-cream/55">Lettres</div>
          <p className="mt-5 text-sm text-cream/65">
            Recevez nos saisons, sans fréquence.
          </p>
          <form className="mt-4 flex border-b border-cream/30">
            <input
              type="email"
              placeholder="votre adresse"
              className="w-full bg-transparent py-2 text-sm placeholder:text-cream/40 focus:outline-none"
              aria-label="Adresse e-mail"
            />
            <button
              type="submit"
              className="text-[10px] tracking-[0.32em] uppercase text-cream/70 hover:text-cream"
            >
              ↗
            </button>
          </form>
        </div>
      </div>

      <div className="gutter mx-auto flex max-w-[1600px] items-center justify-between border-t border-cream/10 py-6 text-[10px] uppercase tracking-[0.32em] text-cream/45">
        <span>© Solina Bijoux — {new Date().getFullYear()}</span>
        <span>Méditerranée</span>
      </div>
    </footer>
  );
}
