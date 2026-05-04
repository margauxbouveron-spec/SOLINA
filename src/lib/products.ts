export type ProductCategory = "bague" | "collier" | "boucles" | "bracelet";

export type Product = {
  id: string;
  handle: string;
  name: string;
  /** Short poetic description — 1-2 lines, editorial */
  poem: string;
  price: number;
  currency: string;
  category: ProductCategory;
  material: string;
  /** Hex used for the product page accent and 3D viewer base color */
  accent: string;
  images: { src: string; alt: string }[];
};

const img = (seed: string) =>
  `https://picsum.photos/seed/solina-${seed}/1600/2000`;

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p-soleil-01",
    handle: "soleil-bague",
    name: "Soleil",
    poem: "Une bague qui retient la chaleur du midi.",
    price: 420,
    currency: "EUR",
    category: "bague",
    material: "or 18 carats, finition mate",
    accent: "#D4AF37",
    images: [{ src: img("soleil-or-mati"), alt: "Bague Soleil en or 18 carats sur peau dorée" }],
  },
  {
    id: "p-mediterranee-01",
    handle: "mediterranee-collier",
    name: "Méditerranée",
    poem: "Le bleu du large, suspendu à votre cou.",
    price: 690,
    currency: "EUR",
    category: "collier",
    material: "or 18 carats, lapis-lazuli",
    accent: "#1F3A5F",
    images: [{ src: img("mediterranee-bleu"), alt: "Collier Méditerranée et lapis-lazuli" }],
  },
  {
    id: "p-olivia-01",
    handle: "olivia-boucles",
    name: "Olivia",
    poem: "Deux feuilles d’olivier, prises au vent du soir.",
    price: 340,
    currency: "EUR",
    category: "boucles",
    material: "or 18 carats, finition polie",
    accent: "#6E7F5F",
    images: [{ src: img("olivia-feuilles"), alt: "Boucles d’oreilles Olivia inspirées de l’olivier" }],
  },
  {
    id: "p-pierre-01",
    handle: "pierre-bracelet",
    name: "Pierre",
    poem: "La caresse minérale d’un mur de calcaire.",
    price: 510,
    currency: "EUR",
    category: "bracelet",
    material: "or 18 carats, perle baroque",
    accent: "#E8D9C5",
    images: [{ src: img("pierre-calcaire"), alt: "Bracelet Pierre avec perle baroque" }],
  },
  {
    id: "p-aube-01",
    handle: "aube-bague",
    name: "Aube",
    poem: "La première lumière, fine comme un fil.",
    price: 290,
    currency: "EUR",
    category: "bague",
    material: "or 18 carats",
    accent: "#F6E2A8",
    images: [{ src: img("aube-fine"), alt: "Bague Aube, anneau fin doré" }],
  },
  {
    id: "p-cigale-01",
    handle: "cigale-collier",
    name: "Cigale",
    poem: "Le chant immobile d’un après-midi d’août.",
    price: 580,
    currency: "EUR",
    category: "collier",
    material: "or 18 carats, citrine",
    accent: "#D4AF37",
    images: [{ src: img("cigale-citrine"), alt: "Collier Cigale avec pendentif citrine" }],
  },
  {
    id: "p-marina-01",
    handle: "marina-boucles",
    name: "Marina",
    poem: "Deux gouttes d’eau salée, à peine tombées.",
    price: 460,
    currency: "EUR",
    category: "boucles",
    material: "or 18 carats, nacre",
    accent: "#E8D9C5",
    images: [{ src: img("marina-nacre"), alt: "Boucles Marina en nacre et or" }],
  },
  {
    id: "p-amalfi-01",
    handle: "amalfi-bracelet",
    name: "Amalfi",
    poem: "Le citron mûr et la pierre chaude, à votre poignet.",
    price: 720,
    currency: "EUR",
    category: "bracelet",
    material: "or 18 carats, citrine",
    accent: "#D4AF37",
    images: [{ src: img("amalfi-citron"), alt: "Bracelet Amalfi avec citrine ambre" }],
  },
];

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
