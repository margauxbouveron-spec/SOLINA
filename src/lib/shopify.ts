/**
 * Shopify Headless adapter.
 *
 * Three catalog paths, tried in order:
 *   1. Authenticated Storefront API (if SHOPIFY_DOMAIN + SHOPIFY_STOREFRONT_TOKEN
 *      are set) — best, gives full data + cartCreate for hosted checkout
 *   2. Public products.json endpoint of any Shopify store — works with
 *      zero auth, just the public domain. Returns real handles + numeric
 *      variant IDs perfect for cart permalinks.
 *   3. Local MOCK_PRODUCTS fallback — keeps the demo navigable when no
 *      Shopify domain is reachable at build time.
 */

import { SHOPIFY_PUBLIC_DOMAIN_FALLBACK } from "./config";
import { MOCK_PRODUCTS, type Product, type ProductCategory } from "./products";

const DOMAIN = process.env.SHOPIFY_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const PUBLIC_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN ||
  DOMAIN ||
  SHOPIFY_PUBLIC_DOMAIN_FALLBACK;
const API_VERSION = "2025-01";

export const isShopifyLive = Boolean(DOMAIN && TOKEN);

async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T | null> {
  if (!isShopifyLive) return null;
  try {
    const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

/* ───────────── Public products.json (no token needed) ───────────── */

type JsonProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Array<{
    id: number;
    price: string;
    available: boolean;
  }>;
  images: Array<{ src: string; alt: string | null }>;
};

async function fetchPublicProducts(): Promise<Product[] | null> {
  if (!PUBLIC_DOMAIN) return null;
  try {
    const res = await fetch(
      `https://${PUBLIC_DOMAIN}/products.json?limit=250`,
      {
        next: { revalidate: 300 },
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { products: JsonProduct[] };
    if (!json.products || json.products.length === 0) return null;
    return json.products.map(mapJsonProduct);
  } catch {
    return null;
  }
}

function mapJsonProduct(p: JsonProduct): Product {
  const cleanText = (html: string) =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

  // Crude category mapping from product_type / tags
  const lower = (p.product_type || "").toLowerCase();
  let category: ProductCategory = "bague";
  if (lower.includes("collier") || lower.includes("necklace")) category = "collier";
  else if (lower.includes("boucle") || lower.includes("earring")) category = "boucles";
  else if (lower.includes("bracelet")) category = "bracelet";
  else if (lower.includes("bague") || lower.includes("ring")) category = "bague";

  return {
    id: String(p.id),
    handle: p.handle,
    name: p.title,
    poem: cleanText(p.body_html) || p.title,
    price: Number(p.variants[0]?.price ?? 0),
    currency: "EUR",
    category,
    material: "plaqué or sur acier inoxydable",
    images: p.images.length
      ? p.images.map((i) => ({ src: i.src, alt: i.alt ?? p.title }))
      : [{ src: "", alt: p.title }],
    accent: "#D4AF37",
    // Store numeric ID directly (Shopify cart permalink expects numeric)
    variantId: p.variants[0] ? String(p.variants[0].id) : undefined,
  };
}

/* ─────────────────────────── Public API ─────────────────────────── */

export async function getAllProducts(): Promise<Product[]> {
  // Path 1 — authenticated Storefront API
  if (isShopifyLive) {
    const data = await shopifyFetch<{
      products: { edges: { node: ShopifyProductNode }[] };
    }>(`
      query AllProducts {
        products(first: 50) {
          edges {
            node {
              id handle title description tags
              priceRange { minVariantPrice { amount currencyCode } }
              images(first: 4) { edges { node { url altText } } }
              variants(first: 1) { edges { node { id availableForSale } } }
            }
          }
        }
      }
    `);
    if (data?.products?.edges?.length) {
      return data.products.edges.map(({ node }) => mapShopifyProduct(node));
    }
  }

  // Path 2 — public products.json (no token)
  const publicProducts = await fetchPublicProducts();
  if (publicProducts && publicProducts.length > 0) return publicProducts;

  // Path 3 — local mock
  return MOCK_PRODUCTS;
}

export async function getProduct(handle: string): Promise<Product | null> {
  // Path 1 — authenticated Storefront API
  if (isShopifyLive) {
    const data = await shopifyFetch<{
      productByHandle: ShopifyProductNode | null;
    }>(
      `
      query Product($handle: String!) {
        productByHandle(handle: $handle) {
          id handle title description tags
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 8) { edges { node { url altText } } }
          variants(first: 1) { edges { node { id availableForSale } } }
        }
      }
      `,
      { handle }
    );
    if (data?.productByHandle) {
      return mapShopifyProduct(data.productByHandle);
    }
  }

  // Path 2 — public catalog
  const publicProducts = await fetchPublicProducts();
  if (publicProducts) {
    const found = publicProducts.find((p) => p.handle === handle);
    if (found) return found;
  }

  // Path 3 — local mock
  return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
}

/* ───────────────────────── Storefront mapping ───────────────────────── */

type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags: string[];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: { edges: { node: { id: string; availableForSale: boolean } }[] };
};

function mapShopifyProduct(n: ShopifyProductNode): Product {
  const images = n.images.edges.map((e) => ({
    src: e.node.url,
    alt: e.node.altText ?? n.title,
  }));
  return {
    id: n.id,
    handle: n.handle,
    name: n.title,
    poem: n.description,
    price: Number(n.priceRange.minVariantPrice.amount),
    currency: n.priceRange.minVariantPrice.currencyCode,
    category: (n.tags?.[0] as ProductCategory) ?? "bague",
    material: "plaqué or sur acier inoxydable",
    images,
    accent: "#D4AF37",
    variantId: n.variants.edges[0]?.node.id,
  };
}

/* ─────────────────────────── Cart / Checkout ─────────────────────────── */

export type CartLine = {
  /**
   * Variant identifier. Accepts either:
   *   - Storefront GID ("gid://shopify/ProductVariant/12345")
   *   - Numeric ID ("12345") — from products.json
   * The route that uses this (cartCreate mutation vs permalink) handles
   * the format it needs.
   */
  variantId: string;
  quantity: number;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
};

export async function createCart(lines: CartLine[]): Promise<ShopifyCart | null> {
  if (!isShopifyLive) return null;
  if (lines.length === 0) return null;

  // cartCreate requires GIDs. If we received numeric IDs, lift to GIDs.
  const merchandiseLines = lines.map((l) => ({
    merchandiseId: /^\d+$/.test(l.variantId)
      ? `gid://shopify/ProductVariant/${l.variantId}`
      : l.variantId,
    quantity: l.quantity,
  }));

  type Resp = {
    cartCreate: {
      cart: ShopifyCart | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  };

  const data = await shopifyFetch<Resp>(
    `
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
    `,
    { input: { lines: merchandiseLines } }
  );

  if (!data?.cartCreate?.cart) return null;
  return data.cartCreate.cart;
}
