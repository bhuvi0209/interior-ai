import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { FurnitureItem } from "../types/Project";

type RoomSceneProps = {
  furniture: FurnitureItem[];
};

function RoomContent({ furniture }: RoomSceneProps) {
  return (
    <>
      <color attach="background" args={["#eeeeee"]} />

      <ambientLight intensity={1.5} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
      />

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#d9d9d9" />
      </mesh>

      {/* Grid */}
      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        sectionSize={2}
        sectionThickness={1}
        fadeDistance={15}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Temporary test objects */}
      {furniture.map((item) => {
        if (!item.visible) {
          return null;
        }

        const positionX = (item.x - 400) / 100;
        const positionZ = (item.y - 250) / 100;
        const rotationY =
  ((item.rotation ?? 0) * Math.PI) / 180;

        return (
          <mesh
            key={item.id}
            position={[positionX, 0.5, positionZ]}
            rotation={[0, rotationY, 0]}
            scale={item.scale}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8b7355" />
          </mesh>
        );
      })}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

export default function RoomScene({ furniture }: RoomSceneProps) {
  return (
    <Canvas
      camera={{
        position: [6, 5, 7],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    >
      <RoomContent furniture={furniture} />
    </Canvas>
  );
}