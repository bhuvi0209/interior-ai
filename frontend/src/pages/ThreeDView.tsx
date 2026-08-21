import { Canvas } from "@react-three/fiber";

import {
  OrbitControls,
  Grid,
  Environment,
  useGLTF,
} from "@react-three/drei";

import { useProject } from "../context/ProjectContext";

interface Furniture3DProps {
  name: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  model3D?: string;
}

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

function Walls() {
  return (
    <>
      <mesh position={[0, 2, -4]}>
        <boxGeometry args={[12, 4, 0.2]} />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      <mesh position={[-6, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </>
  );
}

function RealFurnitureModel({
  model3D,
}: {
  model3D: string;
}) {
  const { scene } = useGLTF(model3D);

  return <primitive object={scene} />;
}

function Furniture3D({
  name,
  x,
  y,
  rotation = 0,
  scale = 1,
  model3D,
}: Furniture3DProps) {
  const positionX = (x - 400) / 70;

  const positionZ = (y - 250) / 70;

  const rotationY =
    (rotation * Math.PI) / 180;

  return (
    <group
      position={[
        positionX,
        0,
        positionZ,
      ]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      {model3D ? (
        <RealFurnitureModel
          model3D={model3D}
        />
      ) : (
        getFurnitureModel(name)
      )}
    </group>
  );
}

function getFurnitureModel(name: string) {
  switch (name) {
    case "Sofa":
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[3, 1, 1]} />

          <meshStandardMaterial color="#777777" />
        </mesh>
      );

    case "Coffee Table":
      return (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2, 0.4, 1]} />

          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
      );

    case "Chair":
      return (
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1, 1.4, 1]} />

          <meshStandardMaterial color="#555555" />
        </mesh>
      );

    case "Bed":
      return (
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[3, 0.7, 2]} />

          <meshStandardMaterial color="#aaaaaa" />
        </mesh>
      );

    case "Wardrobe":
      return (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2, 3, 0.7]} />

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
          <boxGeometry args={[1, 1, 1]} />

          <meshStandardMaterial color="#999999" />
        </mesh>
      );
  }
}

function Scene() {
  const { project } = useProject();

  return (
    <>
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
      />

      <Floor />

      <Walls />

      {project.furniture.map((item) => (
        <Furniture3D
          key={item.id}
          name={item.name}
          x={item.x}
          y={item.y}
          rotation={item.rotation}
          scale={item.scale}
          model3D={item.model3D}
        />
      ))}

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

      <Environment preset="apartment" />
    </>
  );
}

function ThreeDView() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
      }}
    >
      <h1
        style={{
          position: "absolute",
          zIndex: 10,
          margin: "20px",
        }}
      >
        3D Room View
      </h1>

      <Canvas
        camera={{
          position: [8, 6, 10],
          fov: 50,
        }}
      >
        <Scene />

        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default ThreeDView;