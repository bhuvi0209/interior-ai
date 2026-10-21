export interface FurnitureItem {
  id: string | number;
  name: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  width?: number;
  depth?: number;
  height?: number;
  model3D?: string;
  visible: boolean;
  locked: boolean;
}

export interface RoomSettings {
  width: number;
  depth: number;
  wallHeight: number;
}

export interface Project {
  name: string;
  roomImage: string;
  style: string;
  furniture: FurnitureItem[];
  room: RoomSettings;
}