"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cta } from "@/components/ui/Cta";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const currency = items[0]?.currency ?? "EUR";
  const [step, setStep] = useState<"form" | "thanks">("form");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this hands off to Shopify Storefront `checkoutCreate`
    // and redirects to `webUrl`. Here we simulate a quiet confirmation.
    setStep("thanks");
    clear();
    setTimeout(() => router.push("/"), 4000);
  };

  if (items.length === 0 && step === "form") {
    return (
      <section className="gutter mx-auto max-w-3xl pt-32 text-center">
        <h1 className="headline text-[10vw] md:text-[64px]">Panier vide</h1>
        <div className="mt-10 inline-flex">
          <Cta href="/collection">Retour à la collection</Cta>
        </div>
      </section>
    );
  }

  return (
    <section className="gutter mx-auto max-w-[1400px] pt-32">
      <header>
        <div className="eyebrow text-ink/55">Commande</div>
        <h1 className="headline mt-6 text-[10vw] leading-[0.95] md:text-[72px]">
          Finalisons en silence.
        </h1>
      </header>

      {step === "thanks" ? (
        <div className="mt-24 border-t border-ink/15 py-24 text-center">
          <p className="font-editorial text-3xl text-ink/85 md:text-4xl">
            Merci. Un peu de soleil est en route.
          </p>
          <p className="mt-4 text-sm text-ink/55">
            Vous recevrez un e-mail de confirmation sous quelques minutes.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-16 grid gap-16 lg:grid-cols-12"
        >
          <div className="space-y-10 lg:col-span-7">
            <Fieldset legend="Coordonnées">
              <Field label="E-mail" name="email" type="email" required />
            </Fieldset>

            <Fieldset legend="Livraison">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Prénom" name="first" required />
                <Field label="Nom" name="last" required />
              </div>
              <Field label="Adresse" name="address" required />
              <div className="grid gap-6 sm:grid-cols-3">
                <Field label="Code postal" name="postal" required />
                <Field label="Ville" name="city" required />
                <Field label="Pays" name="country" defaultValue="France" required />
              </div>
            </Fieldset>

            <Fieldset legend="Paiement">
              <Field label="N° de carte" name="card" placeholder="•••• •••• •••• ••••" required />
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Expiration" name="exp" placeholder="MM / AA" required />
                <Field label="Cryptogramme" name="cvc" required />
              </div>
            </Fieldset>
          </div>

          <aside className="lg:col-span-5">
            <div className="border border-ink/15 p-8">
              <div className="eyebrow text-ink/55">Votre commande</div>
              <ul className="mt-6 space-y-4 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between text-ink/75">
                    <span>
                      {i.name}
                      <span className="text-ink/45"> × {i.qty}</span>
                    </span>
                    <span>{formatPrice(i.price * i.qty, i.currency)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 space-y-2 border-t border-ink/15 pt-6 text-sm text-ink/70">
                <div className="flex justify-between">
                  <dt>Livraison</dt>
                  <dd>Offerte</dd>
                </div>
                <div className="flex justify-between font-editorial text-2xl text-ink">
                  <dt>Total</dt>
                  <dd>{formatPrice(subtotal, currency)}</dd>
                </div>
              </dl>
              <div className="mt-8">
                <Cta type="submit" fullWidth arrow="ne">
                  Confirmer la commande
                </Cta>
              </div>
            </div>
          </aside>
        </form>
      )}
    </section>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-6 border-t border-ink/15 pt-8">
      <legend className="eyebrow text-ink/55">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.32em] text-ink/55">
        {label}
      </span>
      <input
        {...props}
        className="mt-2 block w-full border-b border-ink/30 bg-transparent py-2 text-sm focus:border-ink focus:outline-none"
      />
    </label>
  );
}
