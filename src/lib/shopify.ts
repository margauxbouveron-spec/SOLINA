/**
 * Shopify Headless adapter — Storefront API.
 *
 * In production, point SHOPIFY_DOMAIN + SHOPIFY_STOREFRONT_TOKEN to a real store
 * and the GraphQL fetch path will activate. For demo/preview, the mock catalog
 * in @/lib/products is returned so the site is fully navigable without secrets.
 */

import { MOCK_PRODUCTS, type Product } from "./products";

const DOMAIN = process.env.SHOPIFY_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2025-01";

const isLive = Boolean(DOMAIN && TOKEN);

async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  if (!isLive) return null;
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

export async function getAllProducts(): Promise<Product[]> {
  if (!isLive) return MOCK_PRODUCTS;

  const data = await shopifyFetch<{ products: { edges: { node: ShopifyProductNode }[] } }>(`
    query AllProducts {
      products(first: 50) {
        edges {
          node {
            id
            handle
            title
            description
            tags
            priceRange { minVariantPrice { amount currencyCode } }
            images(first: 4) { edges { node { url altText } } }
          }
        }
      }
    }
  `);

  if (!data) return MOCK_PRODUCTS;
  return data.products.edges.map(({ node }) => mapShopifyProduct(node));
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!isLive) return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;

  const data = await shopifyFetch<{ productByHandle: ShopifyProductNode | null }>(
    `
    query Product($handle: String!) {
      productByHandle(handle: $handle) {
        id handle title description tags
        priceRange { minVariantPrice { amount currencyCode } }
        images(first: 8) { edges { node { url altText } } }
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
  };
}
