export interface FurnitureItem {
  id: string | number;

  name: string;

  category?: string;

  x: number;

  y: number;

  rotation?: number;

  scale?: number;
  width?: number;
  depth?: number;
  height?: number;
  image2D?: string;

  model3D?: string;
}

export interface Project {
  roomImage: string;

  style: string;

  furniture: FurnitureItem[];
}