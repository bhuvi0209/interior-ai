import * as THREE from "three";
import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
  Environment,
  TransformControls,
} from "@react-three/drei";

import { useProject } from "../context/ProjectContext";

import type { Project } from "../types/project";

const ROOM_WIDTH = 12;
const ROOM_DEPTH = 8;
const ROOM_HEIGHT = 4;
const WALL_THICKNESS = 0.2;

/* --------------------------------
   ROOM MATERIAL
--------------------------------- */

function RoomMaterial({
  color = "#eeeeee",
}: {
  color?: string;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.8}
      metalness={0}
      side={THREE.DoubleSide}
    />
  );
}

/* --------------------------------
   FLOOR
--------------------------------- */

function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
      <RoomMaterial color="#d8d2c8" />
    </mesh>
  );
}

/* --------------------------------
   WALLS
--------------------------------- */

function Walls() {
  return (
    <>
      {/* Back wall */}
      <mesh
        position={[
          0,
          ROOM_HEIGHT / 2,
          -ROOM_DEPTH / 2,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            ROOM_WIDTH,
            ROOM_HEIGHT,
            WALL_THICKNESS,
          ]}
        />

        <RoomMaterial color="#f4f1ec" />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[
          -ROOM_WIDTH / 2,
          ROOM_HEIGHT / 2,
          0,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            WALL_THICKNESS,
            ROOM_HEIGHT,
            ROOM_DEPTH,
          ]}
        />

        <RoomMaterial color="#f4f1ec" />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[
          ROOM_WIDTH / 2,
          ROOM_HEIGHT / 2,
          0,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[
            WALL_THICKNESS,
            ROOM_HEIGHT,
            ROOM_DEPTH,
          ]}
        />

        <RoomMaterial color="#f4f1ec" />
      </mesh>
    </>
  );
}

/* --------------------------------
   CEILING
--------------------------------- */

function Ceiling() {
  return (
    <mesh
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, ROOM_HEIGHT, 0]}
    >
      <planeGeometry
        args={[ROOM_WIDTH, ROOM_DEPTH]}
      />

      <RoomMaterial color="#fafafa" />
    </mesh>
  );
}

/* --------------------------------
   ROOM BOUNDARY
--------------------------------- */

function RoomBoundary() {
  return (
    <lineSegments>
      <edgesGeometry
        attach="geometry"
        args={[
          new THREE.BoxGeometry(
            ROOM_WIDTH,
            0.01,
            ROOM_DEPTH
          ),
        ]}
      />

      <lineBasicMaterial color="#555555" />
    </lineSegments>
  );
}

/* --------------------------------
   FALLBACK FURNITURE
--------------------------------- */

