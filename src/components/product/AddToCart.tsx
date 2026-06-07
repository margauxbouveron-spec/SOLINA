"use client";

import { Cta } from "@/components/ui/Cta";
import { SHOPIFY_PUBLIC_DOMAIN_FALLBACK } from "@/lib/config";
import type { Product } from "@/lib/products";

/**
 * Vitrine mode — purchasing happens on the real Shopify store.
 * The button is an external link that opens the corresponding Shopify
 * product page, where the customer adds to cart and pays through
 * Shopify's native, working checkout.
 */
export function AddToCart({ product }: { product: Product }) {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || SHOPIFY_PUBLIC_DOMAIN_FALLBACK;
  const href = `https://${domain}/products/${product.handle}`;

  return (
    <Cta
      href={href}
      arrow="ne"
      fullWidth
      rel="noopener"
      target="_self"
    >
      Acheter sur Solina Bijoux
    </Cta>
  );
}
