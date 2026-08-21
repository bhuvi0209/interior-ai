export interface FurnitureItem {
  id: number;

  name: string;

  x: number;

  y: number;

  rotation?: number;

  scale?: number;

  image2D?: string;

  model3D?: string;
}

export interface Project {
  roomImage: string;

  style: string;

  furniture: FurnitureItem[];
}