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
    images: [
      {
        src: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=80",
        alt: "Bague Soleil en or",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=80",
        alt: "Collier Méditerranée",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1600&q=80",
        alt: "Boucles d’oreilles Olivia",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1600&q=80",
        alt: "Bracelet Pierre",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=80",
        alt: "Bague Aube",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=80",
        alt: "Collier Cigale",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1633934542430-0905ccb5f050?auto=format&fit=crop&w=1600&q=80",
        alt: "Boucles Marina",
      },
    ],
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
    images: [
      {
        src: "https://images.unsplash.com/photo-1599459183205-ea4d3697f0aa?auto=format&fit=crop&w=1600&q=80",
        alt: "Bracelet Amalfi",
      },
    ],
  },
];

export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
