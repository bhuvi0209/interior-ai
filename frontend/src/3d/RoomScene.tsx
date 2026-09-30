import { Canvas } from "@react-three/fiber";
import {
  Grid,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Group } from "three";
import type { FurnitureItem } from "../types/Project";
import FurnitureModel from "./FurnitureModel";

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

  const positionX = (item.x - 400) / 100;
  const positionZ = (item.y - 250) / 100;

  const rotationY = ((item.rotation ?? 0) * Math.PI) / 180;

  const furnitureHeight =
  ((item.height ?? 100) / 100) * (item.scale ?? 1);

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
        item.model3D ? 0 : furnitureHeight / 2,
        positionZ,
      ]}
      rotation={[0, rotationY, 0]}
      scale={item.scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      {item.model3D ? (
        <FurnitureModel
          modelPath={item.model3D}
          width={item.width}
          depth={item.depth}
          height={item.height}
        />
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[
              (item.width ?? 100) / 100,
              (item.height ?? 100) / 100,
              (item.depth ?? 100) / 100,
            ]}
          />

          <meshStandardMaterial
            color={selected ? "#d89b55" : "#b7a18a"}
            roughness={0.75}
          />
        </mesh>
      )}

      {selected && (
        <mesh
          position={[0, furnitureHeight / 2, 0]}
        >
          <boxGeometry
            args={[
              ((item.width ?? 100) / 100) + 0.08,
              furnitureHeight + 0.08,
              ((item.depth ?? 100) / 100) + 0.08,
            ]}
          />

          <meshBasicMaterial
            color="#4da6ff"
            wireframe
            transparent
            opacity={0.8}
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
        position: [8, 7, 11],
        fov: 50,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: "#e9edf2",
      }}
    >
      {/* Ambient lighting */}
      <ambientLight intensity={0.65} />

      {/* Main light */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Room */}
      <Room />

      {/* Furniture */}
      <Suspense fallback={null}>
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
      </Suspense>

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={[0, 1, 0]}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}