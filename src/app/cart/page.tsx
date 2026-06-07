import { redirect } from "next/navigation";
import { SHOPIFY_PUBLIC_DOMAIN_FALLBACK } from "@/lib/config";

/**
 * Vitrine mode — the Vercel site has no native cart.
 * Anyone landing on /cart is sent to the real Shopify cart on the
 * canonical store domain, where their items and checkout live.
 */
export default function CartPage(): never {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || SHOPIFY_PUBLIC_DOMAIN_FALLBACK;
  redirect(`https://${domain}/cart`);
}
