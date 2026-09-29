import { Canvas } from "@react-three/fiber";
import {
  Grid,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import type { FurnitureItem } from "../types/Project";

interface RoomSceneProps {
  furniture: FurnitureItem[];
  selectedId: string | number | null;
  transformMode: "translate" | "rotate";
  onSelect: (id: string | number) => void;
  onTransformEnd: (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => void;
}

interface FurnitureObjectProps {
  item: FurnitureItem;
  selected: boolean;
  transformMode: "translate" | "rotate";
  onSelect: (id: string | number) => void;
  onTransformEnd: (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => void;
}

function FurnitureObject({
  item,
  selected,
  transformMode,
  onSelect,
  onTransformEnd,
}: FurnitureObjectProps) {
  const groupRef = useRef<Group>(null);

  // Convert 2D editor coordinates to 3D coordinates.
  const positionX = (item.x - 400) / 100;
  const positionZ = (item.y - 250) / 100;

  const width = (item.width ?? 100) / 100;
  const depth = (item.depth ?? 100) / 100;
  const height = (item.height ?? 100) / 100;

  const furnitureScale = item.scale || 1;

  const rotationY = ((item.rotation ?? 0) * Math.PI) / 180;

  const handleTransformEnd = () => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const updatedX = 400 + group.position.x * 100;
    const updatedY = 250 + group.position.z * 100;
    const updatedRotation =
      (group.rotation.y * 180) / Math.PI;

    onTransformEnd(
      item.id,
      updatedX,
      updatedY,
      updatedRotation
    );
  };

  const furnitureGroup = (
    <group
      ref={groupRef}
      position={[
        positionX,
        (height * furnitureScale) / 2,
        positionZ,
      ]}
      rotation={[0, rotationY, 0]}
      scale={furnitureScale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      {/* Temporary furniture representation */}
      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[width, height, depth]}
        />

        <meshStandardMaterial
          color={
            selected
              ? "#d28b45"
              : "#b7a18a"
          }
          roughness={0.75}
        />
      </mesh>

      {/* Selection outline */}
      {selected && (
        <mesh>
          <boxGeometry
            args={[
              width * 1.08,
              height * 1.08,
              depth * 1.08,
            ]}
          />

          <meshBasicMaterial
            color="#2563eb"
            wireframe
          />
        </mesh>
      )}
    </group>
  );

  if (selected) {
    return (
      <TransformControls
        mode={transformMode}
        onMouseUp={handleTransformEnd}
      >
        {furnitureGroup}
      </TransformControls>
    );
  }

  return furnitureGroup;
}

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[12, 10]} />

        <meshStandardMaterial
          color="#c9a77b"
          roughness={0.85}
        />
      </mesh>

      {/* Back wall */}
      <mesh
        position={[0, 1.5, -5]}
        receiveShadow
      >
        <boxGeometry args={[12, 3, 0.15]} />

        <meshStandardMaterial
          color="#eee6d8"
          roughness={0.9}
        />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-6, 1.5, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.15, 3, 10]} />

        <meshStandardMaterial
          color="#e2d8c8"
          roughness={0.9}
        />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[6, 1.5, 0]}
        receiveShadow
      >
        <boxGeometry args={[0.15, 3, 10]} />

        <meshStandardMaterial
          color="#e2d8c8"
          roughness={0.9}
        />
      </mesh>

      {/* Floor grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[12, 10]}
        cellSize={0.2}
        cellThickness={0.4}
        sectionSize={1}
        sectionThickness={0.8}
        fadeDistance={25}
        infiniteGrid={false}
      />
    </group>
  );
}

export default function RoomScene({
  furniture,
  selectedId,
  transformMode,
  onSelect,
  onTransformEnd,
}: RoomSceneProps) {
  return (
    <Canvas
      shadows
      camera={{
        position: [6.5, 5.5, 8],
        fov: 45,
        near: 0.1,
        far: 100,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "#e9edf2",
      }}
      onPointerMissed={() => onSelect("")}
    >
      {/* Lighting */}
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[4, 10, 6]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Room */}
      <Room />

      {/* Furniture */}
      {furniture
        .filter((item) => item.visible)
        .map((item) => (
          <FurnitureObject
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            transformMode={transformMode}
            onSelect={onSelect}
            onTransformEnd={onTransformEnd}
          />
        ))}

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minDistance={2.5}
        maxDistance={15}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}