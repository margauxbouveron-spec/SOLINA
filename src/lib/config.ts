/**
 * SOLINA — hardcoded fallback config.
 *
 * Used when environment variables aren't set on Vercel (or locally).
 * Edit this file directly if you don't want to bother with env vars —
 * the values here are picked up at build time.
 */

/**
 * Public domain for Shopify cart permalinks.
 *
 * Cart permalinks let the user be redirected to a Shopify checkout
 * without any API token:
 *   https://DOMAIN/cart/VARIANT_ID:QTY,VARIANT_ID:QTY
 *
 * IMPORTANT: this must be the domain where the *Shopify storefront* is
 * hosted, not the Vercel/Next.js site domain. Either:
 *   - The `.myshopify.com` subdomain (e.g., `solina-bijoux.myshopify.com`)
 *   - Or a custom domain attached to the Shopify shop in Shopify Admin
 *     → Settings → Domains
 */
export const SHOPIFY_PUBLIC_DOMAIN_FALLBACK = "solinabijoux.com";
