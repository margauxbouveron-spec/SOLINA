import { CollectionGrid } from "@/components/product/CollectionGrid";
import { getAllProducts } from "@/lib/shopify";

export const metadata = {
  title: "Collection — SOLINA",
  description: "L’ensemble de la collection SOLINA. Or, pierre, lumière.",
};

export default async function CollectionPage() {
  const products = await getAllProducts();

  return (
    <section className="pt-32">
      <header className="gutter mx-auto mb-20 max-w-[1600px]">
        <div className="eyebrow text-ink/55">Collection — Été MMXXVI</div>
        <h1 className="headline mt-6 text-[14vw] leading-[0.92] md:text-[10vw] lg:text-[140px]">
          La lumière, <em className="not-italic text-ink/65">portée.</em>
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-ink/65">
          Chaque pièce est conçue dans notre atelier méditerranéen, en or 18
          carats, et fabriquée en série limitée.
        </p>
      </header>

      <CollectionGrid products={products} />
    </section>
  );
}
