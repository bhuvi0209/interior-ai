export interface FurnitureItem {
  id: number;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export interface Project {
  roomImage: string;
  style: string;
  furniture: FurnitureItem[];
}