export type FurnitureCatalogItem = {
  id: string;

  name: string;

  category: string;

  emoji: string;

  image2D?: string;

  model3D?: string;

  defaultScale?: number;

  width?: number;

  depth?: number;

  height?: number;
};

export const furnitureItems:
  FurnitureCatalogItem[] = [
  {
    id: "sofa",
    name: "Sofa",
    category: "Living Room",
    emoji: "🛋️",
    model3D: "/models/sofa.glb",
    defaultScale: 1,
    width: 2.4,
    depth: 0.9,
    height: 0.8,
  },

  {
    id: "chair",
    name: "Chair",
    category: "Living Room",
    emoji: "🪑",
    defaultScale: 1,
    width: 0.8,
    depth: 0.8,
    height: 1,
  },

  {
    id: "coffee-table",
    name: "Coffee Table",
    category: "Living Room",
    emoji: "☕",
    defaultScale: 1,
    width: 1.2,
    depth: 0.7,
    height: 0.45,
  },

  {
    id: "bed",
    name: "Bed",
    category: "Bedroom",
    emoji: "🛏️",
    defaultScale: 1,
    width: 2,
    depth: 2,
    height: 0.6,
  },

  {
    id: "wardrobe",
    name: "Wardrobe",
    category: "Bedroom",
    emoji: "🚪",
    defaultScale: 1,
    width: 1.5,
    depth: 0.6,
    height: 2,
  },

  {
    id: "lamp",
    name: "Lamp",
    category: "Decor",
    emoji: "💡",
    defaultScale: 1,
  },

  {
    id: "plant",
    name: "Plant",
    category: "Decor",
    emoji: "🌱",
    defaultScale: 1,
  },
];