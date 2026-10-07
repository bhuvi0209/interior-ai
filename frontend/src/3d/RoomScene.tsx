import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Grid,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import type { Group } from "three";

import type { FurnitureItem } from "../types/Project";
import FurnitureModel from "./FurnitureModel";

interface RoomSceneProps {
  furniture: FurnitureItem[];
  selectedId: string | number | null;
  transformMode: "translate" | "rotate";
  cameraView: "perspective" | "top" | "front";

  roomWidth?: number;
  roomDepth?: number;
  wallHeight?: number;

  onSelect: (id: string | number) => void;
  onClearSelection: () => void;

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

  const rotation = item.rotation ?? 0;
  const scale = item.scale ?? 1;

  const rotationY = (rotation * Math.PI) / 180;

  const width = item.width ?? 100;
  const depth = item.depth ?? 100;
  const height = item.height ?? 100;

  const furnitureWidth = (width / 100) * scale;
  const furnitureDepth = (depth / 100) * scale;
  const furnitureHeight = (height / 100) * scale;

  const handlePointerDown = (
    event: { stopPropagation: () => void }
  ) => {
    event.stopPropagation();

    if (!item.locked) {
      onSelect(item.id);
    }
  };

  const handleTransformEnd = () => {
    if (!groupRef.current || item.locked) {
      return;
    }

    const updatedX =
      400 + groupRef.current.position.x * 100;

    const updatedY =
      250 + groupRef.current.position.z * 100;

    const updatedRotation =
      (groupRef.current.rotation.y * 180) / Math.PI;

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
      position={[
        positionX,
        item.model3D ? 0 : furnitureHeight / 2,
        positionZ,
      ]}
      rotation={[0, rotationY, 0]}
      onPointerDown={handlePointerDown}
    >
      {item.model3D ? (
        <FurnitureModel
          modelPath={item.model3D}
          width={width}
          depth={depth}
          height={height}
        />
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[
              furnitureWidth,
              furnitureHeight,
              furnitureDepth,
            ]}
          />

          <meshStandardMaterial
            color={
              item.locked
                ? "#777777"
                : selected
                ? "#d89b55"
                : "#b7a18a"
            }
          />
        </mesh>
      )}

      {selected && (
        <mesh
          position={[
            0,
            item.model3D
              ? furnitureHeight / 2
              : 0,
            0,
          ]}
        >
          <boxGeometry
            args={[
              furnitureWidth + 0.05,
              furnitureHeight + 0.05,
              furnitureDepth + 0.05,
            ]}
          />

          <meshBasicMaterial
            color={
              item.locked
                ? "#888888"
                : "#4da6ff"
            }
            wireframe
          />
        </mesh>
      )}
    </group>
  );

  if (selected && !item.locked) {
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

interface RoomProps {
  roomWidth: number;
  roomDepth: number;
  wallHeight: number;
  onClearSelection: () => void;
}

function Room({
  roomWidth,
  roomDepth,
  wallHeight,
  onClearSelection,
}: RoomProps) {
  const width = roomWidth / 100;
  const depth = roomDepth / 100;
  const height = wallHeight / 100;

  return (
    <>
      {/* FLOOR */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          onClearSelection();
        }}
      >
        <planeGeometry args={[width, depth]} />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      {/* BACK WALL */}
      <mesh
        position={[0, height / 2, -depth / 2]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          onClearSelection();
        }}
      >
        <boxGeometry args={[width, height, 0.1]} />

        <meshStandardMaterial color="#f7f7f7" />
      </mesh>

      {/* LEFT WALL */}
      <mesh
        position={[-width / 2, height / 2, 0]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          onClearSelection();
        }}
      >
        <boxGeometry args={[0.1, height, depth]} />

        <meshStandardMaterial color="#f2f2f2" />
      </mesh>

      {/* RIGHT WALL */}
      <mesh
        position={[width / 2, height / 2, 0]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          onClearSelection();
        }}
      >
        <boxGeometry args={[0.1, height, depth]} />

        <meshStandardMaterial color="#f2f2f2" />
      </mesh>

      {/* GRID */}
      <Grid
        args={[width, depth]}
        cellSize={0.2}
        cellThickness={0.6}
        cellColor="#cccccc"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#999999"
        fadeDistance={20}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </>
  );
}

interface CameraControllerProps {
  cameraView: "perspective" | "top" | "front";
}

function CameraController({
  cameraView,
}: CameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (cameraView === "top") {
      camera.position.set(0, 12, 0);
      camera.lookAt(0, 0, 0);
    } else if (cameraView === "front") {
      camera.position.set(0, 3, 12);
      camera.lookAt(0, 1, 0);
    } else {
      camera.position.set(8, 7, 11);
      camera.lookAt(0, 1, 0);
    }
  }, [camera, cameraView]);

  return null;
}

export default function RoomScene({
  furniture,
  selectedId,
  transformMode,
  cameraView,
  roomWidth = 800,
  roomDepth = 500,
  wallHeight = 300,
  onSelect,
  onClearSelection,
  onTransformEnd,
}: RoomSceneProps) {
  return (
    <Canvas
      shadows
      camera={{
        position: [8, 7, 11],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      onPointerMissed={() => {
        onClearSelection();
      }}
    >
      <CameraController cameraView={cameraView} />

      <ambientLight intensity={1.2} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Room
        roomWidth={roomWidth}
        roomDepth={roomDepth}
        wallHeight={wallHeight}
        onClearSelection={onClearSelection}
      />

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

      <OrbitControls />
    </Canvas>
  );
}