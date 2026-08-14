export type FurnitureItem = {
  id: number;
  name: string;
  x: number;
  y: number;
};

export type Project = {
  roomImage: string;
  style: string;
  furniture: FurnitureItem[];
};