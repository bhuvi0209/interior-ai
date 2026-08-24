import * as THREE from "three";
import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
  Environment,
  useGLTF,
  TransformControls,
} from "@react-three/drei";

import { useProject } from "../context/ProjectContext";

import type { Project } from "../types/project";

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

  onChange: (x: number, y: number) => void;

  transformMode: "translate" | "rotate";
}

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

/* --------------------------------
   FLOOR
--------------------------------- */

function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[12, 8]} />

      <meshStandardMaterial color="#dddddd" />
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
      <mesh position={[0, 2, -4]}>
        <boxGeometry
          args={[12, 4, 0.2]}
        />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-6, 2, 0]}>
        <boxGeometry
          args={[0.2, 4, 8]}
        />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </>
  );
}

/* --------------------------------
   REAL GLB MODEL
--------------------------------- */

function RealFurnitureModel({
  model3D,
}: {
  model3D: string;
}) {
  const { scene } = useGLTF(model3D);

  return (
    <primitive
      object={scene.clone()}
    />
  );
}

/* --------------------------------
   FALLBACK FURNITURE
--------------------------------- */

function getFurnitureModel(
  name: string
) {
  switch (name) {
    case "Sofa":
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry
            args={[3, 1, 1]}
          />

          <meshStandardMaterial color="#777777" />
        </mesh>
      );

    case "Coffee Table":
      return (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry
            args={[2, 0.4, 1]}
          />

          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      );

    case "Chair":
      return (
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry
            args={[1, 1.4, 1]}
          />

          <meshStandardMaterial color="#555555" />
        </mesh>
      );

    case "Bed":
      return (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry
            args={[3, 0.7, 2]}
          />

          <meshStandardMaterial color="#aaaaaa" />
        </mesh>
      );

    case "Wardrobe":
      return (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry
            args={[2, 3, 0.7]}
          />

          <meshStandardMaterial color="#8b6f47" />
        </mesh>
      );

    case "Lamp":
      return (
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry
            args={[0.3, 0.5, 2, 32]}
          />

          <meshStandardMaterial color="#f0d27a" />
        </mesh>
      );

    case "Plant":
      return (
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry
            args={[0.7, 32, 32]}
          />

          <meshStandardMaterial color="#4f7942" />
        </mesh>
      );

    default:
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry
            args={[1, 1, 1]}
          />

          <meshStandardMaterial color="#999999" />
        </mesh>
      );
  }
}

/* --------------------------------
   3D FURNITURE
--------------------------------- */

function Furniture3D({
  name,
  x,
  y,
  rotation = 0,
  scale = 1,
  model3D,
  selected,
  onSelect,
  onChange,
  transformMode,
}: Furniture3DProps) {
  const groupRef =
    useRef<THREE.Group>(null);

  /*
    Convert 2D coordinates
    into 3D coordinates.
  */

  const positionX =
    (x - 400) / 70;

  const positionZ =
    (y - 250) / 70;

  const rotationY =
    (rotation * Math.PI) / 180;

  /*
    Choose real GLB model
    or fallback box model.
  */

  const furnitureModel = model3D ? (
    <RealFurnitureModel
      model3D={model3D}
    />
  ) : (
    getFurnitureModel(name)
  );

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

            /*
              Get current 3D position.
            */

            const currentX =
              groupRef.current.position.x;

            const currentZ =
              groupRef.current.position.z;

            /*
              Convert 3D coordinates
              back into 2D coordinates.
            */

            const newX =
              currentX * 70 + 400;

            const newY =
              currentZ * 70 + 250;

            /*
              Send updated position
              back to ProjectContext.
            */

            onChange(
              newX,
              newY
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

      <ambientLight
        intensity={0.7}
      />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
      />

      {/* Room */}

      <Floor />

      <Walls />

      {/* Furniture */}

      {project.furniture.map(
        (item) => (
          <Furniture3D
            key={item.id}
            id={item.id}
            name={item.name}
            x={item.x}
            y={item.y}
            rotation={
              item.rotation
            }
            scale={item.scale}
            model3D={
              item.model3D
            }
            selected={
              selectedId === item.id
            }
            onSelect={() =>
              setSelectedId(
                item.id
              )
            }
            transformMode={
              transformMode
            }
            onChange={(
              newX,
              newY
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
                            }
                          : furniture
                    ),
                })
              );
            }}
          />
        )
      )}

      {/* Grid */}

      <Grid
        args={[12, 8]}
        cellSize={1}
        cellThickness={1}
        cellColor="#999999"
        sectionSize={4}
        sectionThickness={1.5}
        sectionColor="#555555"
        fadeDistance={20}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />

      {/* Environment */}

      <Environment
        preset="apartment"
      />
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

  /*
    Currently selected furniture.
  */

  const [
    selectedId,
    setSelectedId,
  ] = useState<number | null>(
    null
  );

  /*
    Move or rotate mode.
  */

  const [
    transformMode,
    setTransformMode,
  ] = useState<
    "translate" | "rotate"
  >("translate");

  /*
    Find selected furniture.
  */

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
            margin:
              "5px 0 0 0",
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
          position: [
            8,
            6,
            10,
          ],
          fov: 50,
        }}
        onPointerMissed={() => {
          setSelectedId(null);
        }}
      >
        <Scene
          project={project}
          setProject={setProject}
          selectedId={selectedId}
          setSelectedId={
            setSelectedId
          }
          transformMode={
            transformMode
          }
        />

        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default ThreeDView;