
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Grid,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import type { Group } from "three";
import type { FurnitureItem } from "../types/Project";

interface RoomSceneProps {
  furniture: FurnitureItem[];
  selectedId?: string | number | null;
  transformMode?: "translate" | "rotate";
  onSelect?: (id: string | number) => void;
  onTransformEnd?: (
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

  const width = Math.max(0.2, item.width ?? 1);
  const depth = Math.max(0.2, item.depth ?? 1);
  const height = Math.max(0.2, item.height ?? 1);

  const handleTransformEnd = () => {
    const group = groupRef.current;
    if (!group) return;

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

  const object = (
    <group
      ref={groupRef}
      position={[positionX, 0, positionZ]}
      rotation={[0, rotationY, 0]}
      scale={item.scale || 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      <mesh
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={selected ? "#4f8df7" : "#b7a18a"}
          roughness={0.75}
        />
      </mesh>
    </group>
  );

  if (selected) {
    return (
      <TransformControls
        mode={transformMode}
        onMouseUp={handleTransformEnd}
      >
        {object}
      </TransformControls>
    );
  }

  return object;
}

export default function RoomScene({
  furniture,
  selectedId: externalSelectedId,
  transformMode = "translate",
  onSelect,
  onTransformEnd,
}: RoomSceneProps) {
  const [internalSelectedId, setInternalSelectedId] =
    useState<string | number | null>(null);

  const isControlled = externalSelectedId !== undefined;
  const selectedId = isControlled
    ? externalSelectedId
    : internalSelectedId;

  const handleSelect = (id: string | number) => {
    setInternalSelectedId(id);
    onSelect?.(id);
  };

  const handleTransform = (
    id: string | number,
    x: number,
    y: number,
    rotation: number
  ) => {
    onTransformEnd?.(id, x, y, rotation);
  };

  useEffect(() => {
    if (
      selectedId !== null &&
      !furniture.some((item) => item.id === selectedId)
    ) {
      setInternalSelectedId(null);
    }
  }, [furniture, selectedId]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "600px",
        background: "#e9edf2",
        position: "relative",
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [0, 7, 11],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        onPointerMissed={() => {
          setInternalSelectedId(null);
        }}
      >
        <color attach="background" args={["#e9edf2"]} />

        <ambientLight intensity={0.8} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          castShadow
        />

        {/* Room floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05, 0]}
          receiveShadow
        >
          <planeGeometry args={[12, 10]} />
          <meshStandardMaterial color="#f2eee7" />
        </mesh>

        {/* Floor grid */}
        <Grid
          position={[0, 0, 0]}
          args={[12, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          sectionSize={2}
          sectionThickness={1}
          fadeDistance={30}
          infiniteGrid={false}
        />

        {/* Furniture */}
        {furniture
          .filter((item) => item.visible !== false)
          .map((item) => (
            <FurnitureObject
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              transformMode={transformMode}
              onSelect={handleSelect}
              onTransformEnd={handleTransform}
            />
          ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}