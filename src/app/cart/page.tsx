"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cta } from "@/components/ui/Cta";
import { useCart } from "@/lib/cart";
import { SHOPIFY_PUBLIC_DOMAIN_FALLBACK } from "@/lib/config";
import { formatPrice } from "@/lib/products";

/**
 * Extract the numeric variant ID from either a Shopify GID
 * ("gid://shopify/ProductVariant/45678901234") or a raw numeric ID
 * (already what products.json returns).
 */
function variantIdToNumeric(id: string): string | null {
  const gidMatch = id.match(/ProductVariant\/(\d+)/);
  if (gidMatch) return gidMatch[1];
  if (/^\d+$/.test(id)) return id;
  return null;
}

type ShopifyStatus = {
  shopifyConfigured: boolean;
  domain: string | null;
};

export default function CartPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal());
  const currency = items[0]?.currency ?? "EUR";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ShopifyStatus | null>(null);

  // Public override — set NEXT_PUBLIC_SHOPIFY_DOMAIN to enable a token-less
  // checkout via Shopify cart permalinks (works even when the server
  // doesn't have the Storefront API token). Falls back to the hardcoded
  // value in src/lib/config.ts.
  const publicDomain =
    process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || SHOPIFY_PUBLIC_DOMAIN_FALLBACK;

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => setStatus({ shopifyConfigured: false, domain: null }));
  }, []);

  const itemsWithVariant = items.filter((i) => i.variantId);
  const allHaveVariant = items.length > 0 && itemsWithVariant.length === items.length;

  const onCheckout = async () => {
    setError(null);

    const lines = itemsWithVariant.map((i) => ({
      variantId: i.variantId!,
      quantity: i.qty,
    }));

    // ─── Path A: server-side Storefront API + hosted checkout ───
    if (lines.length > 0) {
      setLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines }),
        });

        if (res.ok) {
          const { checkoutUrl } = (await res.json()) as { checkoutUrl?: string };
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
            return;
          }
        }

        const data = (await res.json().catch(() => ({}))) as { error?: string };

        // ─── Path B: fallback to Shopify cart permalink (no token needed) ───
        if (publicDomain) {
          const permalink = lines
            .map((l) => {
              const num = variantIdToNumeric(l.variantId);
              return num ? `${num}:${l.quantity}` : null;
            })
            .filter(Boolean)
            .join(",");
          if (permalink) {
            window.location.href = `https://${publicDomain}/cart/${permalink}`;
            return;
          }
        }

        throw new Error(
          data.error === "SHOPIFY_NOT_CONFIGURED"
            ? "Shopify n'est pas configuré côté serveur (variables SHOPIFY_DOMAIN / SHOPIFY_STOREFRONT_TOKEN manquantes dans Vercel)."
            : data.error === "CART_CREATION_FAILED"
            ? "Shopify a refusé le panier (variant introuvable ou rupture de stock)."
            : `Erreur ${res.status}`
        );
      } catch (e) {
        setLoading(false);
        setError(
          e instanceof Error ? e.message : "Une erreur est survenue."
        );
      }
      return;
    }

    // ─── No variantIds on any item: cart is stale / mock ───
    if (publicDomain) {
      setError(
        "Votre panier contient des articles obsolètes (sans identifiant Shopify). Cliquez sur \"Vider le panier\" et rajoutez vos pièces."
      );
      return;
    }

    // Demo mode — show the simulated checkout
    router.push("/checkout");
  };

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
              <li
                key={item.id}
                className="grid grid-cols-12 items-center gap-4 py-8"
              >
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
                <Cta
                  fullWidth
                  arrow="ne"
                  onClick={onCheckout}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "Connexion à la caisse…" : "Passer la commande"}
                </Cta>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 text-[11px] leading-relaxed text-red-300/85"
                >
                  {error}
                </p>
              )}

              {/* Diagnostic strip — surfaces the real state so we never
                  silently fall back to a fake confirmation */}
              <div className="mt-6 space-y-2 border-t border-cream/10 pt-4 text-[10px] uppercase tracking-[0.22em] text-cream/45">
                <div className="flex justify-between gap-3">
                  <span>Shopify (serveur)</span>
                  <span
                    className={
                      status === null
                        ? "text-cream/45"
                        : status.shopifyConfigured
                        ? "text-emerald-300/85"
                        : "text-red-300/85"
                    }
                  >
                    {status === null
                      ? "…"
                      : status.shopifyConfigured
                      ? "Connecté"
                      : "Non configuré"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Articles avec variant Shopify</span>
                  <span
                    className={
                      items.length === 0
                        ? "text-cream/45"
                        : allHaveVariant
                        ? "text-emerald-300/85"
                        : "text-amber-300/85"
                    }
                  >
                    {itemsWithVariant.length}/{items.length}
                  </span>
                </div>
              </div>

              {items.length > 0 && !allHaveVariant && (
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setError(null);
                  }}
                  className="mt-3 text-[10px] uppercase tracking-[0.32em] text-cream/55 underline-offset-4 hover:text-cream hover:underline"
                >
                  Vider le panier et recommencer
                </button>
              )}

              <p className="mt-4 text-xs leading-relaxed text-cream/50">
                Paiement sécurisé par Shopify · Écrin offert · Retour gratuit
                sous 30 jours
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
