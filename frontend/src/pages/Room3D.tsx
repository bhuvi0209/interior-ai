import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[10, 8]} />
      <meshStandardMaterial color="lightgray" />
    </mesh>
  );
}

function BackWall() {
  return (
    <mesh position={[0, 2.5, -4]}>
      <boxGeometry args={[10, 5, 0.2]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function LeftWall() {
  return (
    <mesh
      position={[-5, 2.5, 0]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <boxGeometry args={[8, 5, 0.2]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Sofa() {
  return (
    <group position={[0, 0.6, -1]}>
      {/* Seat */}

      <mesh>
        <boxGeometry args={[3, 0.8, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>

      {/* Back */}

      <mesh position={[0, 0.8, 0.35]}>
        <boxGeometry args={[3, 1.2, 0.3]} />
        <meshStandardMaterial color="gray" />
      </mesh>

      {/* Left arm */}

      <mesh position={[-1.4, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>

      {/* Right arm */}

      <mesh position={[1.4, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
}

function Room3D() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
        }}
      >
        <ambientLight intensity={1} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
        />

        <Floor />

        <BackWall />

        <LeftWall />

        <Sofa />

        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default Room3D;