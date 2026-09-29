import { Mesh } from "three";

interface FurnitureModelProps {
  modelPath: string;
  width?: number;
  depth?: number;
  height?: number;
}

export default function FurnitureModel({
  width = 100,
  depth = 100,
  height = 100,
}: FurnitureModelProps) {
  return (
    <group>
      {/* Seat */}
      <mesh position={[0, height / 200, 0]}>
        <boxGeometry args={[width / 100, height / 100, depth / 100]} />
        <meshStandardMaterial />
      </mesh>

      {/* Back */}
      <mesh
        position={[
          0,
          height / 100,
          -(depth / 200),
        ]}
      >
        <boxGeometry
          args={[width / 100, height / 100, 0.15]}
        />
        <meshStandardMaterial />
      </mesh>

      {/* Left arm */}
      <mesh
        position={[
          -(width / 200),
          height / 200,
          0,
        ]}
      >
        <boxGeometry
          args={[0.15, height / 100, depth / 100]}
        />
        <meshStandardMaterial />
      </mesh>

      {/* Right arm */}
      <mesh
        position={[
          width / 200,
          height / 200,
          0,
        ]}
      >
        <boxGeometry
          args={[0.15, height / 100, depth / 100]}
        />
        <meshStandardMaterial />
      </mesh>
    </group>
  );
}