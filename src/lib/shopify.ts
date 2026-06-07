/**
 * Shopify Headless adapter — Storefront API.
 *
 * Provides:
 *  - getAllProducts / getProduct — read the catalog
 *  - createCart — turn a local cart into a Shopify cart and return the
 *    hosted checkout URL the user is redirected to to pay
 *
 * Falls back to the mock catalog in `@/lib/products` when SHOPIFY_DOMAIN
 * or SHOPIFY_STOREFRONT_TOKEN are not set, so the demo runs without
 * secrets. Cart creation in mock mode returns null — callers should then
 * fall back to the simulated checkout page.
 */

import { MOCK_PRODUCTS, type Product } from "./products";

const DOMAIN = process.env.SHOPIFY_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
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

/* ─────────────────────────── Catalog ─────────────────────────── */

export async function getAllProducts(): Promise<Product[]> {
  if (!isShopifyLive) return MOCK_PRODUCTS;

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

  if (!data) return MOCK_PRODUCTS;
  return data.products.edges.map(({ node }) => mapShopifyProduct(node));
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!isShopifyLive) {
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }

  const data = await shopifyFetch<{ productByHandle: ShopifyProductNode | null }>(
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

  if (!data?.productByHandle) {
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }
  return mapShopifyProduct(data.productByHandle);
}

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
    category: (n.tags?.[0] as Product["category"]) ?? "bague",
    material: "or 18 carats",
    images,
    accent: "#D4AF37",
    variantId: n.variants.edges[0]?.node.id,
  };
}

/* ─────────────────────────── Cart / Checkout ─────────────────────────── */

export type CartLine = {
  /** Shopify variant GID, e.g. gid://shopify/ProductVariant/12345 */
  variantId: string;
  quantity: number;
};

export type ShopifyCart = {
  id: string;
  /** Hosted Shopify checkout URL the user is redirected to */
  checkoutUrl: string;
};

/**
 * Create a Shopify cart from local cart lines and return the hosted
 * checkout URL. Returns null when Shopify isn't configured, when the
 * mutation fails, or when Shopify reports user errors.
 */
export async function createCart(lines: CartLine[]): Promise<ShopifyCart | null> {
  if (!isShopifyLive) return null;
  if (lines.length === 0) return null;

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
    {
      input: {
        lines: lines.map((l) => ({
          merchandiseId: l.variantId,
          quantity: l.quantity,
        })),
      },
    }
  );

  if (!data?.cartCreate?.cart) return null;
  return data.cartCreate.cart;
}
