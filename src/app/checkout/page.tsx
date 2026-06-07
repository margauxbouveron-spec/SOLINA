import { redirect } from "next/navigation";
import { SHOPIFY_PUBLIC_DOMAIN_FALLBACK } from "@/lib/config";

/**
 * Vitrine mode — no custom checkout on the Vercel site.
 * Payment happens on the real Shopify-hosted checkout.
 */
export default function CheckoutPage(): never {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || SHOPIFY_PUBLIC_DOMAIN_FALLBACK;
  redirect(`https://${domain}/cart`);
}
