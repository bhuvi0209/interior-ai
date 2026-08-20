import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
} from "@react-three/drei";


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
      {/* Back wall */}
      <mesh position={[0, 2, -4]}>
        <boxGeometry args={[12, 4, 0.2]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-6, 2, 0]}>
        <boxGeometry args={[0.2, 4, 8]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </>
  );
}

function Sofa() {
  return (
    <mesh position={[0, 0.6, -1]}>
      <boxGeometry args={[3, 1, 1]} />
      <meshStandardMaterial color="#777777" />
    </mesh>
  );
}

function CoffeeTable() {
  return (
    <mesh position={[0, 0.4, 1]}>
      <boxGeometry args={[2, 0.3, 1]} />
      <meshStandardMaterial color="#8b5a2b" />
    </mesh>
  );
}

function Chair() {
  return (
    <mesh position={[3, 0.7, 0]}>
      <boxGeometry args={[1, 1.4, 1]} />
      <meshStandardMaterial color="#555555" />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
      />

      <Floor />

      <Walls />

      <Sofa />

      <CoffeeTable />

      <Chair />

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