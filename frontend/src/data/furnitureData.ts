export type FurnitureDefinition = {
  id: string;
  name: string;
  category: string;

  image2D?: string;
  model3D?: string;

  defaultScale?: number;

  width?: number;
  depth?: number;
  height?: number;
};

export const furnitureLibrary: FurnitureDefinition[] = [
  {
    id: "sofa",
    name: "Sofa",
    category: "Living Room",
    image2D: "",
    model3D: "/models/sofa.glb",
    defaultScale: 2,
    width: 200,
    depth: 90,
    height: 80,
  },

  {
    id: "chair",
    name: "Chair",
    category: "Living Room",
    defaultScale: 1.5,
    width: 80,
    depth: 80,
    height: 90,
  },

  {
    id: "coffee-table",
    name: "Coffee Table",
    category: "Living Room",
    model3D: "/models/coffee-table.glb",
  },

  {
    id: "tv-unit",
    name: "TV Unit",
    category: "Living Room",
    model3D: "/models/tv-unit.glb",
  },

  {
    id: "bed",
    name: "Bed",
    category: "Bedroom",
    model3D: "/models/bed.glb",
  },

  {
    id: "wardrobe",
    name: "Wardrobe",
    category: "Bedroom",
    model3D: "/models/wardrobe.glb",
  },

  {
    id: "side-table",
    name: "Side Table",
    category: "Bedroom",
    model3D: "/models/side-table.glb",
  },

  {
    id: "dining-table",
    name: "Dining Table",
    category: "Dining",
    model3D: "/models/dining-table.glb",
  },

  {
    id: "dining-chair",
    name: "Dining Chair",
    category: "Dining",
    model3D: "/models/dining-chair.glb",
  },

  {
    id: "lamp",
    name: "Lamp",
    category: "Decor",
    model3D: "/models/lamp.glb",
  },

  {
    id: "plant",
    name: "Plant",
    category: "Decor",
    model3D: "/models/plant.glb",
  },

  {
    id: "rug",
    name: "Rug",
    category: "Decor",
    model3D: "/models/rug.glb",
  },
];