function getFurnitureModel(name: string) {
  switch (name) {
    case "Sofa":
      return (
        <group>
          {/* Seat */}
          <mesh
            position={[0, 0.5, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.8, 0.45, 1]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>

          {/* Back */}
          <mesh
            position={[0, 1, -0.4]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.8, 1, 0.3]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>

          {/* Left arm */}
          <mesh
            position={[-1.25, 0.8, 0]}
            castShadow
          >
            <boxGeometry args={[0.3, 0.7, 1]} />
            <meshStandardMaterial color="#70451f" />
          </mesh>

          {/* Right arm */}
          <mesh
            position={[1.25, 0.8, 0]}
            castShadow
          >
            <boxGeometry args={[0.3, 0.7, 1]} />
            <meshStandardMaterial color="#70451f" />
          </mesh>
        </group>
      );

    case "Coffee Table":
      return (
        <group>
          {/* Table top */}
          <mesh
            position={[0, 0.7, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2, 0.2, 1]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>

          {/* Legs */}
          {[
            [-0.8, 0.35, -0.35],
            [0.8, 0.35, -0.35],
            [-0.8, 0.35, 0.35],
            [0.8, 0.35, 0.35],
          ].map((position, index) => (
            <mesh
              key={index}
              position={
                position as [
                  number,
                  number,
                  number
                ]
              }
              castShadow
            >
              <boxGeometry
                args={[0.12, 0.7, 0.12]}
              />

              <meshStandardMaterial color="#5c3b20" />
            </mesh>
          ))}
        </group>
      );

    case "Chair":
      return (
        <group>
          {/* Seat */}
          <mesh
            position={[0, 0.65, 0]}
            castShadow
          >
            <boxGeometry args={[1, 0.25, 1]} />
            <meshStandardMaterial color="#555555" />
          </mesh>

          {/* Back */}
          <mesh
            position={[0, 1.3, -0.4]}
            castShadow
          >
            <boxGeometry args={[1, 1.3, 0.2]} />
            <meshStandardMaterial color="#555555" />
          </mesh>

          {/* Legs */}
          {[
            [-0.4, 0.3, -0.4],
            [0.4, 0.3, -0.4],
            [-0.4, 0.3, 0.4],
            [0.4, 0.3, 0.4],
          ].map((position, index) => (
            <mesh
              key={index}
              position={
                position as [
                  number,
                  number,
                  number
                ]
              }
              castShadow
            >
              <cylinderGeometry
                args={[0.06, 0.06, 0.6, 12]}
              />

              <meshStandardMaterial color="#333333" />
            </mesh>
          ))}
        </group>
      );

    case "Bed":
      return (
        <group>
          {/* Mattress */}
          <mesh
            position={[0, 0.65, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[3, 0.5, 2]} />
            <meshStandardMaterial color="#eeeeee" />
          </mesh>

          {/* Bed frame */}
          <mesh
            position={[0, 0.35, 0]}
            castShadow
          >
            <boxGeometry args={[3.2, 0.3, 2.2]} />
            <meshStandardMaterial color="#8b6f47" />
          </mesh>

          {/* Headboard */}
          <mesh
            position={[0, 1.5, -0.9]}
            castShadow
          >
            <boxGeometry args={[3.2, 2, 0.2]} />
            <meshStandardMaterial color="#8b6f47" />
          </mesh>
        </group>
      );

    case "Wardrobe":
      return (
        <group>
          {/* Main wardrobe */}
          <mesh
            position={[0, 1.5, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2, 3, 0.7]} />
            <meshStandardMaterial color="#8b6f47" />
          </mesh>

          {/* Door divider */}
          <mesh position={[0, 1.5, -0.36]}>
            <boxGeometry args={[0.05, 2.8, 0.03]} />
            <meshStandardMaterial color="#5c4630" />
          </mesh>
        </group>
      );

    case "Lamp":
      return (
        <group>
          {/* Stand */}
          <mesh
            position={[0, 1, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[0.08, 0.08, 2, 16]}
            />

            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Shade */}
          <mesh
            position={[0, 2, 0]}
            castShadow
          >
            <coneGeometry
              args={[0.5, 0.7, 32]}
            />

            <meshStandardMaterial color="#f0d27a" />
          </mesh>
        </group>
      );

    case "Plant":
      return (
        <group>
          {/* Pot */}
          <mesh
            position={[0, 0.35, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[0.35, 0.25, 0.7, 20]}
            />

            <meshStandardMaterial color="#9b5b3e" />
          </mesh>

          {/* Plant */}
          <mesh
            position={[0, 1.2, 0]}
            castShadow
          >
            <sphereGeometry
              args={[0.7, 24, 24]}
            />

            <meshStandardMaterial color="#4f7942" />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh
          position={[0, 0.5, 0]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />

          <meshStandardMaterial color="#999999" />
        </mesh>
      );
  }
}

/* --------------------------------
   3D FURNITURE
--------------------------------- */

interface Furniture3DProps {
  id: number;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  model3D?: string;

  selected: boolean;

  onSelect: () => void;

  onChange: (
    x: number,
    y: number,
    rotation: number
  ) => void;

  transformMode: "translate" | "rotate";
}

function Furniture3D({
  name,
  x,
  y,
  rotation = 0,
  scale = 1,
  selected,
  onSelect,
  onChange,
  transformMode,
}: Furniture3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  /*
    Convert 2D coordinates into 3D coordinates.
  */

  const positionX = (x - 400) / 70;
  const positionZ = (y - 250) / 70;

  const rotationY = (rotation * Math.PI) / 180;

  /*
    IMPORTANT:
    We do NOT load model3D here.

    The .glb file is currently empty, so using
    useGLTF() causes the /3d page to crash.

    Instead, we use our built-in 3D furniture.
  */

  const furnitureModel = getFurnitureModel(name);

  return (
    <group
      ref={groupRef}
      position={[
        positionX,
        0,
        positionZ,
      ]}
      rotation={[
        0,
        rotationY,
        0,
      ]}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {selected ? (
        <TransformControls
          mode={transformMode}
          showX
          showY={false}
          showZ
          onObjectChange={() => {
            if (!groupRef.current) {
              return;
            }

            const currentX =
              groupRef.current.position.x;

            const currentZ =
              groupRef.current.position.z;

            const currentRotation =
              groupRef.current.rotation.y;

            const newX =
              currentX * 70 + 400;

            const newY =
              currentZ * 70 + 250;

            const newRotation =
              (currentRotation * 180) /
              Math.PI;

            onChange(
              newX,
              newY,
              newRotation
            );
          }}
        >
          {furnitureModel}
        </TransformControls>
      ) : (
        furnitureModel
      )}
    </group>
  );
}

/* --------------------------------
   3D SCENE
--------------------------------- */

interface SceneProps {
  project: Project;

  setProject: React.Dispatch<
    React.SetStateAction<Project>
  >;

  selectedId: number | null;

  setSelectedId: (
    id: number | null
  ) => void;

  transformMode: "translate" | "rotate";
}

function Scene({
  project,
  setProject,
  selectedId,
  setSelectedId,
  transformMode,
}: SceneProps) {
  return (
    <>
      {/* Lighting */}

      <ambientLight intensity={0.5} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
      />

      <pointLight
        position={[
          0,
          ROOM_HEIGHT - 0.5,
          0,
        ]}
        intensity={1}
        distance={10}
      />

      {/* Room */}

      <Floor />

      <Walls />

      <Ceiling />

      <RoomBoundary />

      {/* Furniture */}

      {project.furniture.map((item) => (
        <Furniture3D
          key={item.id}
          id={item.id}
          name={item.name}
          x={item.x}
          y={item.y}
          rotation={item.rotation}
          scale={item.scale}
          model3D={item.model3D}
          selected={
            selectedId === item.id
          }
          onSelect={() =>
            setSelectedId(item.id)
          }
          transformMode={transformMode}
          onChange={(
            newX,
            newY,
            newRotation
          ) => {
            setProject(
              (currentProject) => ({
                ...currentProject,

                furniture:
                  currentProject.furniture.map(
                    (furniture) =>
                      furniture.id ===
                      item.id
                        ? {
                            ...furniture,
                            x: newX,
                            y: newY,
                            rotation:
                              newRotation,
                          }
                        : furniture
                  ),
              })
            );
          }}
        />
      ))}

      {/* Grid */}

      <Grid
        args={[
          ROOM_WIDTH,
          ROOM_DEPTH,
        ]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#b8b8b8"
        sectionSize={4}
        sectionThickness={1}
        sectionColor="#777777"
        fadeDistance={20}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <Environment preset="apartment" />
    </>
  );
}

/* --------------------------------
   MAIN 3D VIEW
--------------------------------- */

function ThreeDView() {
  const {
    project,
    setProject,
  } = useProject();

  const [
    selectedId,
    setSelectedId,
  ] = useState<number | null>(null);

  const [
    transformMode,
    setTransformMode,
  ] = useState<
    "translate" | "rotate"
  >("translate");

  const selectedFurniture =
    project.furniture.find(
      (item) =>
        item.id === selectedId
    );

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Header */}

      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 20,
          background: "white",
          padding: "15px 20px",
          borderRadius: "10px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.15)",
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          3D Room View
        </h2>

        <p
          style={{
            margin: "5px 0 0 0",
          }}
        >
          Interior AI
        </p>
      </div>

      {/* Selected Furniture Panel */}

      {selectedFurniture && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 20,
            background: "white",
            padding: "18px",
            borderRadius: "10px",
            minWidth: "180px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.15)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            {selectedFurniture.name}
          </h3>

          <p>
            X:{" "}
            {Math.round(
              selectedFurniture.x
            )}
          </p>

          <p>
            Y:{" "}
            {Math.round(
              selectedFurniture.y
            )}
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <button
              onClick={() =>
                setTransformMode(
                  "translate"
                )
              }
            >
              Move
            </button>

            <button
              onClick={() =>
                setTransformMode(
                  "rotate"
                )
              }
            >
              Rotate
            </button>
          </div>

          <button
            onClick={() =>
              setSelectedId(null)
            }
          >
            Deselect
          </button>
        </div>
      )}

      {/* 3D Canvas */}

      <Canvas
        camera={{
          position: [7, 5, 9],
          fov: 55,
          near: 0.1,
          far: 100,
        }}
        onPointerMissed={() => {
          setSelectedId(null);
        }}
      >
        <Scene
          project={project}
          setProject={setProject}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          transformMode={transformMode}
        />

        <OrbitControls
          target={[0, 1, 0]}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={
            Math.PI / 2 - 0.05
          }
        />
      </Canvas>
    </div>
  );
}

export default ThreeDView;