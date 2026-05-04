import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/product/AddToCart";
import { ProductViewer } from "@/components/product/ProductViewer";
import { formatPrice, type ProductCategory } from "@/lib/products";
import { getAllProducts, getProduct } from "@/lib/shopify";

const SHAPE_BY_CATEGORY: Record<ProductCategory, "ring" | "pendant" | "earring" | "bangle"> = {
  bague: "ring",
  collier: "pendant",
  boucles: "earring",
  bracelet: "bangle",
};

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: { params: { handle: string } }) {
  const product = await getProduct(params.handle);
  if (!product) return { title: "SOLINA" };
  return {
    title: `${product.name} — SOLINA`,
    description: product.poem,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProduct(params.handle);
  if (!product) notFound();

  const shape = SHAPE_BY_CATEGORY[product.category];

  return (
    <article className="pt-24">
      {/* Breadcrumb */}
      <div className="gutter mx-auto max-w-[1600px] py-6 text-[10px] uppercase tracking-[0.32em] text-cream/45">
        <Link href="/collection" className="hover:text-cream">
          Collection
        </Link>
        <span className="mx-3 text-cream/25">/</span>
        <span className="text-cream/70">{product.name}</span>
      </div>

      <section className="gutter mx-auto grid max-w-[1600px] gap-12 md:grid-cols-12 md:gap-16">
        {/* 3D Viewer */}
        <div className="md:col-span-7">
          <div className="relative overflow-hidden bg-night">
            <ProductViewer accent={product.accent} shape={shape} />
          </div>
        </div>

        {/* Details */}
        <aside className="md:col-span-5 md:pt-12">
          <div className="md:sticky md:top-28">
            <div className="eyebrow text-cream/55">{product.category}</div>
            <h1 className="headline mt-5 text-[12vw] leading-[0.95] md:text-[68px]">
              {product.name}
            </h1>
            <p className="mt-6 max-w-md font-editorial text-2xl leading-snug text-cream/80">
              {product.poem}
            </p>

            <div className="mt-10 flex items-baseline justify-between border-t border-cream/15 pt-6">
              <div className="text-[11px] uppercase tracking-[0.32em] text-cream/55">
                Prix
              </div>
              <div className="font-editorial text-3xl">
                {formatPrice(product.price, product.currency)}
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-cream/15 pt-6 text-sm text-cream/65">
              <div className="flex justify-between">
                <dt className="uppercase tracking-[0.18em] text-cream/45">Matière</dt>
                <dd>{product.material}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="uppercase tracking-[0.18em] text-cream/45">Origine</dt>
                <dd>Atelier méditerranéen</dd>
              </div>
              <div className="flex justify-between">
                <dt className="uppercase tracking-[0.18em] text-cream/45">Édition</dt>
                <dd>Série limitée</dd>
              </div>
            </dl>

            <div className="mt-10">
              <AddToCart product={product} />
            </div>

            <p className="mt-6 text-xs text-cream/45">
              Livraison soignée sous 5 jours · Écrin offert · Retours étendus
            </p>
          </div>
        </aside>
      </section>

      {/* Editorial closing */}
      <section className="gutter mx-auto mt-32 max-w-3xl text-center">
        <p className="font-editorial text-3xl leading-snug text-cream/85 md:text-4xl">
          “Chaque {product.name.toLowerCase()} est une fenêtre.<br />
          Vous portez un peu d’été.”
        </p>
      </section>
    </article>
  );
}
