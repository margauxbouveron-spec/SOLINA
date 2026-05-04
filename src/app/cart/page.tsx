"use client";

import Link from "next/link";
import { Cta } from "@/components/ui/Cta";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotal());
  const currency = items[0]?.currency ?? "EUR";

  return (
    <section className="gutter mx-auto max-w-[1400px] pt-32">
      <header>
        <div className="eyebrow text-cream/55">Panier</div>
        <h1 className="headline mt-6 text-[10vw] leading-[0.95] md:text-[80px]">
          Votre sélection
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="mt-20 border-t border-cream/15 py-20 text-center">
          <p className="font-editorial text-2xl text-cream/70">
            Le panier est encore une page blanche.
          </p>
          <div className="mt-10 inline-flex">
            <Cta href="/collection">Voir la collection</Cta>
          </div>
        </div>
      ) : (
        <div className="mt-16 grid gap-16 lg:grid-cols-12">
          <ul className="divide-y divide-cream/10 border-y border-cream/15 lg:col-span-8">
            {items.map((item) => (
              <li key={item.id} className="grid grid-cols-12 items-center gap-4 py-8">
                <div className="col-span-3 sm:col-span-2">
                  <div className="aspect-square overflow-hidden bg-shore/40">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="col-span-9 sm:col-span-5">
                  <Link
                    href={`/product/${item.handle}`}
                    className="font-editorial text-2xl hover:text-cream/70"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-cream/55">
                    {formatPrice(item.price, item.currency)} l’unité
                  </div>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <div className="inline-flex items-center border border-cream/20">
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      className="px-3 py-2 text-cream/65 hover:text-cream"
                      aria-label="Diminuer"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="px-3 py-2 text-cream/65 hover:text-cream"
                      aria-label="Augmenter"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="col-span-6 text-right sm:col-span-3">
                  <div className="font-editorial text-2xl">
                    {formatPrice(item.price * item.qty, item.currency)}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="mt-1 text-[10px] uppercase tracking-[0.32em] text-cream/45 hover:text-cream"
                  >
                    Retirer
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:col-span-4">
            <div className="border border-cream/15 p-8">
              <div className="eyebrow text-cream/55">Résumé</div>
              <dl className="mt-6 space-y-3 text-sm text-cream/70">
                <div className="flex justify-between">
                  <dt>Sous-total</dt>
                  <dd>{formatPrice(subtotal, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Livraison</dt>
                  <dd>Offerte</dd>
                </div>
                <div className="flex justify-between border-t border-cream/15 pt-4 font-editorial text-2xl text-cream">
                  <dt>Total</dt>
                  <dd>{formatPrice(subtotal, currency)}</dd>
                </div>
              </dl>

              <div className="mt-8">
                <Cta href="/checkout" fullWidth arrow="ne">
                  Passer la commande
                </Cta>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-cream/50">
                Paiement sécurisé · Écrin offert · Retour gratuit sous 30 jours
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
