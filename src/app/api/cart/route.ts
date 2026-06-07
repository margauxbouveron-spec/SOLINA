import { NextResponse } from "next/server";
import { createCart, isShopifyLive, type CartLine } from "@/lib/shopify";

/**
 * GET /api/cart
 * Diagnostic endpoint — returns whether Shopify is configured on the
 * server. The cart page calls this on mount so it can show a visible
 * status badge ("Shopify connecté" vs "Shopify non configuré") instead
 * of silently falling back to the simulation.
 */
export async function GET() {
  return NextResponse.json({
    shopifyConfigured: isShopifyLive,
    domain: isShopifyLive ? process.env.SHOPIFY_DOMAIN : null,
  });
}

/**
 * POST /api/cart
 * Body: { lines: [{ variantId, quantity }] }
 *
 * Creates a Shopify cart from the provided lines and returns the hosted
 * checkout URL. The client redirects (window.location.href) to that URL
 * — payment then happens entirely on Shopify's PCI-compliant
 * infrastructure.
 *
 * Responses:
 *  200 { checkoutUrl } — cart created
 *  400 { error }       — missing/invalid lines
 *  503 { error }       — Shopify not configured on the server
 *  502 { error }       — Shopify rejected the cart
 */
export async function POST(req: Request) {
  if (!isShopifyLive) {
    return NextResponse.json(
      { error: "SHOPIFY_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let body: { lines?: CartLine[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const lines = (body.lines ?? []).filter(
    (l): l is CartLine =>
      typeof l?.variantId === "string" &&
      l.variantId.length > 0 &&
      typeof l.quantity === "number" &&
      l.quantity > 0
  );

  if (lines.length === 0) {
    return NextResponse.json({ error: "EMPTY_LINES" }, { status: 400 });
  }

  const cart = await createCart(lines);
  if (!cart) {
    return NextResponse.json(
      { error: "CART_CREATION_FAILED" },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
}
